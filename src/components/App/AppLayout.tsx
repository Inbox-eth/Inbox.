import { LoadingOverlay } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppFooter } from "@/components/App/AppFooter";
import { AppHeader } from "@/components/App/AppHeader";
import { ConversationsNavbar } from "@/components/Conversations/ConversationsNavbar";
import { useXMTP } from "@/contexts/XMTPContext";
import { useRedirect } from "@/hooks/useRedirect";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import {
  MainLayout,
  MainLayoutContent,
  MainLayoutFooter,
  MainLayoutHeader,
  MainLayoutNav,
} from "@/layouts/MainLayout";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSignMessage } from "wagmi";
import { useSettings } from "@/hooks/useSettings";
import { createEOASigner, createSCWSigner } from "@/helpers/createSigner";
import { hexToUint8Array } from "uint8array-extras";

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, initializing, initialize } = useXMTP();
  const { setRedirectUrl } = useRedirect();
  const [opened, { toggle }] = useDisclosure(); 
  const { ready, authenticated } = usePrivy();
  const account = useAccount();
  const everReady = useRef(false);
  const everConnected = useRef(false);
  const { signMessageAsync } = useSignMessage();
  const {
    encryptionKey,
    environment,
    loggingLevel,
    useSCW,
  } = useSettings();

  // Track if Privy has ever been ready
  if (ready) everReady.current = true;
  // Track if Wagmi has ever been connected
  if (account.status === "connected" && account.address) everConnected.current = true;

  const isWagmiLoading = account.status === "connecting";
  const isLoading = !ready || initializing || isWagmiLoading;

  useEffect(() => {
    console.log('AppLayout:', { ready, authenticated, accountAddress: account.address, accountStatus: account.status, everReady: everReady.current, everConnected: everConnected.current });
    if (isLoading) return;
    // Only run redirect logic if both have ever been ready/connected
    if (!everReady.current || !everConnected.current) return;
    if (!authenticated || !account.address) {
      if (
        location.pathname !== "/welcome" &&
        location.pathname !== "/disconnect"
      ) {
        setRedirectUrl(location.pathname);
      }
      void navigate("/welcome");
    }
    // If authenticated and wallet connected, but no client, let Welcome handle client creation
  }, [authenticated, account.address, isLoading]);

  // Initialize XMTP client for authenticated, connected users if not already initialized
  useEffect(() => {
    if (
      authenticated &&
      account.address &&
      !client &&
      everReady.current &&
      everConnected.current
    ) {
      initialize({
        dbEncryptionKey: encryptionKey
          ? hexToUint8Array(encryptionKey)
          : undefined,
        env: environment,
        loggingLevel,
        signer: useSCW
          ? createSCWSigner(
              account.address,
              (message) => signMessageAsync({ message }),
              account.chainId
            )
          : createEOASigner(account.address, (message) => signMessageAsync({ message })),
      });
    }
  }, [authenticated, account.address, client, everReady.current, everConnected.current, encryptionKey, environment, loggingLevel, useSCW, signMessageAsync, account.chainId, initialize]);

  if (isLoading) {
    return (
      <CenteredLayout>
        <LoadingOverlay visible />
      </CenteredLayout>
    );
  }

  return !client ? (
    <CenteredLayout>
      <LoadingOverlay visible />
    </CenteredLayout>
  ) : (
    <MainLayout>
      <MainLayoutHeader>
        <AppHeader client={client} opened={opened} toggle={toggle} />
      </MainLayoutHeader>
      <MainLayoutNav opened={opened} toggle={toggle}>
        <ConversationsNavbar />
      </MainLayoutNav>
      <MainLayoutContent>
        <Outlet context={{ client }} />
      </MainLayoutContent>
      <MainLayoutFooter>
        <AppFooter />
      </MainLayoutFooter>
    </MainLayout>
  );
};
