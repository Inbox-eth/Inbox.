import { LoadingOverlay } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useDisconnect } from "wagmi";
import { useXMTP } from "@/contexts/XMTPContext";
import { useSettings } from "@/hooks/useSettings";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { usePrivy } from "@privy-io/react-auth";

export const Disconnect: React.FC = () => {
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const { setEphemeralAccountEnabled, ephemeralAccountEnabled } = useSettings();
  const { disconnect: disconnectClient } = useXMTP();
  const { logout } = usePrivy();

  useEffect(() => {
    const doLogout = async () => {
      // Block ephemeral logic during logout
      localStorage.setItem("loggingOut", "true");

      // 1. Clear ephemeral state
      setEphemeralAccountEnabled(false);

      // 2. Await Privy logout
      await logout();

      // 3. Await wagmi disconnect
      await new Promise((resolve) => {
        disconnect(undefined, {
          onSuccess: resolve,
        });
      });

      // 4. Disconnect XMTP
      disconnectClient();

      // 5. Remove loggingOut flag
      localStorage.removeItem("loggingOut");

      // 6. Navigate to welcome screen
      navigate("/");
    };

    void doLogout();
  }, []);

  return (
    <CenteredLayout>
      <LoadingOverlay visible={true} />
    </CenteredLayout>
  );
};
