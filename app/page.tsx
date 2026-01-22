"use client";

import { useState, useEffect } from "react";
import { useReadContracts } from "wagmi";
import Layout from "@/components/Layout";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { factoryAddresses } from "@/lib/factoryAddress";
import { supabase } from "@/lib/supabaseClient";
import { formatEther, Abi } from "viem";

// New Modular Components
import Hero from "@/components/home/Hero";
import StatsStrip from "@/components/home/StatsStrip";
import FeaturedSection from "@/components/home/FeaturedSection";
import TrackingSection from "@/components/home/TrackingSection";
import LatestGrid from "@/components/home/LatestGrid";
import CreatorSupport from "@/components/home/CreatorSupport";

export default function Home() {
  const [moderationData, setModerationData] = useState<Record<string, string>>({});
  const [loadingMod, setLoadingMod] = useState(true);

  useEffect(() => {
    const fetchModeration = async () => {
      const { data } = await supabase.from('collection_moderation').select('address, status');
      const map: Record<string, string> = {};
      data?.forEach((item: any) => {
        map[item.address.toLowerCase()] = item.status;
      });
      setModerationData(map);
      setLoadingMod(false);
    };
    fetchModeration();
  }, []);

  // Fetch collections from ALL factories
  const { data: allFactoriesData, isLoading: isLoadingFactories } = useReadContracts({
    contracts: factoryAddresses.map((factoryAddr) => ({
      address: factoryAddr as `0x${string}`,
      abi: NFTFactoryArtifact.abi as unknown as Abi,
      functionName: "getAllCollections",
    })),
  });

  const allCollections = (allFactoriesData || [])
    .flatMap((result) => result.status === "success" ? result.result as string[] : [])
    .reverse();

  const featuredCollections = allCollections.filter(addr => {
    const status = moderationData[addr.toLowerCase()];
    return status === 'verified';
  }).slice(0, 3) as `0x${string}`[];

  const collectionsToDisplay = allCollections.slice(0, 12) as `0x${string}`[];

  // Batch Contracts
  const { data: collectionNames } = useReadContracts({
    contracts: collectionsToDisplay.map((addr) => ({ address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "name" })),
  });
  const { data: collectionURIs } = useReadContracts({
    contracts: collectionsToDisplay.map((addr) => ({ address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "collectionURI" })),
  });
  const { data: collectionSupply } = useReadContracts({
    contracts: collectionsToDisplay.map((addr) => ({ address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "maxSupply" })),
  });
  const { data: collectionMinted } = useReadContracts({
    contracts: collectionsToDisplay.map((addr) => ({ address: addr, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "totalMinted" })),
  });

  // Featured Batch
  const { data: featuredNames } = useReadContracts({
    contracts: featuredCollections.map((addr) => ({ address: addr as `0x${string}`, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "name" })),
  });
  const { data: featuredURIs } = useReadContracts({
    contracts: featuredCollections.map((addr) => ({ address: addr as `0x${string}`, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "collectionURI" })),
  });
  const { data: featuredSupply } = useReadContracts({
    contracts: featuredCollections.map((addr) => ({ address: addr as `0x${string}`, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "maxSupply" })),
  });
  const { data: featuredMinted } = useReadContracts({
    contracts: featuredCollections.map((addr) => ({ address: addr as `0x${string}`, abi: NFTCollectionArtifact.abi as unknown as Abi, functionName: "totalMinted" })),
  });

  // Fetch Prices for Volume Calc (All Collections)
  const { data: allPrices } = useReadContracts({
    contracts: allCollections.map((addr) => ({
      address: addr as `0x${string}`,
      abi: NFTCollectionArtifact.abi as unknown as Abi,
      functionName: "mintPrice"
    })),
  });

  const { data: allMinted } = useReadContracts({
    contracts: allCollections.map((addr) => ({
      address: addr as `0x${string}`,
      abi: NFTCollectionArtifact.abi as unknown as Abi,
      functionName: "totalMinted"
    })),
  });

  const isLoading = isLoadingFactories || loadingMod;

  // Calculate aggregated stats
  const totalMintedSum = (allMinted || []).reduce((acc: number, curr) => {
    if (curr.status === "success" && curr.result) {
      return acc + Number(curr.result);
    }
    return acc;
  }, 0);

  const totalVolumeSum = allCollections.reduce((acc, _, index) => {
    const minted = allMinted?.[index]?.result ? Number(allMinted[index].result) : 0;
    const priceStr = allPrices?.[index]?.result ? formatEther(allPrices[index].result as bigint) : "0";
    return acc + (minted * Number(priceStr));
  }, 0);

  // Mocking ARC/USD parity or just displaying value with $ symbol for now as requested
  // "Currency: Display as $"
  const formattedVolume = `$${totalVolumeSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Layout>
      {/* 1. Hero & Stats (Bg Base) */}
      <div className="bg-bg-base border-b border-border-subtle">
        <Hero />
        <div className="-mt-8 md:-mt-12 mb-12 relative z-20">
          <StatsStrip
            totalVolume={formattedVolume}
            activeMints={allCollections.length}
            newCollections24h={0} // No indexer for time yet
            totalMinted24h={totalMintedSum}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 2. Featured Section (Bg Base) */}
      {featuredCollections.length > 0 && (
        <section className="bg-bg-base border-b border-border-subtle">
          <FeaturedSection
            collections={featuredCollections}
            names={featuredNames || []}
            uris={featuredURIs || []}
            mintedData={featuredMinted || []}
            supplyData={featuredSupply || []}
          />
        </section>
      )}

      {/* 3. Tracking Section (Bg Alt) - Rhythm Break */}
      <section className="bg-bg-alt border-b border-border-subtle">
        <TrackingSection
          collections={collectionsToDisplay}
          names={collectionNames || []}
          uris={collectionURIs || []}
          mintedData={collectionMinted || []}
          supplyData={collectionSupply || []}
        />
      </section>

      {/* 4. Latest Collections (Bg Base) */}
      <section className="bg-bg-base">
        <LatestGrid
          collections={collectionsToDisplay}
          names={collectionNames || []}
          uris={collectionURIs || []}
          mintedData={collectionMinted || []}
          supplyData={collectionSupply || []}
          moderationData={moderationData}
          isLoading={isLoading}
        />
      </section>

      {/* 5. Creator Support (Bg Alt) */}
      <section className="bg-bg-alt border-t border-border-subtle">
        <CreatorSupport />
      </section>
    </Layout>
  );
}
