import { Chain } from "wagmi/chains";

export const arcTestnet = {
    id: 5042002,
    name: "Arc Testnet",
    nativeCurrency: {
        name: "USDC",
        symbol: "USDC",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [
                "https://rpc.testnet.arc.network",
                "https://rpc.blockdaemon.testnet.arc.network",
                "https://rpc.drpc.testnet.arc.network",
                "https://rpc.quicknode.testnet.arc.network"
            ]
        },
        public: {
            http: [
                "https://rpc.testnet.arc.network",
                "https://rpc.blockdaemon.testnet.arc.network",
                "https://rpc.drpc.testnet.arc.network",
                "https://rpc.quicknode.testnet.arc.network"
            ]
        },
    },
    blockExplorers: {
        default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
    },
} as const satisfies Chain;
