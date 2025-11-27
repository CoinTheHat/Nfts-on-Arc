import { createConfig, http } from "wagmi";
import { arcTestnet } from "./arcChain";
import { injected } from "wagmi/connectors";

export const config = createConfig({
    chains: [arcTestnet],
    transports: {
        [arcTestnet.id]: http(),
    },
    connectors: [
        injected(),
    ],
});
