"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Layout from "@/components/Layout";
import Link from "next/link";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddress, factoryAddresses } from "@/lib/factoryAddress";
import { Abi } from "viem";

export default function Dashboard() {
    const { address, isConnected } = useAccount();

    // Fetch collections from ALL factories
    const { data: allFactoriesData } = useReadContracts({
        contracts: factoryAddresses.map((factoryAddr) => ({
            address: factoryAddr as `0x${string}`,
            abi: NFTFactoryArtifact.abi as unknown as Abi,
            functionName: "getAllCollections",
        })),
    });

    // Combine all collections from all factories
    const collections = (allFactoriesData || [])
        .flatMap((result) => result.status === "success" ? result.result as string[] : []);

    // Fetch owners for all collections to filter
    const { data: owners } = useReadContracts({
        contracts: collections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "owner",
        })),
    });

    const { data: names } = useReadContracts({
        contracts: collections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "name",
        })),
    });

    // Check user's balance for ALL collections (to find minted NFTs)
    const { data: balances } = useReadContracts({
        contracts: collections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "balanceOf",
            args: [address],
        })),
    });

    // Fetch collection images (URIs)
    const { data: collectionURIs } = useReadContracts({
        contracts: collections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "collectionURI",
        })),
    });

    // Filter collections owned by current user (created by them)
    const myCollections = collections.map((addr, index) => ({
        address: addr,
        owner: owners?.[index]?.result,
        name: names?.[index]?.result,
        imageUrl: collectionURIs?.[index]?.result as string | undefined,
    })).filter(c => c.owner === address);

    // Filter collections where user has minted at least one NFT
    const mintedCollections = collections.map((addr, index) => ({
        address: addr,
        name: names?.[index]?.result,
        balance: balances?.[index]?.result as bigint | undefined,
        imageUrl: collectionURIs?.[index]?.result as string | undefined,
    })).filter(c => c.balance && c.balance > BigInt(0));

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <h1 className="text-2xl font-bold mb-4">Please connect your wallet</h1>
                    <p className="text-gray-400">Connect wallet to view your projects.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">My Projects</h1>
                    <Link href="/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                        + New Project
                    </Link>
                </div>

                {myCollections.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
                        <p className="text-gray-400 mb-4">You haven't created any collections yet.</p>
                        <Link href="/create" className="text-blue-400 hover:underline">Create your first collection</Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {myCollections.map((col) => (
                            <Link key={col.address} href={`/collection/${col.address}`} className="block group">
                                <div className="bg-gray-900/50 border border-gray-800 group-hover:border-blue-500/50 rounded-xl p-6 transition-all">
                                    <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 overflow-hidden">
                                        {col.imageUrl ? (
                                            <img
                                                src={col.imageUrl}
                                                alt={String(col.name || "Collection")}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-4xl">🎨</div>';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-4xl">🎨</div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{String(col.name || "Untitled")}</h3>
                                    <p className="text-sm text-gray-500 font-mono truncate">{col.address}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Minted NFTs Section */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-6">My Minted NFTs</h2>
                    {mintedCollections.length === 0 ? (
                        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <p className="text-gray-400">You haven't minted any NFTs yet.</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-4 gap-4">
                            {mintedCollections.map((col) => (
                                <Link key={col.address} href={`/mint/${col.address}`} className="block group">
                                    <div className="bg-gray-900/50 border border-gray-800 group-hover:border-purple-500/50 rounded-xl p-4 transition-all">
                                        <div className="h-24 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg mb-3 overflow-hidden">
                                            {col.imageUrl ? (
                                                <img
                                                    src={col.imageUrl}
                                                    alt={String(col.name || "NFT")}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full text-3xl">🖼️</div>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-3xl">🖼️</div>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-sm mb-1 truncate">{String(col.name || "Untitled")}</h4>
                                        <p className="text-xs text-gray-500">Owned: {col.balance?.toString()}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
