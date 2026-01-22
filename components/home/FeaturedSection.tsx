import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import NFTImage from "@/components/NFTImage";

interface FeaturedSectionProps {
    collections: `0x${string}`[];
    names: any[];
    uris: any[];
    mintedData: any[]; // Add minted data
    supplyData: any[]; // Add supply data
}

export default function FeaturedSection({ collections, names, uris, mintedData, supplyData }: FeaturedSectionProps) {
    if (!collections || collections.length === 0) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-16">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Featured Mints</h2>
                    <p className="text-text-tertiary mt-2 text-sm">Curated selection of verified collections.</p>
                </div>
                <Link
                    href="/explore"
                    className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors uppercase tracking-wider"
                >
                    View All
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-3 gap-8">
                {collections.map((addr, index) => {
                    const name = names?.[index]?.result ? String(names[index].result) : "Loading...";
                    const image = uris?.[index]?.result ? String(uris[index].result) : null;

                    // Stats logic
                    const minted = mintedData?.[index]?.result ? Number(mintedData[index].result) : 0;
                    const supply = supplyData?.[index]?.result ? Number(supplyData[index].result) : 0;
                    const progress = supply > 0 ? Math.min(100, (minted / supply) * 100) : 0;

                    return (
                        <Link key={addr} href={`/mint/${addr}`} className="group">
                            <Card
                                hover
                                className="h-full bg-surface-1 border-border-default hover:border-border-hover hover:bg-surface-2 transition-all duration-300 p-0 overflow-hidden shadow-sm hover:shadow-md flex flex-col"
                            >
                                {/* Image Area - Fixed Aspect Ratio */}
                                <div className="relative aspect-square w-full overflow-hidden bg-bg-alt">
                                    <NFTImage
                                        src={image}
                                        alt={name}
                                        fill
                                        className="group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />

                                    {/* Badges - Refined Small & Readable */}
                                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                                        <Badge variant="warning" className="backdrop-blur-md shadow-sm border border-white/20 text-[10px] font-bold py-0.5 px-2 tracking-wide text-warning bg-white/90">VERIFIED</Badge>
                                    </div>

                                    {/* Gradient Overlay for Text Readability - Always dark for white text */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                </div>

                                {/* Card Action Area - Informative */}
                                <div className="p-5 flex flex-col gap-4 flex-1">

                                    {/* Title & Creator */}
                                    <div>
                                        <h3 className="text-lg font-bold text-text-primary mb-1 truncate">{name}</h3>
                                        <p className="text-xs text-text-tertiary">by <span className="text-primary font-mono bg-primary-muted px-1.5 py-0.5 rounded-sm">{addr.slice(0, 6)}...{addr.slice(-4)}</span></p>
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        {/* Progress Bar with Stats */}
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-text-tertiary mb-1.5">
                                                <span>Total Minted</span>
                                                <span className="text-text-primary">{Math.round(progress)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden border border-border-subtle">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1 text-[10px] text-text-tertiary">
                                                <span>{minted.toLocaleString()} Mints</span>
                                                <span>{supply > 0 ? supply.toLocaleString() : "∞"} Max</span>
                                            </div>
                                        </div>

                                        {/* Price Row */}
                                        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-text-tertiary">Price</span>
                                                <span className="text-sm font-bold text-text-primary">Free / 0 ETH</span>
                                            </div>
                                            {/* 1 CTA Button */}
                                            <Button size="sm" variant="primary" className="px-6 shadow-sm hover:shadow-accent backdrop-blur-none transition-all">
                                                Mint
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
