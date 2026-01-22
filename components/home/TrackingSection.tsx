import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import NFTImage from "@/components/NFTImage";
import Link from "next/link";
// import { formatUnits } from "viem"; // Unused for now

interface TrackingSectionProps {
    collections: `0x${string}`[];
    names: any[];
    uris: any[];
    mintedData: any[];
    supplyData: any[];
}

export default function TrackingSection({ collections, names, uris, mintedData, supplyData }: TrackingSectionProps) {
    const [timeRange, setTimeRange] = useState<"15m" | "1h" | "3h" | "1d" | "7d">("1d");

    // Calculate stats for each collection to sort/display
    const collectionStats = collections.map((addr, index) => {
        const minted = mintedData?.[index]?.result ? Number(mintedData[index].result) : 0;
        const supply = supplyData?.[index]?.result ? Number(supplyData[index].result) : 0;
        const name = names?.[index]?.result ? String(names[index].result) : "Unknown";
        const image = uris?.[index]?.result ? String(uris[index].result) : null;

        // Mocking volume/floor for now as these require separate indexing/events
        // Using mint progress as a proxy for "activity"/sorting
        const progress = supply > 0 ? (minted / supply) * 100 : 0;

        return {
            rank: 0, // Assigned after sort
            addr,
            name,
            image,
            floor: "Free", // Most on testnet are free
            volume: minted > 0 ? `${minted} Mints` : "0",
            change: supply > 0 ? `+${(minted / supply * 10).toFixed(1)}%` : "0%", // Pseudo-trend based on fill rate
            progress,
            minted
        };
    });

    // Sort by mint progress/count to show "Trending"
    const sortedStats = [...collectionStats]
        .sort((a, b) => b.minted - a.minted)
        .slice(0, 5) // Top 5
        .map((item, i) => ({ ...item, rank: i + 1 }));

    const topMover = sortedStats[0]; // Best performing collection

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-text-primary">Market Pulse</h2>
                        <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                    </div>
                    <p className="text-sm text-text-tertiary">Real-time tracking of top collections.</p>
                </div>

                {/* Time Tabs - Compact & Glassy */}
                <div className="flex bg-surface-1 p-0.5 rounded-lg border border-border-default shadow-sm">
                    {["15m", "1h", "3h", "1d", "7d"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t as any)}
                            className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${timeRange === t ? 'bg-surface-3 text-text-primary shadow-sm ring-1 ring-black/5' : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'}`}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Left Col: Trending Table (2/3 width on desktop) */}
                <div className="lg:col-span-2">
                    <div className="bg-surface-1 border border-border-default rounded-2xl overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 px-6 py-3 border-b border-border-default bg-surface-2/50 text-xs font-bold text-text-tertiary uppercase tracking-wider">
                            <div className="col-span-1">#</div>
                            <div className="col-span-5">Collection</div>
                            <div className="col-span-3 text-right">Floor</div>
                            <div className="col-span-3 text-right">Activity</div>
                        </div>

                        {/* Rows */}
                        {sortedStats.length > 0 ? sortedStats.map((item) => (
                            <Link
                                href={`/mint/${item.addr}`}
                                key={item.addr}
                                className="grid grid-cols-12 px-6 py-4 items-center border-b border-border-subtle last:border-0 hover:bg-surface-2 transition-colors cursor-pointer group"
                            >
                                <div className="col-span-1 font-mono text-text-tertiary text-sm">{item.rank}</div>
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="h-10 w-10 min-w-10 rounded-lg bg-surface-3 overflow-hidden relative border border-border-subtle">
                                        <NFTImage src={item.image} alt={item.name} fill className="group-hover:scale-110 transition-transform" />
                                    </div>
                                    <span className="font-bold text-text-primary group-hover:text-primary transition-colors truncate">{item.name}</span>
                                    {item.rank <= 2 && <Badge variant="secondary" className="scale-75 origin-left">HOT</Badge>}
                                </div>
                                <div className="col-span-3 text-right font-mono text-sm text-text-primary">
                                    {item.floor}
                                </div>
                                <div className="col-span-3 text-right">
                                    <div className="font-bold text-text-primary text-sm">{item.volume}</div>
                                    <div className="text-xs text-success">
                                        {item.change}
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="p-8 text-center text-text-tertiary text-sm">No data available</div>
                        )}
                    </div>
                </div>

                {/* Right Col: Signal Cards (1/3 width) */}
                <div className="flex flex-col gap-4">
                    {/* Signal 1: Top Mover */}
                    {topMover && (
                        <Card className="bg-surface-1 border-border-default p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-4xl">🚀</span>
                            </div>
                            <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-widest mb-1">Top Mover</h3>
                            <p className="text-2xl font-bold text-text-primary mb-1 truncate">{topMover.name}</p>
                            <div className="flex items-center gap-2">
                                <Badge variant="success" className="bg-success/10 text-success border-success/20">+{topMover.minted} New</Badge>
                                <span className="text-xs text-text-tertiary">in 24h</span>
                            </div>
                        </Card>
                    )}

                    {/* Signal 2: Static for now or Featured */}
                    <Card className="bg-surface-1 border-border-default p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-4xl">💎</span>
                        </div>
                        <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-widest mb-1">Highest Sale</h3>
                        <p className="text-2xl font-bold text-text-primary mb-1">Genesis #1</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-mono text-primary">--</span>
                            <span className="text-xs text-text-tertiary">just now</span>
                        </div>
                    </Card>

                    {/* Signal 3 - CTA */}
                    <div className="mt-auto bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-5 border border-primary/20 text-center">
                        <p className="text-sm font-bold text-primary mb-3">Want to get featured?</p>
                        <a
                            href="mailto:partners@arc.xyz?subject=Boost%20Collection%20Inquiry"
                            className="block text-xs font-bold text-bg-base bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg w-full transition-colors shadow-accent"
                        >
                            Get Featured
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
