import { useLocalStorage } from "@mantine/hooks";
import { type ClientOptions, type XmtpEnv } from "@xmtp/browser-sdk";
import type { Hex } from "viem";

export const useSettings = () => {
  // Read from .env
  const environment: XmtpEnv = (import.meta.env.VITE_XMTP_ENV as XmtpEnv) || "dev";
  const useSCW: boolean = import.meta.env.VITE_USE_SCW === "true";
  const loggingLevel: ClientOptions["loggingLevel"] = (import.meta.env.VITE_LOGGING_LEVEL as ClientOptions["loggingLevel"]) || "off";
  const disableAnalytics: boolean = import.meta.env.VITE_DISABLE_ANALYTICS === "true";

  const [ephemeralAccountKey, setEphemeralAccountKey] =
    useLocalStorage<Hex | null>({
      key: "XMTP_EPHEMERAL_ACCOUNT_KEY",
      defaultValue: null,
      getInitialValueInEffect: false,
    });
  const [encryptionKey, setEncryptionKey] = useLocalStorage({
    key: "XMTP_ENCRYPTION_KEY",
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  const [ephemeralAccountEnabled, setEphemeralAccountEnabled] = useLocalStorage(
    {
      key: "XMTP_USE_EPHEMERAL_ACCOUNT",
      defaultValue: false,
      getInitialValueInEffect: false,
    },
  );
  const [forceSCW, setForceSCW] = useLocalStorage<boolean>({
    key: "XMTP_FORCE_SCW",
    defaultValue: false,
    getInitialValueInEffect: false,
  });
  const [blockchain, setBlockchain] = useLocalStorage<number>({
    key: "XMTP_BLOCKCHAIN",
    defaultValue: 1,
    getInitialValueInEffect: false,
  });

  return {
    blockchain,
    encryptionKey,
    environment,
    ephemeralAccountEnabled,
    ephemeralAccountKey,
    forceSCW,
    loggingLevel,
    useSCW,
    disableAnalytics,
    setBlockchain,
    setEncryptionKey,
    setEphemeralAccountKey,
    setForceSCW,
    setEphemeralAccountEnabled,
  };
};
