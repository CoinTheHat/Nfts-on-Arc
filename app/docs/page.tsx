"use client";

import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default function Docs() {
    return (
        <Layout>
            <div className="bg-bg-base min-h-screen pb-20">
                {/* Hero / Header Area */}
                <div className="bg-surface-1 border-b border-border-default pt-12 pb-12 px-4 md:px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <Badge variant="secondary" className="mb-4">Developer Resources</Badge>
                        <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-6 tracking-tight">Creator Documentation</h1>
                        <p className="text-text-secondary max-w-2xl mx-auto text-lg leading-relaxed">
                            Everything you need to launch, manage, and grow your NFT collection on Arc Network.
                            From zero to sold-out in minutes.
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 md:px-6 mt-12 grid gap-12">

                    {/* Section 1: Getting Started */}
                    <Section title="Getting Started" icon="🚀">
                        <DocItem
                            title="Quick Start Guide"
                            description="Launch your first collection in under 5 minutes using our no-code tools."
                            link="/create"
                            linkText="Start Building →"
                        />
                        <DocItem
                            title="Wallet Setup"
                            description="How to connect your wallet, get testnet funds, and prepare for deployment."
                            link="https://faucet.circle.com/"
                            linkText="Get Testnet Tokens ↗"
                        />
                    </Section>

                    {/* Section 2: Core Concepts */}
                    <Section title="Core Concepts" icon="💡">
                        <DocItem
                            title="Collection Types"
                            description="Understand the difference between Editions (ERC-1155) and Generative Collections (ERC-721)."
                        />
                        <DocItem
                            title="Minting Mechanics"
                            description="Deep dive into public sales, whitelists, and revealed metadata."
                        />
                        <DocItem
                            title="Royalties & Earnings"
                            description="How creator royalties work on Arc and secondary market enforcement."
                        />
                    </Section>

                    {/* Section 3: Smart Contracts */}
                    <Section title="For Developers" icon="🛠️">
                        <DocItem
                            title="Contract Verification"
                            description="How to verify your contract source code on the explorer."
                        />
                        <DocItem
                            title="Metadata Standards"
                            description="JSON schemas for ensuring your NFTs display correctly across all marketplaces."
                        />
                    </Section>

                </div>

                <div className="max-w-4xl mx-auto px-4 md:px-6 mt-20 p-8 rounded-2xl bg-surface-1 border border-border-default text-center">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">Still have questions?</h2>
                    <p className="text-text-secondary mb-6">Our support team is available 24/7 to help you with your launch.</p>
                    <a href="mailto:support@arc.xyz" className="inline-flex h-10 items-center justify-center rounded-full bg-surface-2 px-8 text-sm font-bold text-text-primary shadow-sm hover:bg-surface-3 border border-border-default transition-all">
                        Contact Support
                    </a>
                </div>

            </div>
        </Layout>
    );
}

function Section({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) {
    return (
        <section>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-surface-1 border border-border-default flex items-center justify-center text-xl shadow-sm">
                    {icon}
                </div>
                <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                {children}
            </div>
        </section>
    );
}

function DocItem({ title, description, link, linkText }: { title: string, description: string, link?: string, linkText?: string }) {
    return (
        <div className="p-6 rounded-xl bg-surface-1 border border-border-default hover:border-border-strong hover:shadow-md transition-all group">
            <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">{description}</p>
            {link && (
                <Link href={link} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                    {linkText || "Read More →"}
                </Link>
            )}
        </div>
    );
}
