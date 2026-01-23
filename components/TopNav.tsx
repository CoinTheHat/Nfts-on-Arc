"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletConnectButton from "./WalletConnectButton";
import SearchBar from "./SearchBar";
import { Badge } from "./ui/Badge";

export default function TopNav() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { href: "/create", label: "Create" },
        { href: "/explore", label: "Explore" }, // Assuming explore page exists or points to Home filter
        { href: "/dashboard", label: "Dashboard" },
    ];

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b ${scrolled || mobileMenuOpen
                    ? "bg-background/80 backdrop-blur-xl border-border shadow-lg"
                    : "bg-background/50 backdrop-blur-sm border-transparent"
                    }`}
            >
                <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">

                    {/* Left: Logo & Brand */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:shadow-blue-500/20 group-hover:scale-105 transition-all">
                                A
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:text-white transition-colors whitespace-nowrap">
                                Arc NFTs
                            </span>
                        </Link>
                        <Badge variant="secondary" className="hidden lg:inline-flex text-[10px] py-0.5 px-2 bg-purple-500/10 text-purple-300 border-purple-500/20 tracking-wider font-mono">
                            TESTNET
                        </Badge>
                    </div>

                    {/* Center: Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1 justify-center flex-1">
                        <div className="flex items-center gap-1 bg-surface/50 border border-white/5 rounded-full px-1.5 py-1.5 p-1 backdrop-blur-md">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`
                        px-5 py-2 rounded-full text-sm font-medium transition-all relative
                        ${isActive
                                                ? "text-white"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                            }
                      `}
                                    >
                                        {link.label}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-white/10 rounded-full animate-fade-in -z-10" />
                                        )}
                                        {/* Using border-bottom approach for active state if preferred, but pill is cleaner here. User asked for "underline/gradient". Let's try gradient text or bottom border. */}
                                        {isActive && (
                                            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                                        )}
                                    </Link>
                                );
                            })}
                            <a
                                href="https://faucet.circle.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Faucet
                            </a>
                        </div>
                    </nav>

                    {/* Right: Search + Wallet */}
                    <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                        <div className="w-64 xl:w-80">
                            <SearchBar />
                        </div>
                        <WalletConnectButton />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-4">
                        <div className="scale-75 origin-right">
                            <WalletConnectButton />
                        </div>
                        <button
                            className="p-2 text-gray-400 hover:text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg
                                className="w-7 h-7"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {mobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-30 pt-24 px-6 bg-background/95 backdrop-blur-2xl md:hidden flex flex-col gap-6 animate-fade-in">
                    <SearchBar />

                    <nav className="flex flex-col gap-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`
                      px-4 py-4 rounded-xl text-lg font-bold transition-all flex justify-between items-center
                      ${isActive
                                            ? "bg-white/5 text-white border border-white/10"
                                            : "text-gray-400 hover:text-white border border-transparent"
                                        }
                    `}
                                >
                                    {link.label}
                                    {isActive && <span className="w-2 h-2 bg-primary rounded-full" />}
                                </Link>
                            );
                        })}
                        <a
                            href="https://faucet.circle.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-4 rounded-xl text-lg font-bold text-gray-400 hover:text-white border border-transparent flex justify-between items-center"
                        >
                            Faucet ↗
                        </a>
                    </nav>

                    <div className="mt-auto mb-8 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Badge variant="secondary">Arc Testnet</Badge>
                            <span className="text-xs text-gray-500">v0.1.0</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
