"use client";

import { useEffect, useState } from "react";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/arcChain";
import { useUsername, formatAddress } from "@/lib/useUsername";

export default function WalletConnectButton() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, error: connectError, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const isWrongNetwork = isConnected && chainId !== arcTestnet.id;
    const { switchChain, error: switchError } = useSwitchChain();
    const { username } = useUsername(address);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSwitch = async () => {
        try {
            await switchChain({ chainId: arcTestnet.id });
        } catch (e) {
            console.error("Failed to switch chain:", e);
        }
    };

    if (!mounted) return null;

    if (isConnected) {
        return (
            <div className="flex items-center gap-4">
                {isWrongNetwork && (
                    <button
                        onClick={handleSwitch}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <span>⚠️ Wrong Network</span>
                        <span className="underline">Switch to Arc</span>
                    </button>
                )}
                {switchError && (
                    <span className="text-red-400 text-xs max-w-[100px] truncate" title={switchError.message}>
                        {switchError.message}
                    </span>
                )}
                <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-gray-200 font-mono">
                        {formatAddress(address!, username)}
                    </span>
                </div>
                <button
                    onClick={() => disconnect()}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end">
            <button
                onClick={() => connect({ connector: connectors[0] })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
            >
                {isPending ? "Connecting..." : "Connect Wallet"}
            </button>
            {connectError && (
                <span className="text-red-400 text-xs mt-1 max-w-[200px] text-right">
                    {connectError.message}
                </span>
            )}
        </div>
    );
}
