"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/arcChain";
import { useUsername, formatAddress } from "@/lib/useUsername";
import Link from "next/link";
import { Button } from "./ui/Button";
import { useClickAway } from "react-use"; // Optional, but I can implement clean click-outside easily

export default function WalletConnectButton() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, error: connectError, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const isWrongNetwork = isConnected && chainId !== arcTestnet.id;
    const { switchChain } = useSwitchChain();
    const { username, avatarUrl } = useUsername(address);

    const [mounted, setMounted] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        console.log("[WalletButton] avatarUrl changed:", avatarUrl);
    }, [avatarUrl]);

    // Simple click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSwitch = async () => {
        try {
            await switchChain({ chainId: arcTestnet.id });
        } catch (e) {
            console.error("Failed to switch chain:", e);
        }
    };

    if (!mounted) {
        return <Button isLoading variant="ghost" size="sm">Loading...</Button>;
    }

    if (isConnected) {
        if (isWrongNetwork) {
            return (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={handleSwitch}
                    leftIcon={<span>⚠️</span>}
                    className="shake"
                >
                    Switch Network
                </Button>
            );
        }

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`
                        flex items-center gap-3 bg-surface hover:bg-surface-hover border border-border hover:border-border-hover 
                        pl-3 pr-4 py-2 rounded-full transition-all group cursor-pointer
                        ${dropdownOpen ? "ring-2 ring-primary/50 border-primary" : ""}
                    `}
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={username || "User"}
                            className="w-6 h-6 rounded-full object-cover border border-border"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
                            {username ? username[0].toUpperCase() : "U"}
                        </div>
                    )}
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-white font-mono leading-none">
                            {username || formatAddress(address!)}
                        </span>
                        <span className="text-[10px] text-gray-400 leading-none flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Connected
                        </span>
                    </div>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in origin-top-right">
                        <div className="p-2">
                            <div className="px-3 py-2 border-b border-border/50 mb-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Wallet</p>
                                <p className="text-sm font-mono text-gray-300 truncate">{address}</p>
                            </div>

                            <Link
                                href="/profile"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <span>👤</span> Profile
                            </Link>

                            <Link
                                href="/dashboard"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <span>🖼️</span> My Collections
                            </Link>

                            <div className="h-px bg-border/50 my-1" />

                            <button
                                onClick={() => disconnect()}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                            >
                                <span>🚪</span> Disconnect
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <Button
                onClick={() => connect({ connector: connectors[0] })}
                isLoading={isPending}
                className="shadow-lg shadow-primary/20 rounded-full px-6"
                variant="primary"
            >
                Connect Wallet
            </Button>
            {connectError && (
                <span className="absolute right-0 top-full mt-1 text-error text-xs max-w-[200px] text-right bg-black/80 p-1 rounded">
                    {connectError.message}
                </span>
            )}
        </div>
    );
}
