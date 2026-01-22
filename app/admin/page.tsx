"use client";

import { useEffect, useState, Suspense } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import Layout from "@/components/Layout";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useSearchParams } from "next/navigation";
import { formatEther, Abi } from "viem";

function AdminContent() {
    const { address, isConnected } = useAccount();
    const searchParams = useSearchParams();
    const initialAddress = searchParams.get("collection") || "";

    const [collectionAddress, setCollectionAddress] = useState(initialAddress);
    const [targetAddress, setTargetAddress] = useState<`0x${string}` | null>(initialAddress ? initialAddress as `0x${string}` : null);
    const { toast } = useToast();

    // Fetch Data
    const contractConfig = {
        address: targetAddress || undefined,
        abi: NFTCollectionArtifact.abi as unknown as Abi,
        query: { enabled: !!targetAddress }
    };

    const { data: owner } = useReadContract({ ...contractConfig, functionName: "owner" });
    const { data: name } = useReadContract({ ...contractConfig, functionName: "name" });
    const { data: symbol } = useReadContract({ ...contractConfig, functionName: "symbol" });
    const { data: totalSupply } = useReadContract({ ...contractConfig, functionName: "totalMinted" });
    const { data: maxSupply } = useReadContract({ ...contractConfig, functionName: "maxSupply" });
    // const { data: balance } = useReadContract({ ...contractConfig, functionName: "balanceOf", args: [targetAddress] }); 

    const isOwner = owner && (owner as string).toLowerCase() === address?.toLowerCase();

    // Withdraw Action
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isConfirmed) toast("Withdraw Successful", "success");
        if (error) toast(error.message, "error");
    }, [isConfirmed, error]);

    const handleWithdraw = () => {
        if (!targetAddress) return;
        writeContract({
            address: targetAddress,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "withdraw",
        });
    };

    const handleLoad = () => {
        if (collectionAddress.startsWith("0x")) {
            setTargetAddress(collectionAddress as `0x${string}`);
        } else {
            toast("Invalid Address format", "error");
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Admin Console</h1>
                    <p className="text-gray-400">Manage your smart contract settings and funds.</p>
                </div>
                {targetAddress && (
                    <Badge variant={isOwner ? "success" : "error"}>
                        {isOwner ? "Authorized Owner" : "Read Only View"}
                    </Badge>
                )}
            </div>

            {/* Search Bar */}
            <Card className="p-6 bg-surface border-border mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <Input
                        label="Collection Address"
                        placeholder="0x..."
                        value={collectionAddress}
                        onChange={(e) => setCollectionAddress(e.target.value)}
                        containerClassName="flex-1 m-0"
                    />
                    <Button onClick={handleLoad} variant="secondary" className="mb-[2px]">Load Dashboard</Button>
                </div>
            </Card>

            {targetAddress && (
                <div className="animate-fade-in space-y-8">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Project</h3>
                            <p className="text-2xl font-bold text-white truncate">{name as string || "..."}</p>
                            <p className="text-sm font-mono text-primary">{symbol as string}</p>
                        </Card>
                        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mint Status</h3>
                            <p className="text-2xl font-bold text-white">
                                {totalSupply ? Number(totalSupply).toLocaleString() : "0"} / {maxSupply ? Number(maxSupply).toLocaleString() : "0"}
                            </p>
                            <div className="w-full bg-gray-700 h-1.5 mt-3 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full" style={{ width: `${(Number(totalSupply || 0) / Number(maxSupply || 1)) * 100}%` }} />
                            </div>
                        </Card>
                        <Card className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Balance</h3>
                            <p className="text-2xl font-bold text-white">-- ETH</p>
                            <p className="text-xs text-gray-500">Contract Balance</p>
                        </Card>
                    </div>

                    {!isOwner ? (
                        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-4 text-red-400">
                            <div className="text-2xl">🔒</div>
                            <div>
                                <h3 className="font-bold text-lg">Restricted Access</h3>
                                <p className="opacity-80">You are not the owner of this contract. You can view stats but cannot perform administrative actions.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Funds Management */}
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold border-b border-gray-800 pb-2">Funds & Sales</h2>

                                <Card className="p-6 bg-surface border-border">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white">Withdraw Revenue</h3>
                                            <p className="text-sm text-gray-400 mt-1">Transfer all accumulated ETH/ARC to your wallet.</p>
                                        </div>
                                        <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                                            💸
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleWithdraw}
                                        isLoading={isPending || isConfirming}
                                        variant="primary"
                                        fullWidth
                                    >
                                        Withdraw Funds
                                    </Button>
                                </Card>

                                <Card className="p-6 bg-surface border-border opacity-75">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white">Airdrop (Soon)</h3>
                                            <p className="text-sm text-gray-400 mt-1">Send NFTs to specific addresses for free.</p>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                                            🎁
                                        </div>
                                    </div>
                                    <Button variant="secondary" fullWidth disabled>Coming Soon</Button>
                                </Card>
                            </div>

                            {/* Settings */}
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold border-b border-gray-800 pb-2">Contract Settings</h2>

                                <Card className="p-6 bg-surface border-border opacity-75">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white">Metadata URL</h3>
                                            <p className="text-sm text-gray-400 mt-1">Update the base URI for your metadata.</p>
                                        </div>
                                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                                            🔗
                                        </div>
                                    </div>
                                    <Button variant="secondary" fullWidth disabled>Update URI (Coming Soon)</Button>
                                </Card>

                                <Card className="p-6 bg-surface border-border opacity-75">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-white">Mint Phase</h3>
                                            <p className="text-sm text-gray-400 mt-1">Pause or resume minting publicly.</p>
                                        </div>
                                        <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                                            ⏸️
                                        </div>
                                    </div>
                                    <Button variant="secondary" fullWidth disabled>Pause Minting (Coming Soon)</Button>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AdminPage() {
    return (
        <Layout>
            <Suspense fallback={<div className="flex justify-center py-20"><span className="loading loading-spinner text-primary"></span></div>}>
                <AdminContent />
            </Suspense>
        </Layout>
    );
}
