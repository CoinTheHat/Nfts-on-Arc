import { useState, useEffect } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import Layout from "@/components/Layout";
import Link from "next/link";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddress, factoryAddresses } from "@/lib/factoryAddress";
import { supabase } from "@/lib/supabaseClient";

import { Abi } from "viem";

export default function Home() {
  const [moderationData, setModerationData] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchModeration = async () => {
      const { data } = await supabase.from('collection_moderation').select('address, status');
      const map: Record<string, string> = {};
      data?.forEach((item: any) => {
        map[item.address.toLowerCase()] = item.status;
      });
      setModerationData(map);
    };
    fetchModeration();
  }, []);

  // Fetch collections from ALL factories
  const { data: allFactoriesData } = useReadContracts({
    contracts: factoryAddresses.map((factoryAddr) => ({
      address: factoryAddr as `0x${string}`,
      abi: NFTFactoryArtifact.abi as unknown as Abi,
      functionName: "getAllCollections",
    })),
  });

  // Combine all collections from all factories
  const allCollections = (allFactoriesData || [])
    .flatMap((result) => result.status === "success" ? result.result as string[] : [])
    .reverse(); // Show newest first

  // Filter out hidden collections for the main list
  const visibleCollections = allCollections.filter(addr => {
    const status = moderationData[addr.toLowerCase()];
    return status !== 'hidden';
  });

  // Filter verified collections for Featured section
  const featuredCollections = allCollections.filter(addr => {
    const status = moderationData[addr.toLowerCase()];
    return status === 'verified';
  }).slice(0, 3); // Top 3 verified

  // Prepare to fetch metadata for visible collections (pagination could be added here)
  const collectionsToDisplay = visibleCollections.slice(0, 6) as `0x${string}`[];

  // Bulk fetch names
  const { data: collectionNames } = useReadContracts({
    contracts: collectionsToDisplay.map((addr) => ({
      address: addr,
      abi: NFTCollectionArtifact.abi as unknown as Abi,
      functionName: "name",
    })),
  });

  // Bulk fetch URIs
  const { data: collectionURIs } = useReadContracts({
    contracts: collectionsToDisplay.map((addr) => ({
      address: addr,
      abi: NFTCollectionArtifact.abi as unknown as Abi,
      functionName: "collectionURI",
    })),
  });

  // Bulk fetch names for Featured
  const { data: featuredNames } = useReadContracts({
    contracts: featuredCollections.map((addr) => ({
      address: addr as `0x${string}`,
      abi: NFTCollectionArtifact.abi as unknown as Abi,
      functionName: "name",
    })),
  });

  // Bulk fetch URIs for Featured
  const { data: featuredURIs } = useReadContracts({
    contracts: featuredCollections.map((addr) => ({
      address: addr as `0x${string}`,
      abi: NFTCollectionArtifact.abi as unknown as Abi,
      functionName: "collectionURI",
    })),
  });

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent pb-2">
            Launch NFTs on Arc in 1 Minute
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Deploy a free NFT collection and share a mint link. No backend. No payments. Just Arc.
          </p>

          <div className="pt-8">
            <Link
              href="/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
            >
              Create Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Collections Section */}
      {featuredCollections.length > 0 && (
        <div className="max-w-6xl mx-auto mt-20">
          <h2 className="text-3xl font-bold mb-8 text-center md:text-left flex items-center gap-2">
            <span>🔥</span> Featured Mints
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredCollections.map((addr, index) => {
              const nameData = featuredNames?.[index];
              const name = nameData?.status === "success" ? String(nameData.result) : "Loading...";

              const uriData = featuredURIs?.[index];
              const imageUrl = uriData?.status === "success" ? String(uriData.result) : null;

              return (
                <Link
                  key={addr}
                  href={`/mint/${addr}`}
                  className="bg-gray-900/50 border border-yellow-500/30 hover:border-yellow-500 rounded-2xl p-6 transition-all hover:-translate-y-1 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                    VERIFIED
                  </div>
                  <div className="h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl">🎨</span>';
                        }}
                      />
                    ) : (
                      <span className="text-4xl">🎨</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1 truncate">{name}</h3>
                  <p className="text-sm text-gray-500 font-mono truncate">{addr}</p>
                  <div className="mt-4 text-yellow-400 text-sm font-medium group-hover:text-yellow-300">
                    Mint Now →
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* All Collections Section */}
      <div className="max-w-6xl mx-auto mt-20">
        <h2 className="text-3xl font-bold mb-8 text-center md:text-left">Latest Collections</h2>

        {collectionsToDisplay.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No collections found.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {collectionsToDisplay.map((addr, index) => {
              const nameData = collectionNames?.[index];
              const name = nameData?.status === "success" ? String(nameData.result) : "Loading...";

              const uriData = collectionURIs?.[index];
              const imageUrl = uriData?.status === "success" ? String(uriData.result) : null;

              return (
                <Link
                  key={addr}
                  href={`/mint/${addr}`}
                  className="bg-gray-900/50 border border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:-translate-y-1 group"
                >
                  <div className="h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl">🎨</span>';
                        }}
                      />
                    ) : (
                      <span className="text-4xl">🎨</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1 truncate">{name}</h3>
                  <p className="text-sm text-gray-500 font-mono truncate">{addr}</p>
                  <div className="mt-4 text-blue-400 text-sm font-medium group-hover:text-blue-300">
                    Mint Now →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-20 text-left max-w-6xl mx-auto border-t border-gray-800 pt-16">
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-2xl font-bold mb-4">1</div>
          <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
          <p className="text-gray-400">Connect your wallet to the Arc Testnet to get started.</p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 text-2xl font-bold mb-4">2</div>
          <h3 className="text-xl font-bold mb-2">Deploy Collection</h3>
          <p className="text-gray-400">Set your collection name, symbol, and supply. Deploy instantly.</p>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 text-2xl font-bold mb-4">3</div>
          <h3 className="text-xl font-bold mb-2">Share Mint Link</h3>
          <p className="text-gray-400">Get a public mint page URL to share with your community.</p>
        </div>
      </div>
    </Layout>
  );
}

