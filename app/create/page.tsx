"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient, useChainId, useSwitchChain } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import { parseUnits } from "viem";
import Layout from "@/components/Layout";
import { arcTestnet } from "@/lib/arcChain";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import { factoryAddress as initialFactoryAddress } from "@/lib/factoryAddress";
import { config } from "@/lib/wagmiClient";
import Link from "next/link";

export default function CreateProject() {
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const { data: walletClient, isLoading: isWalletLoading, refetch: refetchWalletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { switchChain } = useSwitchChain();

    // State
    const [factoryAddress, setFactoryAddress] = useState(initialFactoryAddress);
    const [step, setStep] = useState<"type-selection" | "details">("type-selection");
    const [selectedType, setSelectedType] = useState<"editions" | "drops" | "generative" | null>(null);
    const [mounted, setMounted] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        description: "",
        imageURI: "",
        maxSupply: "1000",
        mintPrice: "0",
        maxPerWallet: "10",
        mintStart: "",
        mintEnd: "",
    });

    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // --- Actions ---

    const handleSelectType = (type: "editions" | "drops" | "generative") => {
        setSelectedType(type);
        setStep("details");
    };

    const handleDeployFactory = async () => {
        try {
            if (!isConnected) throw new Error("Wallet not connected");
            if (chainId !== arcTestnet.id) await switchChain({ chainId: arcTestnet.id });

            let client = walletClient;
            if (!client) client = await getWalletClient(config, { chainId: arcTestnet.id, account: address });

            if (!client && typeof window !== 'undefined' && (window as any).ethereum) {
                const { createWalletClient, custom } = await import("viem");
                client = createWalletClient({ account: address as `0x${string}`, chain: arcTestnet, transport: custom((window as any).ethereum) });
            }
            if (!client) throw new Error("Wallet not ready");

            const hash = await client.deployContract({
                abi: NFTFactoryArtifact.abi,
                bytecode: NFTFactoryArtifact.bytecode as `0x${string}`,
                account: address,
                chain: arcTestnet,
            });
            const receipt = await publicClient?.waitForTransactionReceipt({ hash });
            if (receipt?.contractAddress) {
                setFactoryAddress(receipt.contractAddress);
                alert(`Factory Deployed: ${receipt.contractAddress}. Save to lib/factoryAddress.ts`);
            }
        } catch (e: any) {
            console.error(e);
            alert(e.message);
        }
    };

    const handleCreateCollection = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsDeploying(true);

        try {
            if (!isConnected) throw new Error("Wallet not connected");
            if (chainId !== arcTestnet.id) {
                try {
                    await switchChain({ chainId: arcTestnet.id });
                    // Give it a moment to update
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (e) {
                    console.error(e);
                    throw new Error("Please switch your wallet to Arc Testnet to proceed.");
                }
            }
            // Force get a fresh client for the correct chain
            let client = await getWalletClient(config, { chainId: arcTestnet.id, account: address });

            // Nuclear fallback if standard client fails
            if (!client && typeof window !== 'undefined' && (window as any).ethereum) {
                const { createWalletClient, custom, walletActions } = await import("viem");
                const nuclear = createWalletClient({ account: address as `0x${string}`, chain: arcTestnet, transport: custom((window as any).ethereum) }).extend(walletActions);
                try { await nuclear.switchChain({ id: arcTestnet.id }); } catch (e) { }
                client = nuclear as any;
            }

            if (!client) throw new Error("Wallet connection failed. Please try reconnecting.");

            const supply = BigInt(formData.maxSupply);
            const price = parseUnits(formData.mintPrice, 6); // USDC uses 6 decimals
            const maxPerWallet = BigInt(formData.maxPerWallet);

            // Convert dates to unix timestamps (seconds)
            const startTimestamp = formData.mintStart ? BigInt(Math.floor(new Date(formData.mintStart).getTime() / 1000)) : BigInt(0);
            const endTimestamp = formData.mintEnd ? BigInt(Math.floor(new Date(formData.mintEnd).getTime() / 1000)) : BigInt(0);

            // Simulate
            const { request } = await publicClient!.simulateContract({
                address: factoryAddress as `0x${string}`,
                abi: NFTFactoryArtifact.abi,
                functionName: "deployCollection",
                args: [formData.name, formData.symbol, formData.imageURI, supply, price, maxPerWallet, startTimestamp, endTimestamp],
                account: client.account,
            });

            const hash = await client.writeContract(request);
            const receipt = await publicClient?.waitForTransactionReceipt({ hash });

            let newCollectionAddress = null;
            for (const log of receipt!.logs) {
                try {
                    if (log.address.toLowerCase() === factoryAddress.toLowerCase() && log.topics[1]) {
                        newCollectionAddress = `0x${log.topics[1].slice(26)}`;
                    }
                } catch (e) { }
            }

            if (newCollectionAddress) {
                setDeployedAddress(newCollectionAddress);
            } else {
                throw new Error("Deployment failed: Could not find address");
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create project");
        } finally {
            setIsDeploying(false);
        }
    };

    if (!mounted) return null;

    // --- Render: Type Selection ---
    if (step === "type-selection") {
        return (
            <Layout>
                <div className="max-w-5xl mx-auto pt-10 px-4">
                    <h1 className="text-3xl font-bold mb-8 text-center">Create New NFT Project on Arc</h1>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Editions */}
                        <button
                            onClick={() => handleSelectType("editions")}
                            className="bg-gray-900 border border-gray-800 hover:border-blue-500 p-8 rounded-2xl text-left transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold mb-2">Editions</h3>
                                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">Single Artwork. One or multiple copies.</p>
                        </button>

                        {/* Drops */}
                        <button
                            onClick={() => handleSelectType("drops")}
                            className="bg-gray-900 border border-gray-800 hover:border-purple-500 p-8 rounded-2xl text-left transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold mb-2">Drops</h3>
                                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">Multiple Artworks. Different media for each token.</p>
                        </button>

                        {/* Generative */}
                        <button
                            onClick={() => handleSelectType("generative")}
                            className="bg-gray-900 border border-gray-800 hover:border-green-500 p-8 rounded-2xl text-left transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold mb-2">Generative Art</h3>
                                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">Combination of different Artwork for each token.</p>
                        </button>
                    </div>

                    {!factoryAddress && (
                        <div className="mt-12 text-center">
                            <p className="text-red-400 mb-4">System Factory not detected.</p>
                            <button onClick={handleDeployFactory} className="px-4 py-2 bg-red-600 rounded-lg text-sm font-bold">Deploy Factory (Admin)</button>
                        </div>
                    )}
                </div>
            </Layout>
        );
    }

    // --- Render: Details Form ---
    return (
        <Layout>
            <div className="max-w-4xl mx-auto pt-10 px-4">
                <button
                    onClick={() => setStep("type-selection")}
                    className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm"
                >
                    ← Back to selection
                </button>

                <h1 className="text-3xl font-bold mb-8">Create a {selectedType} collection</h1>

                {!isConnected ? (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
                        <p className="text-gray-400 mb-6">Connect your wallet to create a collection.</p>
                        {/* Wallet button is in header, but we can add a trigger here if needed */}
                    </div>
                ) : deployedAddress ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
                        <h2 className="text-2xl font-bold text-green-400 mb-2">Collection Created!</h2>
                        <p className="text-gray-400 mb-6 font-mono text-sm">{deployedAddress}</p>
                        <div className="flex gap-4 justify-center">
                            <a href={`https://testnet.arcscan.app/address/${deployedAddress}`} target="_blank" className="px-6 py-3 bg-gray-800 rounded-lg">View on ArcScan</a>
                            <Link href={`/mint/${deployedAddress}`} className="px-6 py-3 bg-green-600 rounded-lg font-bold">Go to Mint Page</Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreateCollection} className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Inputs */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white text-black border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Project Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Token Symbol</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white text-black border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Token Symbol"
                                        value={formData.symbol}
                                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Project Description</label>
                                <textarea
                                    className="w-full bg-white text-black border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                                    placeholder="This description will be visible to the public..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Max Supply</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-white text-black border border-gray-300 rounded-lg px-4 py-3"
                                        value={formData.maxSupply}
                                        onChange={(e) => setFormData({ ...formData, maxSupply: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Mint Price (USDC)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.000001"
                                        className="w-full bg-white text-black border border-gray-300 rounded-lg px-4 py-3"
                                        value={formData.mintPrice}
                                        onChange={(e) => setFormData({ ...formData, mintPrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-300 mb-2">Max Per Wallet</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full bg-white text-black border border-gray-300 rounded-lg px-4 py-3"
                                    placeholder="e.g., 10"
                                    value={formData.maxPerWallet}
                                    onChange={(e) => setFormData({ ...formData, maxPerWallet: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Maximum number of NFTs one wallet can mint</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Mint Start (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-white text-black border border-gray-300 rounded-lg px-4 py-3"
                                        value={formData.mintStart}
                                        onChange={(e) => setFormData({ ...formData, mintStart: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-300 mb-2">Mint End (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-white text-black border border-gray-300 rounded-lg px-4 py-3"
                                        value={formData.mintEnd}
                                        onChange={(e) => setFormData({ ...formData, mintEnd: e.target.value })}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                                    <p className="text-red-500 text-sm mb-2">{error}</p>
                                    {error.includes("Factory not found") && (
                                        <button
                                            type="button"
                                            onClick={handleDeployFactory}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
                                        >
                                            Deploy Factory Now
                                        </button>
                                    )}
                                    {(error.includes("switch") || error.includes("Chain")) && (
                                        <button
                                            type="button"
                                            onClick={() => switchChain({ chainId: arcTestnet.id })}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                                        >
                                            Switch to Arc Testnet
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isDeploying}
                                className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all ${isDeploying ? "bg-blue-800 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                                    }`}
                            >
                                {isDeploying ? "Creating Collection..." : "Create Collection"}
                            </button>
                        </div>

                        {/* Right Column: Image Upload */}
                        <div>
                            <label className="block text-sm font-bold text-gray-300 mb-3">Collection Image</label>
                            <div className="relative aspect-square w-full max-w-md">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            try {
                                                const data = new FormData();
                                                data.append("file", file);
                                                const res = await fetch("/api/upload", { method: "POST", body: data });
                                                const json = await res.json();
                                                if (json.url) {
                                                    setFormData({ ...formData, imageURI: json.url });
                                                } else {
                                                    alert("Upload failed");
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                alert("Upload error");
                                            }
                                        }
                                    }}
                                />
                                {formData.imageURI ? (
                                    <div className="relative w-full h-full bg-gray-800 rounded-2xl border-2 border-gray-700 overflow-hidden flex items-center justify-center">
                                        <img src={formData.imageURI} alt="Preview" className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFormData({ ...formData, imageURI: "" });
                                            }}
                                            className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center pointer-events-auto z-30 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gray-900/30 border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-2xl flex flex-col items-center justify-center transition-colors">
                                        <div className="text-center">
                                            <svg className="w-16 h-16 text-gray-600 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-400 font-medium mb-1">Add collection media</p>
                                            <p className="text-gray-500 text-sm">(jpg, png, gif, webp, mp4)</p>
                                            <p className="text-gray-600 text-xs mt-2">max. 20 MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
}
