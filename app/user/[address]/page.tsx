"use client";

import { useParams } from "next/navigation";
import { useReadContracts } from "wagmi";
import Layout from "@/components/Layout";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddresses } from "@/lib/factoryAddress";
import { Abi } from "viem";

export default function UserProfilePage() {
    const params = useParams();
    const address = params.address as string;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, [address]);

    const loadProfile = async () => {
        try {
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("wallet_address", address.toLowerCase())
                .single();

            setProfile(data);
        } catch (e) {
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all collections from all factories
    const { data: allFactoriesData } = useReadContracts({
        contracts: factoryAddresses.map((factoryAddr) => ({
            address: factoryAddr as `0x${string}`,
            abi: NFTFactoryArtifact.abi as unknown as Abi,
            functionName: "getAllCollections",
        })),
    });

    const collections = (allFactoriesData || [])
        .flatMap((result) => result.status === "success" ? result.result as string[] : []);

    // Fetch owners
    const { data: owners } = useReadContracts({
        contracts: collections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "owner",
        })),
    });

    // Fetch names
    const { data: names } = useReadContracts({
        contracts: collections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "name",
        })),
    });

    // Fetch balances
    const { data: balances } = useReadContracts({
        contracts: collections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "balanceOf",
            args: [address],
        })),
    });

    // Fetch collection images
    const { data: collectionURIs } = useReadContracts({
        contracts: collections.map((addr) => ({
            address: addr as `0x${string}`,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "collectionURI",
        })),
    });

    // Created collections
    const createdCollections = collections
        .map((addr, index) => ({
            address: addr,
            name: names?.[index]?.result,
            owner: owners?.[index]?.result,
            imageUrl: collectionURIs?.[index]?.result as string | undefined,
        }))
        .filter((c) => (c.owner as string)?.toLowerCase() === address.toLowerCase());

    // Minted NFTs
    const mintedCollections = collections
        .map((addr, index) => ({
            address: addr,
            name: names?.[index]?.result,
            balance: balances?.[index]?.result as bigint | undefined,
            imageUrl: collectionURIs?.[index]?.result as string | undefined,
        }))
        .filter((c) => c.balance && c.balance > BigInt(0));

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                {loading ? (
                    <p className="text-gray-400 text-center py-20">Loading...</p>
                ) : (
                    <>
                        {/* Profile Header */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">
                                        {profile?.username || `${address.slice(0, 6)}...${address.slice(-4)}`}
                                    </h1>
                                    {profile?.bio && <p className="text-gray-400 mb-3">{profile.bio}</p>}

                                    {profile?.twitter_handle && (
                                        <a
                                            href={`https://twitter.com/${profile.twitter_handle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-2"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                            </svg>
                                            <span>@{profile.twitter_handle}</span>
                                        </a>
                                    )}

                                    <p className="text-xs text-gray-500 font-mono">{address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Created Collections */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-4">Created Collections</h2>
                            {createdCollections.length === 0 ? (
                                <p className="text-gray-400">No collections created yet.</p>
                            ) : (
                                <div className="grid md:grid-cols-3 gap-4">
                                    {createdCollections.map((col) => (
                                        <Link key={col.address} href={`/mint/${col.address}`} className="bg-gray-900/50 border border-gray-800 hover:border-blue-500/50 rounded-xl overflow-hidden transition-all">
                                            {col.imageUrl && (
                                                <img src={col.imageUrl} alt={String(col.name)} className="w-full h-40 object-cover" />
                                            )}
                                            <div className="p-4">
                                                <h3 className="font-bold truncate">{String(col.name || "Untitled")}</h3>
                                                <p className="text-xs text-gray-500 font-mono truncate">{col.address}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Minted NFTs */}
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Minted NFTs</h2>
                            {mintedCollections.length === 0 ? (
                                <p className="text-gray-400">No NFTs minted yet.</p>
                            ) : (
                                <div className="grid md:grid-cols-4 gap-4">
                                    {mintedCollections.map((col) => (
                                        <Link key={col.address} href={`/mint/${col.address}`} className="bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 rounded-xl overflow-hidden transition-all">
                                            {col.imageUrl && (
                                                <img src={col.imageUrl} alt={String(col.name)} className="w-full h-32 object-cover" />
                                            )}
                                            <div className="p-4">
                                                <h4 className="font-bold text-sm truncate">{String(col.name || "Untitled")}</h4>
                                                <p className="text-xs text-gray-500">Owned: {col.balance?.toString()}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
