import "@mantine/core/styles.css";
import "./globals.css";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import pkg from "@xmtp/browser-sdk/package.json";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { createConfig, WagmiProvider } from "@privy-io/wagmi";
import { http } from "wagmi";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  linea,
  lineaSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
  worldchain,
  worldchainSepolia,
  zksync,
  zksyncSepoliaTestnet,
} from "wagmi/chains";
import {
  injected,
} from "wagmi/connectors";
import { App } from "@/components/App/App";
import { XMTPProvider } from "@/contexts/XMTPContext";
import { PrivyProvider } from "@privy-io/react-auth";

const queryClient = new QueryClient();

export const config = createConfig({
  connectors: [
    injected(),
  ],
  chains: [
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    linea,
    lineaSepolia,
    mainnet,
    optimism,
    optimismSepolia,
    polygon,
    polygonAmoy,
    sepolia,
    worldchain,
    worldchainSepolia,
    zksync,
    zksyncSepoliaTestnet,
  ],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [linea.id]: http(),
    [lineaSepolia.id]: http(),
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [sepolia.id]: http(),
    [worldchain.id]: http(),
    [worldchainSepolia.id]: http(),
    [zksync.id]: http(),
    [zksyncSepoliaTestnet.id]: http(),
  },
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <PrivyProvider appId={import.meta.env.VITE_PRIVY_APP_ID || "YOUR_PRIVY_APP_ID"}>
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <MantineProvider defaultColorScheme="auto">
          <XMTPProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </XMTPProvider>
        </MantineProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </PrivyProvider>,
);

console.log("[xmtp.chat] XMTP Browser SDK version:", pkg.version);
