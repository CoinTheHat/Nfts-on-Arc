"use client";

import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import Layout from "@/components/Layout";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddresses } from "@/lib/factoryAddress";
import Link from "next/link";
import { Abi } from "viem";
import NFTImage from "@/components/NFTImage";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetTrigger } from "@/components/ui/Sheet";
import { supabase } from "@/lib/supabaseClient";

import { useSearchParams } from "next/navigation";

export default function Explore() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortType, setSortType] = useState("newest");
    const [mounted, setMounted] = useState(false);
    const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});
    const [visibleCount, setVisibleCount] = useState(12);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Fetch verified status
        const fetchVerified = async () => {
            const { data } = await supabase.from('collection_moderation').select('address, status');
            const map: Record<string, boolean> = {};
            data?.forEach((item: any) => {
                if (item.status === 'verified') map[item.address.toLowerCase()] = true;
            });
            setVerifiedMap(map);
        };
        fetchVerified();
    }, []);

    // Fetch all collections
    const { data: allFactoriesData, isLoading: factoriesLoading } = useReadContracts({
        contracts: factoryAddresses.map((factoryAddr) => ({
            address: factoryAddr as `0x${string}`,
            abi: NFTFactoryArtifact.abi as unknown as Abi,
            functionName: "getAllCollections",
        })),
    });

    const allCollections = (allFactoriesData || [])
        .flatMap((result) => result.status === "success" ? result.result as string[] : [])
        .reverse();

    // Data Fetching hooks
    // Note: In production this should be batched/paginated better or indexed
    const { data: namesData, isLoading: namesLoading } = useReadContracts({
        contracts: allCollections.map((addr) => ({ address: addr as `0x${string}`, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "name" })),
    });
    const { data: urisData } = useReadContracts({
        contracts: allCollections.map((addr) => ({ address: addr as `0x${string}`, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "collectionURI" })),
    });
    const { data: supplyData } = useReadContracts({
        contracts: allCollections.map((addr) => ({ address: addr as `0x${string}`, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "maxSupply" })),
    });
    const { data: mintedData } = useReadContracts({
        contracts: allCollections.map((addr) => ({ address: addr as `0x${string}`, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "totalMinted" })),
    });

    // Filtering & Sorting Logic
    const processedCollections = allCollections.map((addr, i) => {
        const minted = mintedData?.[i]?.result ? Number(mintedData[i].result) : 0;
        const supply = supplyData?.[i]?.result ? Number(supplyData[i].result) : 0;
        const progress = supply > 0 ? (minted / supply) * 100 : 0;

        return {
            address: addr,
            name: namesData?.[i]?.status === "success" ? String(namesData[i].result) : "",
            uri: urisData?.[i]?.status === "success" ? String(urisData[i].result) : "",
            minted,
            supply,
            progress,
            isVerified: verifiedMap[addr.toLowerCase()] || false,
            originalIndex: i
        };
    }).filter(item => {
        // Search
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            if (!item.name.toLowerCase().includes(query) && !item.address.toLowerCase().includes(query)) return false;
        }
        // Status Filter
        if (statusFilter === "verified" && !item.isVerified) return false;

        return true;
    }).sort((a, b) => {
        if (sortType === "newest") return b.originalIndex - a.originalIndex;
        if (sortType === "oldest") return a.originalIndex - b.originalIndex;
        if (sortType === "progress") return b.progress - a.progress;
        return 0;
    });

    const visibleCollections = processedCollections.slice(0, visibleCount);
    const hasMore = visibleCount < processedCollections.length;
    const isLoading = factoriesLoading || namesLoading;

    // Load More Handler
    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 12);
    };

    // Filters Component (Reusable)
    const FilterControls = () => (
        <div className="flex flex-col gap-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Status</label>
                <Select
                    options={[
                        { label: "All Collections", value: "all" },
                        { label: "Verified Only", value: "verified" },
                    ]}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-surface-2 border-border-default h-11 w-full"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Sort Order</label>
                <Select
                    options={[
                        { label: "Newest Added", value: "newest" },
                        { label: "Oldest Added", value: "oldest" },
                        { label: "Highest Progress", value: "progress" },
                    ]}
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                    className="bg-surface-2 border-border-default h-11 w-full"
                />
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="bg-bg-base min-h-screen pb-20">
                {/* Hero / Header Area */}
                <div className="bg-surface-1 border-b border-border-subtle pt-8 pb-8 md:pt-12 px-4 md:px-6">
                    <div className="max-w-[1200px] mx-auto">
                        <h1 className="text-3xl md:text-4xl font-black text-text-primary mb-3">Explore Collections</h1>
                        <p className="text-text-secondary max-w-2xl leading-relaxed text-sm md:text-base">
                            Discover premium digital assets on Arc. Verified collections, real-time minting data, and exclusive drops.
                        </p>
                    </div>
                </div>

                {/* Toolbar & Grid Container */}
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-6">

                    {/* Desktop Toolbar */}
                    <div className="hidden md:flex bg-surface-1 border border-border-default rounded-xl shadow-lg p-2 gap-4 mb-10 items-center animate-slide-up">
                        <div className="flex-1 w-full">
                            <Input
                                placeholder="Search by name or address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                leftIcon={<span className="text-lg">🔍</span>}
                                className="border-none bg-surface-2 focus:bg-surface-1 transition-colors h-11"
                            />
                        </div>
                        <div className="flex w-auto gap-2">
                            <div className="w-[1px] h-8 bg-border-default mx-2" />
                            <Select
                                options={[
                                    { label: "All Collections", value: "all" },
                                    { label: "Verified Only", value: "verified" },
                                ]}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-surface-2 border-border-default h-11 min-w-[160px]"
                            />
                            <Select
                                options={[
                                    { label: "Newest", value: "newest" },
                                    { label: "Oldest", value: "oldest" },
                                    { label: "High Progress", value: "progress" },
                                ]}
                                value={sortType}
                                onChange={(e) => setSortType(e.target.value)}
                                className="bg-surface-2 border-border-default h-11 min-w-[160px]"
                            />
                        </div>
                    </div>

                    {/* Mobile Toolbar */}
                    <div className="md:hidden flex gap-3 mb-6 animate-slide-up">
                        <div className="flex-1">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                leftIcon={<span>🔍</span>}
                                className="bg-surface-1 border-border-default h-11 shadow-sm"
                            />
                        </div>
                        <SheetTrigger onClick={() => setIsFilterSheetOpen(true)}>
                            <button className="h-11 w-11 bg-surface-1 border border-border-default rounded-lg flex items-center justify-center text-text-primary shadow-sm hover:bg-surface-2 active:scale-95 transition-all">
                                ⚙️
                            </button>
                        </SheetTrigger>
                    </div>

                    {/* Mobile Filter Sheet */}
                    <Sheet
                        isOpen={isFilterSheetOpen}
                        onClose={() => setIsFilterSheetOpen(false)}
                        title="Filter & Sort"
                    >
                        <FilterControls />
                        <div className="mt-8 pt-4 border-t border-border-default">
                            <Button fullWidth size="lg" onClick={() => setIsFilterSheetOpen(false)}>
                                Show {processedCollections.length} Results
                            </Button>
                        </div>
                    </Sheet>

                    {/* Content Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <Card key={i} className="h-[340px] bg-surface-1 border-border-default p-0">
                                    <Skeleton height="240px" className="w-full rounded-t-xl opacity-50" />
                                    <div className="p-4 space-y-3">
                                        <Skeleton height={20} width="70%" />
                                        <div className="flex justify-between">
                                            <Skeleton height={16} width="30%" />
                                            <Skeleton height={16} width="30%" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : visibleCollections.length === 0 ? (
                        <EmptyState
                            title="No Collections Found"
                            description="Try adjusting your filters or search query."
                            icon="🔍"
                            actionLabel="Clear Filters"
                            onAction={() => { setSearchTerm(""); setStatusFilter("all"); }}
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-6 md:gap-y-8">
                                {visibleCollections.map((item) => (
                                    <Link key={item.address} href={`/mint/${item.address}`} className="group">
                                        <Card hover className="h-full bg-surface-1 border-border-default hover:border-border-strong hover:-translate-y-1 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col rounded-2xl">
                                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-alt border-b border-border-subtle">
                                                <NFTImage
                                                    src={item.uri}
                                                    alt={item.name}
                                                    fill
                                                    className="group-hover:scale-105 transition-transform duration-700 ease-out object-cover"
                                                />
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-text-primary truncate pr-2 flex-1 text-base group-hover:text-primary transition-colors" title={item.name}>
                                                        {item.name || "Unknown Collection"}
                                                    </h3>
                                                    {item.isVerified && (
                                                        <Badge variant="warning" className="shrink-0 text-[10px] py-0 px-1.5 h-5">VERIFIED</Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold">
                                                        {item.address.slice(2, 4).toUpperCase()}
                                                    </div>
                                                    <p className="text-xs text-text-tertiary font-mono truncate">
                                                        {item.address.slice(0, 6)}...{item.address.slice(-4)}
                                                    </p>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-border-subtle flex justify-between items-center text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="text-text-tertiary text-[10px] uppercase font-bold tracking-wider mb-0.5">Price</span>
                                                        <span className="text-text-primary font-bold">Free</span>
                                                    </div>

                                                    <div className="flex flex-col items-end">
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${item.progress >= 100 ? 'bg-bg-alt text-text-muted' : 'bg-success/10 text-success'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${item.progress >= 100 ? 'bg-text-muted' : 'bg-success animate-pulse'}`} />
                                                            <span className="font-bold text-[10px] uppercase">{item.progress >= 100 ? 'Ended' : 'Active'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>

                            {hasMore && (
                                <div className="flex justify-center mt-12 md:mt-16">
                                    <button
                                        onClick={handleLoadMore}
                                        className="w-full md:w-auto px-8 py-3.5 bg-surface-1 border border-border-default hover:bg-surface-2 text-text-primary rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Load More Collections
                                        <span className="text-xs opacity-60">({processedCollections.length - visibleCount} remaining)</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}
