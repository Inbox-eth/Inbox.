import { LoadingOverlay } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppFooter } from "@/components/App/AppFooter";
import { AppHeader } from "@/components/App/AppHeader";
import { ConversationsNavbar } from "@/components/Conversations/ConversationsNavbar";
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
import { useAccount } from "wagmi";
import { useConnection } from "@/contexts/ConnectionProvider";

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, initializing } = useConnection();
  const { setRedirectUrl } = useRedirect();
  const [opened, { toggle }] = useDisclosure(); 
  const { ready, authenticated } = usePrivy();
  const account = useAccount();
  const everReady = useRef(false);
  const everConnected = useRef(false);
  const hydrated = useRef(false);

  // Track if Privy has ever been ready
  if (ready) everReady.current = true;
  // Track if Wagmi has ever been connected
  if (account.status === "connected" && account.address) everConnected.current = true;

  // Set hydrated to true after wallet is ever connected
  if (account.status === "connected") hydrated.current = true;

  const isWagmiLoading = account.status === "connecting";
  const isLoading = !ready || initializing || isWagmiLoading;

  useEffect(() => {
    console.log('AppLayout:', { ready, authenticated, accountAddress: account.address, accountStatus: account.status, everReady: everReady.current, everConnected: everConnected.current });
    // Wait until Privy is ready and Wagmi is not connecting
    if (!ready || account.status === "connecting" || initializing) return;

    // If wallet is disconnected and not authenticated, redirect to /welcome
    if (
      account.status === "disconnected" &&
      !authenticated &&
      location.pathname !== "/welcome" &&
      location.pathname !== "/disconnect"
    ) {
      setRedirectUrl(location.pathname);
      void navigate("/welcome");
      return;
    }

    // If wallet is connected but not authenticated, or hydrated and not authenticated, redirect to /welcome
    if (
      (!authenticated || account.status !== "connected") &&
      hydrated.current &&
      location.pathname !== "/welcome" &&
      location.pathname !== "/disconnect"
    ) {
      setRedirectUrl(location.pathname);
      void navigate("/welcome");
    }
  }, [ready, authenticated, account.status, initializing]);

  if (initializing) {
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
