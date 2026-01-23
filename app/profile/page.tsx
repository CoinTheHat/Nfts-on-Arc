"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/Layout";
import { useUsername } from "@/lib/useUsername";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import NFTImage from "@/components/NFTImage";
import { EmptyState } from "@/components/ui/EmptyState";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddresses } from "@/lib/factoryAddress";
import { formatEther, Abi } from "viem";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Profile() {
    const { address, isConnected } = useAccount();
    const { username: fetchedUsername, refetch } = useUsername(address);
    const { toast } = useToast();

    // Profile State
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loadingSave, setLoadingSave] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState("created");
    const [isEditMode, setIsEditMode] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Initial load
    useEffect(() => {
        setMounted(true);
        if (address) loadProfile();
    }, [address]);

    const loadProfile = async () => {
        try {
            const { data } = await supabase.from("profiles").select("*").eq("wallet_address", address?.toLowerCase()).single();
            if (data) {
                setUsername(data.username || "");
                setBio(data.bio || "");
                setAvatarUrl(data.avatar_url || "");
            }
        } catch (error: any) {
            // 406 just means no single row found (new user), which is fine.
            if (error?.code !== 'PGRST116' && error?.status !== 406) {
                console.error("Load Profile Error:", error);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;
        setLoadingSave(true);
        try {
            console.log("Saving profile for:", address.toLowerCase());
            // Simple upsert relying on Primary Key (wallet_address)
            const { error } = await supabase.from("profiles").upsert({
                wallet_address: address.toLowerCase(),
                username,
                bio,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            });

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            toast("Profile updated!", "success");

            // Notify other components (like TopNav) to refetch
            window.dispatchEvent(new Event("profileUpdated"));

            refetch();
            setIsEditMode(false);
        } catch (error: any) {
            console.error("Save Error:", error);
            toast(`Error: ${error.message || "Failed to save"}`, "error");
        }
        finally { setLoadingSave(false); }
    };

    // --- Fetch Created Collections Logic (Reused from Dashboard) ---
    const { data: allFactoriesData, isLoading: factoriesLoading } = useReadContracts({
        contracts: factoryAddresses.map((factoryAddr) => ({
            address: factoryAddr as `0x${string}`,
            abi: NFTFactoryArtifact.abi as unknown as Abi,
            functionName: "getAllCollections",
        })),
    });

    const allCollections = (allFactoriesData || []).flatMap((result) => result.status === "success" ? result.result as string[] : []).reverse();
    const checkedCollections = allCollections.slice(0, 50) as `0x${string}`[];

    const { data: ownersData } = useReadContracts({
        contracts: checkedCollections.map((addr) => ({ address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "owner" })),
    });

    const myCollections = checkedCollections.filter((_, i) => {
        const ownerResult = ownersData?.[i];
        return ownerResult?.status === "success" && (ownerResult.result as string).toLowerCase() === address?.toLowerCase();
    });

    // Fetch details for my collections
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
        ]),
    });

    if (!mounted) return null;

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <Card className="p-12 border-border-default bg-surface-1">
                        <div className="text-4xl mb-4">🔒</div>
                        <h1 className="text-2xl font-bold mb-4 text-text-primary">Connect Wallet</h1>
                        <p className="text-text-tertiary mb-8">Connect your wallet to view and manage your profile.</p>
                        {/* Assuming connect button in navbar handles it */}
                    </Card>
                </div>
            </Layout>
        );
    }

    const tabsList = [
        { id: "created", label: "Created", count: myCollections.length || 0 },
        { id: "collected", label: "Collected", count: 0 },
        { id: "activity", label: "Activity" }
    ];

    // Total Volume Calc (Mock based on minted * price)
    const activeVolume = myCollections.reduce((acc, _, i) => {
        const baseIndex = i * 3;
        const minted = statsData?.[baseIndex]?.result ? Number(statsData[baseIndex].result) : 0;
        const price = statsData?.[baseIndex + 2]?.result ? Number(formatEther(statsData[baseIndex + 2].result as bigint)) : 0;
        return acc + (minted * price);
    }, 0);

    return (
        <Layout>
            <div className="bg-bg-base min-h-screen">

                {/* Header Section */}
                <div className="relative mb-8">
                    {/* Cover Banner */}
                    <div className="h-64 w-full bg-bg-alt relative overflow-hidden border-b border-border-default">
                        <div className="absolute inset-0 bg-gradient-to-br from-bg-alt via-surface-2 to-bg-base opacity-50" />
                        {/* <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5" /> Subtle texture removed to fix 404 */}
                    </div>

                    <div className="max-w-7xl mx-auto px-4 relative">
                        <div className="flex flex-col md:flex-row items-end gap-8 -mt-20">
                            {/* Avatar */}
                            <div className="w-40 h-40 rounded-full border-4 border-bg-base bg-surface-2 shadow-xl relative overflow-hidden group">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-surface-3 text-4xl text-text-tertiary font-bold">
                                        {address ? address[2].toUpperCase() : "U"}
                                    </div>
                                )}
                            </div>

                            {/* Info & Actions */}
                            <div className="flex-1 w-full md:w-auto pb-4">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-text-primary mb-1 flex items-center gap-2">
                                            {fetchedUsername || "Unnamed"}
                                            {fetchedUsername && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">PRO</Badge>}
                                        </h1>
                                        <div className="flex items-center gap-3 text-sm text-text-tertiary mb-3">
                                            <span className="font-bold text-text-secondary">@{fetchedUsername?.toLowerCase().replace(/\s/g, '') || "user"}</span>
                                            <span className="text-border-strong">•</span>
                                            <button
                                                onClick={() => { if (address) navigator.clipboard.writeText(address); toast("Address copied", "info") }}
                                                className="font-mono hover:text-text-primary transition-colors flex items-center gap-1"
                                            >
                                                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "..."} ❐
                                            </button>
                                        </div>
                                        {bio && <p className="text-text-secondary max-w-xl text-sm leading-relaxed mb-4">{bio}</p>}

                                        {/* Mini Metrics */}
                                        <div className="flex gap-8 border-t border-border-default pt-4">
                                            <div>
                                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Created</p>
                                                <p className="text-lg font-bold text-text-primary">{myCollections.length}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Minted</p>
                                                <p className="text-lg font-bold text-text-primary">0</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Volume</p>
                                                <p className="text-lg font-bold text-text-primary">{activeVolume > 0 ? `$${activeVolume.toFixed(2)}` : "--"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-2 md:mt-0">
                                        <Button
                                            variant="secondary"
                                            onClick={() => setIsEditMode(true)}
                                            className="bg-surface-1 border-border-default hover:bg-surface-2 text-text-secondary"
                                            leftIcon={<span>✏️</span>}
                                        >
                                            Edit Profile
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => { navigator.clipboard.writeText(window.location.href); toast("Profile Link copied", "success") }}
                                            className="border-border-default text-text-tertiary hover:text-text-primary"
                                        >
                                            ↗
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                {isEditMode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                        <Card className="max-w-lg w-full p-8 bg-surface-1 border-border-default shadow-2xl relative">
                            <button onClick={() => setIsEditMode(false)} className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary">✕</button>
                            <h2 className="text-xl font-bold mb-6 text-text-primary">Edit Profile</h2>
                            <form onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Input
                                        label="Display Name"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-surface-2 border-border-default"
                                    />
                                    <Input
                                        label="Location"
                                        placeholder="Optional"
                                        className="bg-surface-2 border-border-default"
                                    />
                                </div>
                                <Textarea
                                    label="Bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="bg-surface-2 border-border-default min-h-[100px]"
                                />

                                {/* Avatar Upload */}
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-2">Avatar Image</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 rounded-full bg-surface-2 border border-border-default overflow-hidden flex-shrink-0 relative group">
                                            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-surface-3" />}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const formData = new FormData();
                                                    formData.append("file", file);
                                                    try {
                                                        const res = await fetch("/api/upload", { method: "POST", body: formData });
                                                        const data = await res.json();
                                                        if (data.url) {
                                                            setAvatarUrl(data.url);
                                                            toast("Image uploaded!", "success");
                                                        }
                                                    } catch (err) {
                                                        toast("Upload failed", "error");
                                                    }
                                                }}
                                                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                                            />
                                            <p className="text-xs text-text-tertiary mt-2">Recommended: 400x400px. JPG, PNG or GIF.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border-default">
                                    <Button variant="ghost" type="button" onClick={() => setIsEditMode(false)} className="text-text-tertiary">Cancel</Button>
                                    <Button type="submit" isLoading={loadingSave} variant="primary" className="px-8">Save Changes</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Body Content */}
                <div className="max-w-7xl mx-auto px-4 pb-20">
                    <div className="border-b border-border-default mb-8">
                        <div className="flex gap-8">
                            {tabsList.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        pb-4 text-sm font-bold transition-all border-b-2 
                                        ${activeTab === tab.id
                                            ? "border-primary text-text-primary"
                                            : "border-transparent text-text-tertiary hover:text-text-secondary"
                                        }
                                    `}
                                >
                                    {tab.label}
                                    <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-text-tertiary'}`}>
                                        {tab.count || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="animate-fade-in min-h-[400px]">
                        {activeTab === "created" && (
                            <>
                                {myCollections.length === 0 ? (
                                    <EmptyState
                                        title="No Collections Created"
                                        description="You haven't created any collections yet."
                                        icon="🎨"
                                        actionLabel="Create Your First Collection"
                                        onAction={() => window.location.href = '/create'}
                                    />
                                ) : (
                                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {myCollections.map((addr, index) => {
                                            const name = namesData?.[index]?.result ? String(namesData[index].result) : "";
                                            const uri = urisData?.[index]?.result ? String(urisData[index].result) : null;

                                            const baseIndex = index * 3;
                                            const minted = statsData?.[baseIndex]?.result ? Number(statsData[baseIndex].result) : 0;
                                            const max = statsData?.[baseIndex + 1]?.result ? Number(statsData[baseIndex + 1].result) : 0;
                                            const price = statsData?.[baseIndex + 2]?.result ? formatEther(statsData[baseIndex + 2].result as bigint) : "0";

                                            const progress = max > 0 ? (minted / max) * 100 : 0;

                                            return (
                                                <Link href={`/mint/${addr}`} key={addr}>
                                                    <div className="group bg-surface-1 hover:-translate-y-1 transition-all duration-300 rounded-2xl border border-border-default hover:shadow-xl overflow-hidden h-full flex flex-col">
                                                        <div className="aspect-[4/3] bg-surface-2 relative overflow-hidden">
                                                            <NFTImage src={uri} alt={name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            <div className="absolute top-3 right-3">
                                                                <Badge variant="secondary" className="backdrop-blur-md bg-black/40 border-white/10 text-white text-[10px]">Verify</Badge>
                                                            </div>
                                                        </div>

                                                        <div className="p-4 flex-1 flex flex-col">
                                                            <h3 className="font-bold text-text-primary text-lg mb-1 truncate">{name || "Untitled Collection"}</h3>
                                                            <p className="text-xs font-mono text-text-tertiary mb-4">{addr.slice(0, 6)}...{addr.slice(-4)}</p>

                                                            <div className="mt-auto space-y-3">
                                                                <div>
                                                                    <div className="flex justify-between text-[10px] text-text-tertiary font-bold uppercase mb-1.5">
                                                                        <span>Minted</span>
                                                                        <span>{Math.round(progress)}%</span>
                                                                    </div>
                                                                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                                                                    </div>
                                                                </div>

                                                                <div className="pt-3 border-t border-border-subtle flex justify-between items-center">
                                                                    <div>
                                                                        <p className="text-[10px] text-text-tertiary uppercase font-bold">Price</p>
                                                                        <p className="font-bold text-text-primary">{price} USDC</p>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        View
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === "collected" && (
                            <EmptyState
                                title="No NFTs Collected"
                                description="You haven't collected any NFTs yet."
                                icon="🖼️"
                                actionLabel="Explore Market"
                                onAction={() => window.location.href = '/explore'}
                            />
                        )}

                        {activeTab === "activity" && (
                            <div className="max-w-2xl mx-auto">
                                <EmptyState
                                    title="No Recent Activity"
                                    description="Your on-chain interactions will appear here."
                                    icon="📊"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
