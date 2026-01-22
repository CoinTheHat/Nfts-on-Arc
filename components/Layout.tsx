"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useUsername } from "@/lib/useUsername";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AnimatePresence, motion } from "framer-motion";
import { useBalance } from "wagmi";
import { formatEther } from "viem";

function BalanceDisplay({ address }: { address?: `0x${string}` }) {
    const { data } = useBalance({ address });
    return <>{data ? `${Number(formatEther(data.value)).toFixed(3)} ${data.symbol}` : "0.000 ETH"}</>;
}

// --- Mock UI Components for Layout (to ensure self-contained polish) ---
// In a real app these are in @components/ui. I'll implement simplified versions here for the mobile drawer logic.

function MobileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { isConnected, address } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const pathname = usePathname();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                    />
                    <motion.div
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-3/4 max-w-[300px] bg-gray-900 border-l border-gray-800 z-50 p-6 flex flex-col md:hidden"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-xl font-black text-white tracking-tighter">ARC</span>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="flex-1 space-y-6">
                            <nav className="flex flex-col gap-4">
                                {[
                                    { href: "/", label: "Home" },
                                    { href: "/explore", label: "Explore" },
                                    { href: "/create", label: "Create" },
                                    { href: "/dashboard", label: "Dashboard" },
                                ].map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={onClose}
                                        className={`text-lg font-bold ${pathname === link.href ? "text-primary" : "text-gray-400"}`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <div className="pt-6 border-t border-gray-800">
                            {!isConnected ? (
                                <Button fullWidth size="lg" onClick={() => connect({ connector: injected() })}>
                                    Connect Wallet
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-800 rounded-xl flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-white truncate">{address}</p>
                                            <p className="text-xs text-green-400">Connected</p>
                                        </div>
                                    </div>
                                    <Button fullWidth variant="secondary" onClick={() => disconnect()}>Disconnect</Button>
                                    <Link href="/profile" onClick={onClose}>
                                        <Button fullWidth variant="outline" className="mt-2">View Profile</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function UserIdAvatar({ address, username, onClick }: { address: string | undefined, username: string | null, onClick: () => void }) {
    return (
        <div onClick={onClick} className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 cursor-pointer border-2 border-transparent hover:border-white transition-all shadow-lg overflow-hidden relative group">
            <div className="w-full h-full flex items-center justify-center text-sm text-white font-bold opacity-90 group-hover:opacity-100">
                {username ? username[0].toUpperCase() : "👤"}
            </div>
        </div>
    );
}

export default function Layout({ children }: { children: ReactNode }) {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const { username } = useUsername(address);
    const pathname = usePathname();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">

            {/* Top Navigation */}
            {/* Top Navigation - Refined Glass Effect */}
            <header className="sticky top-0 z-40 w-full border-b transition-all duration-300 bg-[rgba(244,246,251,0.75)] backdrop-blur-md border-[rgba(15,23,42,0.08)] shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
                <div className="container mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between">

                    {/* Logo: Orbit Arc Concept */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-8 h-8 flex items-center justify-center">
                                {/* Orbit Ring */}
                                <div className="absolute inset-0 rounded-full border-[1.5px] border-primary border-t-transparent -rotate-45 group-hover:rotate-0 transition-transform duration-700 ease-out opacity-80" />
                                {/* Node on Orbit */}
                                <div className="absolute top-0 right-0.5 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] group-hover:scale-125 transition-transform" />
                                {/* Core Triangle */}
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-primary relative z-10" />
                            </div>
                            <span className="text-xl font-bold tracking-[0.02em] text-primary font-sans">ARC</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-2">
                            {[
                                { href: "/explore", label: "Explore" },
                                { href: "/create", label: "Create" },
                                { href: "/dashboard", label: "Dashboard" },
                            ].map(link => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`
                                            px-3 py-1.5 rounded-full text-sm font-bold transition-all
                                            ${isActive
                                                ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                                                : "text-text-secondary hover:bg-slate-200/50 hover:text-text-primary"
                                            }
                                        `}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Desktop Right: Search & Connect */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative group">
                            <input
                                placeholder="Search collections, creators..."
                                className="bg-[rgba(255,255,255,0.85)] border border-[rgba(15,23,42,0.10)] rounded-full pl-10 pr-4 py-2 text-sm w-48 lg:w-[320px] transition-all outline-none focus:ring-[4px] focus:ring-accent/10 focus:border-accent/40 text-text-primary placeholder:text-text-tertiary shadow-sm"
                            />
                            <span className="absolute left-3 top-2.5 text-text-tertiary text-xs group-focus-within:text-accent transition-colors">🔍</span>
                        </div>

                        {/* Hydration safe zone */}
                        {!isMounted ? (
                            <div className="w-32 h-9 bg-gray-200 rounded-lg animate-pulse" />
                        ) : !isConnected ? (
                            <Button onClick={() => connect({ connector: injected() })} size="sm" className="shadow-lg shadow-primary/10 hover:shadow-primary/20 bg-primary text-white border-none">
                                Connect Wallet
                            </Button>
                        ) : (
                            <div className="relative">
                                {/* Unified Wallet Pill */}
                                <div className="hidden md:flex items-center bg-white/90 backdrop-blur border border-[rgba(15,23,42,0.08)] rounded-full px-1.5 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] transition-all cursor-default group">
                                    {/* Network & Balance */}
                                    <div className="flex items-center gap-3 px-3 border-r border-border-subtle mr-1">
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-700">Arc</span>
                                        </div>
                                        <div className="w-[1px] h-4 bg-border-subtle/50 mx-1" />
                                        <span className="text-sm font-bold text-text-primary font-mono tracking-tight">
                                            <BalanceDisplay address={address} />
                                        </span>
                                    </div>

                                    {/* User Profile Trigger */}
                                    <div
                                        className="flex items-center gap-2 pl-1 pr-2 cursor-pointer hover:bg-black/5 rounded-full transition-colors py-1"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold border-2 border-white shadow-sm">
                                            {username ? username[0].toUpperCase() : "👤"}
                                        </div>
                                        <span className="text-sm font-bold text-text-primary max-w-[100px] truncate">
                                            {username || "User"}
                                        </span>
                                    </div>
                                </div>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-surface-1 border border-border-default rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-1">
                                        <div className="px-3 py-2 border-b border-border-subtle mb-1">
                                            <p className="text-xs font-bold text-text-tertiary uppercase">Signed in as</p>
                                            <p className="text-sm font-bold text-text-primary truncate">{username || "User"}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <span>👤</span> My Profile
                                        </Link>
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <span>📊</span> Dashboard
                                        </Link>
                                        <div className="h-[1px] bg-border-subtle my-1" />
                                        <button
                                            onClick={() => { disconnect(); setIsUserMenuOpen(false); }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-error/80 hover:text-error hover:bg-error/5 rounded-lg transition-colors text-left"
                                        >
                                            <span>🚪</span> Disconnect Wallet
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Right: Search Icon + Hamburger */}
                    <div className="flex md:hidden items-center gap-4">
                        <button className="text-text-secondary">🔍</button>
                        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 text-text-primary">
                            <div className="space-y-1.5">
                                <div className="w-6 h-0.5 bg-current rounded-full" />
                                <div className="w-6 h-0.5 bg-current rounded-full" />
                                <div className="w-6 h-0.5 bg-current rounded-full" />
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            {/* Main Content */}
            <main className="flex-1 w-full relative">
                {children}
            </main>

            {/* Footer */}
            {/* Footer - Marketplace Style */}
            <footer className="border-t border-border-default bg-bg-alt py-12 lg:py-16 mt-16 md:mt-24">
                <div className="container mx-auto px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    <div className="col-span-2">
                        <h3 className="text-xl font-black mb-4 text-text-primary">ARC NETWORK</h3>
                        <p className="text-text-secondary max-w-xs text-sm leading-relaxed">
                            The premium NFT marketplace for the next generation of digital creators. Built for speed, designed for art.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-text-primary mb-4">Marketplace</h4>
                        <ul className="space-y-3 text-sm text-text-tertiary">
                            <li><Link href="/explore" className="hover:text-primary transition-colors">All NFTs</Link></li>
                            <li><Link href="/rankings" className="hover:text-primary transition-colors">Rankings</Link></li>
                            <li><Link href="/activity" className="hover:text-primary transition-colors">Activity</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-text-primary mb-4">Resources</h4>
                        <ul className="space-y-3 text-sm text-text-tertiary">
                            <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-4 md:px-6 mt-12 pt-8 border-t border-border-subtle text-center text-text-muted text-xs">
                    © 2026 Arc Network. All rights reserved.
                </div>
            </footer>
        </div >
    );
}
