"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { isUserAdmin } from "@/lib/adminConfig";
import { useReadContracts } from "wagmi";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddresses } from "@/lib/factoryAddress";
import { Abi } from "viem";
import Link from "next/link";

type CollectionStatus = 'verified' | 'hidden' | 'neutral';

interface ModerationData {
    address: string;
    status: CollectionStatus;
}

export default function AdminPage() {
    const { address, isConnected } = useAccount();
    const [isAdmin, setIsAdmin] = useState(false);
    const [moderationData, setModerationData] = useState<Record<string, CollectionStatus>>({});
    const [loading, setLoading] = useState(true);

    // Check admin status
    useEffect(() => {
        setIsAdmin(isUserAdmin(address));
    }, [address]);

    // Fetch moderation data from Supabase
    const fetchModerationData = async () => {
        const { data, error } = await supabase
            .from('collection_moderation')
            .select('address, status');

        if (error) {
            console.error('Error fetching moderation data:', error);
            return;
        }

        const map: Record<string, CollectionStatus> = {};
        data?.forEach((item: ModerationData) => {
            map[item.address.toLowerCase()] = item.status;
        });
        setModerationData(map);
    };

    useEffect(() => {
        fetchModerationData();
    }, []);

    // Fetch all collections from blockchain (reusing logic from Home)
    const { data: allFactoriesData } = useReadContracts({
        contracts: factoryAddresses.map((factoryAddr) => ({
            address: factoryAddr as `0x${string}`,
            abi: NFTFactoryArtifact.abi as unknown as Abi,
            functionName: "getAllCollections",
        })),
    });

    const allCollections = (allFactoriesData || [])
        .flatMap((result) => result.status === "success" ? result.result as string[] : [])
        .reverse(); // Newest first

    // Fetch names
    const { data: collectionNames } = useReadContracts({
        contracts: allCollections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "name",
        })),
    });

    // Fetch URIs
    const { data: collectionURIs } = useReadContracts({
        contracts: allCollections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "collectionURI",
        })),
    });

    const updateStatus = async (collectionAddress: string, status: CollectionStatus) => {
        const { error } = await supabase
            .from('collection_moderation')
            .upsert({
                address: collectionAddress.toLowerCase(),
                status: status,
                updated_at: new Date().toISOString()
            });

        if (error) {
            alert(`Error updating status: ${error.message}`);
        } else {
            setModerationData(prev => ({
                ...prev,
                [collectionAddress.toLowerCase()]: status
            }));
        }
    };

    if (!isConnected) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <h1 className="text-2xl font-bold text-gray-400">Please connect your wallet</h1>
                </div>
            </Layout>
        );
    }

    if (!isAdmin) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
                    <p className="text-gray-400 mb-4">You are not authorized to view this page.</p>
                    <p className="text-sm text-gray-600 font-mono bg-gray-900 p-2 rounded">
                        Your address: {address}
                    </p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto py-12 px-4">
                <h1 className="text-4xl font-bold mb-8">Admin Panel 🛡️</h1>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-800/50 text-gray-400 text-sm uppercase">
                                <tr>
                                    <th className="p-4">Collection</th>
                                    <th className="p-4">Address</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {allCollections.map((addr, index) => {
                                    const nameData = collectionNames?.[index];
                                    const name = nameData?.status === "success" ? String(nameData.result) : "Loading...";

                                    const uriData = collectionURIs?.[index];
                                    const imageUrl = uriData?.status === "success" ? String(uriData.result) : null;

                                    const currentStatus = moderationData[addr.toLowerCase()] || 'neutral';

                                    return (
                                        <tr key={addr} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="p-4 font-medium text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-lg">🎨</div>
                                                        )}
                                                    </div>
                                                    <Link href={`/mint/${addr}`} className="hover:underline hover:text-blue-400">
                                                        {name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-sm text-gray-500">
                                                {addr}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                                    ${currentStatus === 'verified' ? 'bg-green-500/20 text-green-400' :
                                                        currentStatus === 'hidden' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-gray-700/50 text-gray-400'}`}>
                                                    {currentStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => updateStatus(addr, 'verified')}
                                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors
                                                        ${currentStatus === 'verified'
                                                            ? 'bg-green-600 text-white cursor-default'
                                                            : 'bg-gray-800 text-green-400 hover:bg-green-500/20'}`}
                                                    disabled={currentStatus === 'verified'}
                                                >
                                                    Verify
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(addr, 'neutral')}
                                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors
                                                        ${currentStatus === 'neutral'
                                                            ? 'bg-gray-600 text-white cursor-default'
                                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                                    disabled={currentStatus === 'neutral'}
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(addr, 'hidden')}
                                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors
                                                        ${currentStatus === 'hidden'
                                                            ? 'bg-red-600 text-white cursor-default'
                                                            : 'bg-gray-800 text-red-400 hover:bg-red-500/20'}`}
                                                    disabled={currentStatus === 'hidden'}
                                                >
                                                    Hide
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
