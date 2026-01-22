import React from "react";
import Link from "next/link";
import { Badge } from "./ui/Badge";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-surface/30 mt-auto pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8 mb-16">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                                A
                            </div>
                            <span className="text-lg font-bold text-white">Arc Launchpad</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            The premium marketplace and launchpad for the next generation of digital collectibles.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Product</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/create" className="hover:text-primary transition-colors">Create Collection</Link></li>
                            <li><Link href="/explore" className="hover:text-primary transition-colors">Explore</Link></li>
                            <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><a href="https://docs.arc.network" className="hover:text-primary transition-colors">Documentation</a></li>
                        </ul>
                    </div>

                    {/* Community */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Community</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-primary transition-colors">Twitter / X</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Discord</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Licenses</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Built on</span>
                        <Badge variant="outline" className="font-bold border-gray-700 text-gray-300">ARC NETWORK</Badge>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Systems Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
