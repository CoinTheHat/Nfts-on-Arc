import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import NFTImage from "@/components/NFTImage";

interface LatestGridProps {
    collections: `0x${string}`[];
    names: any[];
    uris: any[];
    mintedData: any[];
    supplyData: any[];
    moderationData: Record<string, string>;
    isLoading: boolean;
}

export default function LatestGrid({
    collections, names, uris, mintedData, supplyData, moderationData, isLoading
}: LatestGridProps) {

    const [searchQuery, setSearchQuery] = useState("");
    const [sortType, setSortType] = useState("newest");
    const [statusFilter, setStatusFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(8);

    // Advanced Filtering & Sorting
    const processedCollections = useMemo(() => {
        let result = collections.map((addr, index) => {
            const name = names?.[index]?.result ? String(names[index].result) : "Loading...";
            const image = uris?.[index]?.result ? String(uris[index].result) : null;
            const minted = mintedData?.[index]?.result ? Number(mintedData[index].result) : 0;
            const supply = supplyData?.[index]?.result ? Number(supplyData[index].result) : 0;
            const progress = supply > 0 ? (minted / supply) * 100 : 0;
            const status = moderationData[addr.toLowerCase()] || "pending";

            return { addr, name, image, minted, supply, progress, status, index }; // index preserved for stable sort
        });

        // 1. Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.addr.toLowerCase().includes(query)
            );
        }

        // 2. Status Filter
        if (statusFilter !== "all") {
            if (statusFilter === "verified") {
                result = result.filter(item => item.status === "verified");
            }
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (sortType === "newest") return b.index - a.index; // Assuming original array is roughly chronological (or reverse it if needed)
            if (sortType === "progress") return b.progress - a.progress;
            if (sortType === "minted") return b.minted - a.minted;
            return 0;
        });

        return result;
    }, [collections, names, uris, mintedData, supplyData, moderationData, searchQuery, statusFilter, sortType]);

    const visibleItems = processedCollections.slice(0, visibleCount);
    const hasMore = visibleCount < processedCollections.length;

    if (isLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 py-8">
                {/* Skeleton Loader */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                    <Skeleton className="h-10 w-full md:w-64" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-96 rounded-2xl bg-surface-1 border border-border-default animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-16">

            {/* Header & Description */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary">Latest Collections</h2>
                <p className="text-sm text-text-tertiary mt-1">Explore all collections deployed on Arc Network.</p>
            </div>

            {/* Comprehensive Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-10 bg-surface-1 p-2 rounded-2xl border border-border-default shadow-sm">

                {/* Search */}
                <div className="flex-1">
                    <Input
                        placeholder="Search collections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none bg-transparent focus:ring-0 px-0 h-10"
                        containerClassName="h-full"
                        leftIcon={<span className="text-lg">🔍</span>}
                    />
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-[1px] bg-border-default my-2" />

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 px-2 lg:px-0">
                    <Select
                        options={[
                            { label: "All Status", value: "all" },
                            { label: "Verified Only", value: "verified" },
                        ]}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-surface-2 border-border-default text-sm py-2 h-10 min-w-[140px]"
                    />

                    <Select
                        options={[
                            { label: "Newest", value: "newest" },
                            { label: "Highest Progress", value: "progress" },
                            { label: "Most Mints", value: "minted" },
                        ]}
                        value={sortType}
                        onChange={(e) => setSortType(e.target.value)}
                        className="bg-surface-2 border-border-default text-sm py-2 h-10 min-w-[140px]"
                    />
                </div>
            </div>

            {/* Grid */}
            {visibleItems.length === 0 ? (
                <EmptyState
                    icon="🚀"
                    title="No Collections Found"
                    description="Try adjusting your filters or search query."
                    actionLabel="Clear Filters"
                    onAction={() => { setSearchQuery(""); setStatusFilter("all"); }}
                />
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visibleItems.map((item) => {
                        const isVerified = item.status === 'verified';

                        return (
                            <Link key={item.addr} href={`/mint/${item.addr}`} className="group">
                                <Card hover className="h-full bg-surface-1 border-border-default hover:border-border-strong hover:bg-surface-2 transition-all p-0 overflow-hidden flex flex-col shadow-sm">
                                    {/* Image */}
                                    <div className="relative aspect-square w-full bg-surface-2 overflow-hidden">
                                        <NFTImage src={item.image} alt={item.name} fill className="group-hover:scale-105 transition-transform duration-500" />
                                        {isVerified && (
                                            <div className="absolute top-2 right-2">
                                                <Badge variant="warning" className="py-0.5 px-1.5 text-[10px] font-bold shadow-sm backdrop-blur-md bg-white/80">VERIFIED</Badge>
                                            </div>
                                        )}
                                        {item.progress >= 100 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-success/90 text-white text-center text-xs font-bold py-1 backdrop-blur-sm">
                                                SOLD OUT
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 flex flex-col flex-1 gap-4">
                                        <div>
                                            <h3 className="font-bold text-text-primary truncate" title={item.name}>{item.name}</h3>
                                            <p className="text-xs text-text-tertiary font-mono flex items-center gap-1">
                                                {item.addr.slice(0, 6)}...{item.addr.slice(-4)}
                                            </p>
                                        </div>

                                        <div className="mt-auto space-y-3">
                                            {/* Progress */}
                                            <div>
                                                <div className="flex justify-between text-[10px] uppercase font-bold text-text-tertiary mb-1">
                                                    <span>Minted</span>
                                                    <span className={item.progress >= 100 ? "text-success" : "text-text-primary"}>
                                                        {Math.round(item.progress)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${item.progress >= 100 ? 'bg-success' : 'bg-primary'}`}
                                                        style={{ width: `${Math.min(item.progress, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Mini Stats */}
                                            <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs">
                                                <div className="flex flex-col">
                                                    <span className="text-text-tertiary text-[10px] uppercase">Price</span>
                                                    <span className="font-bold text-text-primary">Free</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-text-tertiary text-[10px] uppercase">Supply</span>
                                                    <span className="font-bold text-text-primary">{item.supply > 0 ? item.supply : "∞"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Pagination Button */}
            {hasMore && (
                <div className="flex justify-center mt-12">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setVisibleCount(visibleCount + 8)}
                        className="px-12 bg-surface-1 border-border-default hover:bg-surface-2 text-text-secondary w-full sm:w-auto"
                    >
                        Load More Collections
                    </Button>
                </div>
            )}
        </div>
    );
}
