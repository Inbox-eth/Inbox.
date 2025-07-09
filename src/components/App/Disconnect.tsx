import { LoadingOverlay } from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useDisconnect } from "wagmi";
import { useXMTP } from "@/contexts/XMTPContext";
import { useSettings } from "@/hooks/useSettings";
import { CenteredLayout } from "@/layouts/CenteredLayout";
import { usePrivy } from "@privy-io/react-auth";
import { useConnection } from "@/contexts/ConnectionProvider";

export const Disconnect: React.FC = () => {
  const navigate = useNavigate();
  const { handleDisconnect } = useConnection();

  useEffect(() => {
    const doLogout = async () => {
      await handleDisconnect();
      navigate("/welcome");
    };

    void doLogout();
  }, []);

  return (
    <CenteredLayout>
      <LoadingOverlay visible={true} />
    </CenteredLayout>
  );
};
