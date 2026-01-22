import { createConfig, http, fallback } from "wagmi";
import { arcTestnet } from "./arcChain";
import { injected } from "wagmi/connectors";

const transportConfig = {
    batch: { wait: 500, batchSize: 100 },
    retryCount: 3,
    retryDelay: 1000,
};

export const config = createConfig({
    chains: [arcTestnet],
    transports: {
        [arcTestnet.id]: fallback([
            http("https://rpc.testnet.arc.network", transportConfig),
            http("https://rpc.blockdaemon.testnet.arc.network", transportConfig),
            http("https://rpc.drpc.testnet.arc.network", transportConfig),
            http("https://rpc.quicknode.testnet.arc.network", transportConfig),
        ]),
    },
    connectors: [
        injected(),
    ],
    // Increase polling interval to reduce 429s (Default is 4s)
    pollingInterval: 12_000,
    ssr: true,
});
