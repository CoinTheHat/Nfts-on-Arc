"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import Layout from "@/components/Layout";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddresses } from "@/lib/factoryAddress";
import Link from "next/link";
import { formatEther, Abi } from "viem";
import NFTImage from "@/components/NFTImage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Tabs } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";

export default function Dashboard() {
    const { address, isConnected } = useAccount();
    const [mounted, setMounted] = useState(false);
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("projects");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const checkedCollections = allCollections.slice(0, 50) as `0x${string}`[];

    const { data: ownersData, isLoading: ownersLoading } = useReadContracts({
        contracts: checkedCollections.map((addr) => ({
            address: addr,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "owner",
        })),
    });

    const myCollections = checkedCollections.filter((_, i) => {
        const ownerResult = ownersData?.[i];
        return ownerResult?.status === "success" && (ownerResult.result as string).toLowerCase() === address?.toLowerCase();
    });

    const { data: namesData } = useReadContracts({
        contracts: myCollections.map((addr) => ({ address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "name" })),
    });
    const { data: urisData } = useReadContracts({
        contracts: myCollections.map((addr) => ({ address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "collectionURI" })),
    });
    const { data: statsData } = useReadContracts({
        contracts: myCollections.flatMap((addr) => [
            { address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "totalMinted" },
            { address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "maxSupply" },
            { address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "mintPrice" },
            { address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "mintStart" },
            { address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "mintEnd" },
        ]),
    });

    const isLoading = factoriesLoading || ownersLoading;

    // Process Data
    const processedProjects = myCollections.map((addr, index) => {
        const name = namesData?.[index]?.result ? String(namesData[index].result) : "";
        const baseIndex = index * 5;
        const minted = statsData?.[baseIndex]?.result ? Number(statsData[baseIndex].result) : 0;
        const max = statsData?.[baseIndex + 1]?.result ? Number(statsData[baseIndex + 1].result) : 0;
        const priceStr = statsData?.[baseIndex + 2]?.result ? formatEther(statsData[baseIndex + 2].result as bigint) : "0";
        const price = Number(priceStr);
        const start = statsData?.[baseIndex + 3]?.result ? Number(statsData[baseIndex + 3].result) : 0;
        const end = statsData?.[baseIndex + 4]?.result ? Number(statsData[baseIndex + 4].result) : 0;

        const now = Math.floor(Date.now() / 1000);
        let status = "Draft";
        if (max > 0) {
            if (now < start && start > 0) status = "Upcoming";
            else if ((end > 0 && now > end) || minted >= max) status = "Ended";
            else status = "Live";
        }

        const revenue = minted * price;
        const progress = max > 0 ? (minted / max) * 100 : 0;

        return { addr, name, index, status, minted, max, price: priceStr, revenue, progress, uri: urisData?.[index]?.result ? String(urisData[index].result) : null };
    });

    // Filter & Sort
    const filteredProjects = processedProjects.filter(item => {
        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.addr.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterStatus !== "all" && item.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === "minted") return b.minted - a.minted;
        if (sortBy === "revenue") return b.revenue - a.revenue;
        return 0; // Default newest
    });

    // KPI Calc
    const totalRevenue = processedProjects.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalMinted = processedProjects.reduce((acc, curr) => acc + curr.minted, 0);
    const activeProjects = processedProjects.filter(p => p.status === "Live").length;

    if (!mounted) return null;

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <Card className="p-12 text-center bg-surface-1 border-border-default max-w-lg shadow-sm">
                        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">👛</div>
                        <h1 className="text-2xl font-bold text-text-primary mb-2">Creator Dashboard</h1>
                        <p className="text-text-tertiary mb-8">Connect your wallet to manage your collections and track earnings.</p>
                        {/* Connect Button is in Navbar usually, but could add here if we had access to the hook */}
                        <div className="text-sm text-text-muted">Please use the Connect button in the top right.</div>
                    </Card>
                </div>
            </Layout>
        );
    }

    const tabs = [
        { id: "projects", label: "My Projects", count: myCollections.length || 0 },
        { id: "minted", label: "My Minted NFTs", count: 0 },
        { id: "activity", label: "Activity" }
    ];

    return (
        <Layout>
            <div className="bg-bg-base min-h-screen pb-20">
                {/* Header Area */}
                <div className="bg-surface-1 border-b border-border-default pt-8 pb-0 px-4 mb-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-text-primary mb-1">Dashboard</h1>
                                <p className="text-text-tertiary text-sm">Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                            </div>
                            <Button href="/create" className="shadow-lg shadow-primary/20 px-6">
                                + Create New Project
                            </Button>
                        </div>

                        {/* KPIS */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <KPICard label="Active Projects" value={activeProjects} icon="⚡" />
                            <KPICard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon="💎" />
                            <KPICard label="Total Minted" value={totalMinted} icon="🖼️" />
                        </div>

                        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="border-b-0" />
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4">
                    {activeTab === "projects" && (
                        <div className="animate-slide-up">

                            {/* Filter Bar */}
                            <div className="bg-surface-1 border border-border-default rounded-xl p-2 flex flex-col md:flex-row gap-4 mb-6 items-center shadow-sm">
                                <div className="flex-1 w-full">
                                    <Input
                                        placeholder="Search collections..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="border-none bg-surface-2 h-10 text-sm focus:bg-surface-1 transition-colors"
                                        leftIcon={<span className="text-gray-400 text-xs">🔍</span>}
                                        containerClassName="m-0"
                                    />
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto px-2 md:px-0">
                                    <div className="h-6 w-[1px] bg-border-default hidden md:block mx-2" />
                                    {["all", "Live", "Ended", "Draft"].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setFilterStatus(status.toLowerCase())}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all
                                                ${filterStatus === status.toLowerCase()
                                                    ? "bg-text-primary text-bg-base border-text-primary"
                                                    : "bg-transparent text-text-tertiary border-border-default hover:border-text-tertiary"
                                                }
                                            `}
                                        >
                                            {status === "all" ? "All" : status}
                                        </button>
                                    ))}
                                    <div className="h-6 w-[1px] bg-border-default hidden md:block mx-2" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-surface-2 text-xs font-bold text-text-secondary border border-border-default rounded-lg py-1.5 px-3 outline-none cursor-pointer hover:border-border-hover transition-colors"
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="minted">Most Minted</option>
                                        <option value="revenue">Highest Revenue</option>
                                    </select>
                                </div>
                            </div>

                            {/* Projects List */}
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} height={72} variant="rectangular" className="rounded-xl" />)}
                                </div>
                            ) : filteredProjects.length === 0 ? (
                                <EmptyState
                                    icon="🚀"
                                    title={searchQuery ? "No Results" : "Start Your Journey"}
                                    description={searchQuery ? "Try adjusting your filters." : "Create your first collection on Arc."}
                                    actionLabel={searchQuery ? undefined : "Create Collection"}
                                    onAction={searchQuery ? undefined : () => window.location.href = '/create'}
                                />
                            ) : (
                                <div className="space-y-3">
                                    {filteredProjects.map((project) => (
                                        <div key={project.addr} className="group bg-surface-1 hover:bg-surface-hover border border-border-default hover:border-border-strong rounded-xl p-3 pr-4 transition-all flex flex-col md:flex-row gap-4 items-center shadow-sm hover:shadow-md">

                                            {/* Left: Identity */}
                                            <div className="flex items-center gap-4 w-full md:w-64">
                                                <div className="h-12 w-12 rounded-lg bg-surface-2 overflow-hidden flex-shrink-0 border border-border-subtle relative">
                                                    <NFTImage src={project.uri} alt={project.name} fill className="object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-text-primary text-sm truncate" title={project.name}>{project.name || "Untitled"}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-mono text-text-tertiary">{project.addr.slice(0, 6)}...{project.addr.slice(-4)}</span>
                                                        <Badge variant={project.status === "Live" ? "success" : project.status === "Ended" ? "error" : "secondary"} className="py-0 px-1.5 text-[9px] h-4">
                                                            {project.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Stats & Progress */}
                                            <div className="flex-1 w-full grid grid-cols-3 gap-4 items-center pl-4 border-l border-border-subtle">
                                                <div className="col-span-1">
                                                    <div className="flex justify-between text-[10px] mb-1 font-bold text-text-tertiary uppercase tracking-wider">
                                                        <span>Progress</span>
                                                        <span>{Math.round(project.progress)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-text-tertiary font-bold uppercase">Minted</p>
                                                    <p className="text-sm font-bold text-text-primary">{project.minted} <span className="text-text-tertiary font-normal">/ {project.max === 0 ? "∞" : project.max}</span></p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-text-tertiary font-bold uppercase">Revenue</p>
                                                    <p className="text-sm font-bold text-text-primary">${project.revenue.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pl-4 md:border-l border-border-subtle h-full justify-end">
                                                <Link href={`/admin?collection=${project.addr}`}>
                                                    <Button size="sm" variant="secondary" className="h-8 text-xs">Manage</Button>
                                                </Link>
                                                <Link href={`/mint/${project.addr}`}>
                                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex items-center justify-center border-border-default hover:border-text-tertiary text-text-tertiary hover:text-text-primary">
                                                        ↗
                                                    </Button>
                                                </Link>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "minted" && (
                        <div className="animate-slide-up py-12">
                            <EmptyState
                                title="No Minted NFTs"
                                description="You haven't minted any NFTs on Arc yet."
                                actionLabel="Explore Collections"
                                onAction={() => window.location.href = '/explore'}
                                icon="🖼️"
                            />
                        </div>
                    )}

                    {activeTab === "activity" && (
                        <div className="animate-slide-up max-w-2xl mx-auto">
                            <div className="bg-surface-1 border border-border-default rounded-xl p-8 text-center">
                                <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📊</div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">No Recent Activity</h3>
                                <p className="text-sm text-text-tertiary mb-6">Your on-chain interactions will appear here.</p>
                                <Button href="/explore" variant="secondary">Browse Marketplace</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

// -- Subcomponents --

function KPICard({ label, value, icon }: { label: string, value: string | number, icon: string }) {
    return (
        <div className="bg-surface-2 border border-border-default rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface-1 border border-border-default flex items-center justify-center text-lg shadow-sm">
                {icon}
            </div>
            <div>
                <p className="text-xs text-text-tertiary font-bold uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-text-primary">{value}</p>
            </div>
        </div>
    )
}
