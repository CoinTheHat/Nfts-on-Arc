"use client";

import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import { useParams } from "next/navigation";
import Layout from "@/components/Layout";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { formatEther } from "viem";
import Link from "next/link";
import NFTImage from "@/components/NFTImage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Abi } from "viem";

export default function CollectionPage() {
    const params = useParams();
    const address = params.address as `0x${string}`;
    const [activeTab, setActiveTab] = useState("items");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const contractConfig = {
        address,
        abi: NFTCollectionArtifact.abi as unknown as Abi,
    };

    const { data: contractData, isLoading } = useReadContracts({
        contracts: [
            { ...contractConfig, functionName: "name" },
            { ...contractConfig, functionName: "symbol" },
            { ...contractConfig, functionName: "totalSupply" }, // Minted count
            { ...contractConfig, functionName: "collectionURI" },
            { ...contractConfig, functionName: "owner" },
            { ...contractConfig, functionName: "maxSupply" },
            { ...contractConfig, functionName: "mintPrice" },
        ],
    });

    const [name, symbol, totalSupply, collectionURI, owner, maxSupply, mintPrice] = contractData || [];

    // Derived Stats
    const mintedCount = totalSupply?.result ? Number(totalSupply.result) : 0;
    const maxCount = maxSupply?.result ? Number(maxSupply.result) : 0;
    const price = mintPrice?.result ? formatEther(mintPrice.result as bigint) : "0";
    const percentMinted = maxCount > 0 ? (mintedCount / maxCount) * 100 : 0;

    // Mock Items for grid visualization (since we don't have an indexer)
    // We'll generate "Ghost" items that represent potential NFTs
    const items = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: `${name?.result || "Item"} #${i + 1}`,
        price: price
    }));

    return (
        <Layout>
            {/* Full Width Banner */}
            <div className="relative h-[300px] md:h-[400px] w-full bg-gray-900 border-b border-gray-800">
                {collectionURI?.result ? (
                    <NFTImage
                        src={String(collectionURI.result)}
                        alt="Banner"
                        fill
                        className="object-cover opacity-60 blur-md"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-900 via-gray-900 to-purple-900 opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>

            <div className="container mx-auto px-4 relative -mt-32 z-10 mb-12">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row items-end gap-8 mb-8">
                    <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl border-4 border-background bg-gray-800 shadow-2xl overflow-hidden relative group">
                        <NFTImage
                            src={collectionURI?.result as string}
                            alt="Logo"
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>

                    <div className="flex-1 mb-2">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-md">
                                {isLoading ? <Skeleton width={200} /> : (name?.result as string)}
                            </h1>
                            {name?.result && <Badge variant="warning" className="shadow-lg">VERIFIED</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span className="font-mono text-primary font-bold">BY {(owner?.result as string || "").slice(0, 6)}...</span>
                            <span className="w-1 h-1 bg-gray-500 rounded-full" />
                            <span>Created 2024</span>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        {/* Socials can go here */}
                        <Button
                            size="lg"
                            href={`/mint/${address}`}
                            className="flex-1 md:flex-none shadow-lg shadow-primary/20"
                            leftIcon={<span>✨</span>}
                        >
                            Mint Page
                        </Button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm mb-12">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Floor Price</p>
                        <p className="text-2xl font-black text-white">{price} ARC</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Volume</p>
                        <p className="text-2xl font-black text-white">--</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Items</p>
                        <p className="text-2xl font-black text-white">{maxCount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Minted</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-black text-white">{Math.round(percentMinted)}%</p>
                            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden max-w-[100px]">
                                <div className="h-full bg-green-500" style={{ width: `${percentMinted}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex items-start gap-8">
                    {/* Sidebar Filter (Desktop) */}
                    <div className={`hidden md:block w-72 flex-shrink-0 transition-all ${isSidebarOpen ? "opacity-100" : "hidden"}`}>
                        <div className="sticky top-24 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white">Filters</h3>
                                <button className="text-xs text-primary hover:underline">Clear All</button>
                            </div>

                            <div className="border border-gray-800 rounded-xl overflow-hidden">
                                <div className="bg-gray-900/50 p-3 border-b border-gray-800 font-bold text-sm flex justify-between cursor-pointer hover:bg-gray-800 transition-colors">
                                    Status
                                    <span>▼</span>
                                </div>
                                <div className="p-3 bg-background space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-700 bg-gray-900" />
                                        Buy Now
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer">
                                        <input type="checkbox" className="rounded border-gray-700 bg-gray-900" />
                                        New
                                    </label>
                                </div>

                                <div className="bg-gray-900/50 p-3 border-b border-gray-800 border-t font-bold text-sm flex justify-between cursor-pointer hover:bg-gray-800 transition-colors">
                                    Price
                                    <span>▼</span>
                                </div>
                                <div className="p-3 bg-background flex items-center gap-2">
                                    <Input placeholder="Min" className="h-8 text-xs bg-gray-900" containerClassName="m-0" />
                                    <span className="text-gray-500">to</span>
                                    <Input placeholder="Max" className="h-8 text-xs bg-gray-900" containerClassName="m-0" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="flex-1">
                        {/* Tabs & Search */}
                        <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-xl border-b border-gray-800 mb-6 -mx-4 md:mx-0 px-4 md:px-0 pt-4 pb-0">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div className="flex gap-6">
                                    {["items", "activity", "analytics"].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`pb-4 text-sm font-bold border-b-2 transition-colors capitalize ${activeTab === tab ? "text-white border-primary" : "text-gray-400 border-transparent hover:text-white"}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                                        className="hidden md:flex"
                                    >
                                        {isSidebarOpen ? "❮ Hide Filters" : "Filter ❯"}
                                    </Button>
                                    <Input
                                        placeholder="Search items..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-10 bg-gray-900/50 border-gray-800 w-64"
                                        containerClassName="m-0"
                                    />
                                </div>
                            </div>
                        </div>

                        {activeTab === "items" && (
                            <div className={`grid gap-4 ${isSidebarOpen ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-4 xl:grid-cols-5"}`}>
                                {/* Render Mock Items since we can't fetch real ones yet */}
                                {items.map((item) => (
                                    <Card key={item.id} hover className="p-0 overflow-hidden bg-surface border-border group cursor-pointer">
                                        <div className="relative aspect-square bg-gray-800">
                                            <NFTImage
                                                src={collectionURI?.result as string} // Use collection image as placeholder
                                                alt={item.name}
                                                fill
                                                className="group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-black/50 backdrop-blur rounded-lg p-1.5 text-white hover:bg-black/70">
                                                    ❤️
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-sm text-gray-200 truncate pr-2">{item.name}</h4>
                                                <span className="text-xs font-mono text-gray-500">#{item.id}</span>
                                            </div>
                                            <div className="bg-gray-900/50 rounded-lg p-2 flex justify-between items-end">
                                                <div>
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Price</span>
                                                    <p className="text-sm font-bold text-white">{item.price} ARC</p>
                                                </div>
                                                <button className="text-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-white px-2 py-1 rounded transition-colors font-bold">
                                                    Buy
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {activeTab === "activity" && (
                            <EmptyState
                                icon="📊"
                                title="No Activity Yet"
                                description="This collection has no recent trading activity."
                            />
                        )}

                        {activeTab === "analytics" && (
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-6 bg-gray-900/30 border-dashed border-gray-800 h-64 flex items-center justify-center">
                                    <p className="text-gray-500">Volume Chart Placeholder</p>
                                </Card>
                                <Card className="p-6 bg-gray-900/30 border-dashed border-gray-800 h-64 flex items-center justify-center">
                                    <p className="text-gray-500">Price Distribution Placeholder</p>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
