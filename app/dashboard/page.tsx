"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import Layout from "@/components/Layout";
import Link from "next/link";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddress } from "@/lib/factoryAddress";
import { Abi } from "viem";

export default function Dashboard() {
    const { address, isConnected } = useAccount();

    const { data: allCollections } = useReadContract({
        address: factoryAddress as `0x${string}`,
        abi: NFTFactoryArtifact.abi as unknown as Abi,
        functionName: "getAllCollections",
    });

    const collections = (allCollections as string[] || []);

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

    // Filter collections owned by current user
    const myCollections = collections.map((addr, index) => ({
        address: addr,
        owner: owners?.[index]?.result,
        name: names?.[index]?.result,
    })).filter(c => c.owner === address);

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
                            <Link key={col.address} href={`/dashboard/${col.address}`} className="block group">
                                <div className="bg-gray-900/50 border border-gray-800 group-hover:border-blue-500/50 rounded-xl p-6 transition-all">
                                    <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg mb-4 flex items-center justify-center text-4xl">
                                        🎨
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">{String(col.name || "Untitled")}</h3>
                                    <p className="text-sm text-gray-500 font-mono truncate">{col.address}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
