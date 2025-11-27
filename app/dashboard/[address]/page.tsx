"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import Layout from "@/components/Layout";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import Link from "next/link";

export default function ProjectDashboard() {
    const params = useParams();
    const address = params.address as `0x${string}`;
    const { address: userAddress } = useAccount();
    const [activeTab, setActiveTab] = useState("overview");

    // Form states
    const [newPrice, setNewPrice] = useState("");
    const [newImage, setNewImage] = useState("");
    const [airdropAddresses, setAirdropAddresses] = useState("");

    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const contractConfig = {
        address,
        abi: NFTCollectionArtifact.abi,
    } as const;

    const { data: contractData, refetch } = useReadContracts({
        contracts: [
            { ...contractConfig, functionName: "name" },
            { ...contractConfig, functionName: "symbol" },
            { ...contractConfig, functionName: "maxSupply" },
            { ...contractConfig, functionName: "totalMinted" },
            { ...contractConfig, functionName: "mintPrice" },
            { ...contractConfig, functionName: "owner" },
            { ...contractConfig, functionName: "collectionURI" },
        ],
    });

    const [name, symbol, maxSupply, totalMinted, mintPrice, owner, collectionURI] = contractData || [];

    useEffect(() => {
        if (isConfirmed) {
            refetch();
            setNewPrice("");
            setNewImage("");
            setAirdropAddresses("");
        }
    }, [isConfirmed, refetch]);

    const handleUpdatePrice = () => {
        if (!newPrice) return;
        writeContract({
            ...contractConfig,
            functionName: "setMintPrice",
            args: [parseEther(newPrice)],
        });
    };

    const handleUpdateImage = () => {
        if (!newImage) return;
        writeContract({
            ...contractConfig,
            functionName: "setBaseURI",
            args: [newImage],
        });
    };

    const handleAirdrop = () => {
        if (!airdropAddresses) return;
        const addresses = airdropAddresses.split("\n").map(a => a.trim()).filter(a => a);
        writeContract({
            ...contractConfig,
            functionName: "airdrop",
            args: [addresses],
        });
    };

    const handleWithdraw = () => {
        writeContract({
            ...contractConfig,
            functionName: "withdraw",
        });
    };

    if (owner?.status === "success" && owner.result !== userAddress) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                    <p className="text-gray-400">You are not the owner of this collection.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto flex gap-8">
                {/* Sidebar */}
                <div className="w-64 shrink-0">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 sticky top-24">
                        <div className="mb-6 px-2">
                            <h2 className="font-bold text-lg truncate">{String(name?.result || "Loading...")}</h2>
                            <p className="text-xs text-gray-500 truncate">{address}</p>
                        </div>
                        <nav className="space-y-1">
                            {["overview", "settings", "airdrop", "earnings"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </nav>
                        <div className="mt-8 pt-4 border-t border-gray-800">
                            <Link
                                href={`/mint/${address}`}
                                target="_blank"
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 px-2"
                            >
                                <span>View Mint Page</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow">
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Total Supply</p>
                                    <p className="text-2xl font-bold">{String(maxSupply?.result || 0)}</p>
                                </div>
                                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Minted</p>
                                    <p className="text-2xl font-bold text-blue-400">{String(totalMinted?.result || 0)}</p>
                                </div>
                                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Mint Price</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        {mintPrice?.result ? formatEther(mintPrice.result as bigint) : "0"} USDC
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
                                <h3 className="font-bold mb-4">Collection Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">Current Image URI</label>
                                        <code className="block bg-black/50 p-3 rounded text-sm break-all">
                                            {String(collectionURI?.result || "Not set")}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="space-y-6">
                            <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
                                <h3 className="font-bold mb-4">Update Mint Price</h3>
                                <div className="flex gap-4">
                                    <input
                                        type="number"
                                        placeholder="New Price (USDC)"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="flex-grow bg-black/50 border border-gray-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleUpdatePrice}
                                        disabled={isPending}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                                    >
                                        {isPending ? "Updating..." : "Update"}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
                                <h3 className="font-bold mb-4">Update Image URI</h3>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="New Image URL"
                                        value={newImage}
                                        onChange={(e) => setNewImage(e.target.value)}
                                        className="flex-grow bg-black/50 border border-gray-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleUpdateImage}
                                        disabled={isPending}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                                    >
                                        {isPending ? "Updating..." : "Update"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "airdrop" && (
                        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
                            <h3 className="font-bold mb-4">Airdrop NFTs</h3>
                            <p className="text-sm text-gray-400 mb-4">Enter addresses to send NFTs to (one per line).</p>
                            <textarea
                                value={airdropAddresses}
                                onChange={(e) => setAirdropAddresses(e.target.value)}
                                rows={5}
                                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 outline-none focus:border-blue-500 mb-4 font-mono text-sm"
                                placeholder="0x...\n0x..."
                            />
                            <button
                                onClick={handleAirdrop}
                                disabled={isPending || !airdropAddresses}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                            >
                                {isPending ? "Sending..." : "Send Airdrop"}
                            </button>
                        </div>
                    )}

                    {activeTab === "earnings" && (
                        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl text-center">
                            <h3 className="font-bold mb-2">Contract Balance</h3>
                            <p className="text-4xl font-bold text-green-400 mb-6">
                                {/* Balance fetching would go here, simplified for now */}
                                Check Wallet
                            </p>
                            <button
                                onClick={handleWithdraw}
                                disabled={isPending}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg disabled:opacity-50"
                            >
                                {isPending ? "Withdrawing..." : "Withdraw All Funds"}
                            </button>
                        </div>
                    )}

                    {writeError && (
                        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {writeError.message.split("\n")[0]}
                        </div>
                    )}

                    {isConfirmed && (
                        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                            Transaction confirmed successfully!
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
