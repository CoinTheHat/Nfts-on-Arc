"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { useParams } from "next/navigation";
import { formatEther } from "viem";
import Layout from "@/components/Layout";
import { arcTestnet } from "@/lib/arcChain";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import Link from "next/link";
import { useUsername, formatAddress } from "@/lib/useUsername";

export default function MintPage() {
    const params = useParams();
    const address = params.address as `0x${string}`;
    const { isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const { writeContract, data: hash, error: writeError, isPending: isWritePending } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const contractConfig = {
        address,
        abi: NFTCollectionArtifact.abi,
    } as const;

    const { data: contractData, refetch, error: readError } = useReadContracts({
        contracts: [
            { ...contractConfig, functionName: "name" },
            { ...contractConfig, functionName: "symbol" },
            { ...contractConfig, functionName: "maxSupply" },
            { ...contractConfig, functionName: "totalMinted" },
            { ...contractConfig, functionName: "mintPrice" },
            { ...contractConfig, functionName: "collectionURI" },
            { ...contractConfig, functionName: "owner" },
            { ...contractConfig, functionName: "maxPerWallet" },
            { ...contractConfig, functionName: "balanceOf", args: [address] },
        ],
    });

    const [name, symbol, maxSupply, totalMinted, mintPrice, collectionURI, owner, maxPerWallet, userBalance] = contractData || [];

    useEffect(() => {
        if (isConfirmed) {
            refetch();
        }
    }, [isConfirmed, refetch]);

    const handleMint = () => {
        console.log("🎯 Mint button clicked!");
        console.log("mintPrice:", mintPrice?.result);
        if (mintPrice?.result === undefined) {
            console.error("❌ mintPrice is not loaded yet!");
            return;
        }
        writeContract({
            ...contractConfig,
            functionName: "mint",
            value: mintPrice.result as bigint,
        });
    };

    const isWrongNetwork = isConnected && chainId !== arcTestnet.id;
    const isSoldOut = totalMinted?.result && maxSupply?.result ? totalMinted.result >= maxSupply.result : false;

    const mintProgress = totalMinted?.result && maxSupply?.result
        ? (Number(totalMinted.result) / Number(maxSupply.result)) * 100
        : 0;

    const priceFormatted = mintPrice?.result ? formatEther(mintPrice.result as bigint) : "0";

    // Fetch username for collection owner
    const ownerAddress = owner?.result as string | undefined;
    const { username: ownerUsername } = useUsername(ownerAddress);

    // Debug logging
    console.log("🔍 Debug Info:", {
        isConnected,
        isWrongNetwork,
        isSoldOut,
        nameLoaded: Boolean(name?.result),
        mintPriceLoaded: Boolean(mintPrice?.result),
        buttonDisabled: isWritePending || isConfirming || isSoldOut || !Boolean(name?.result)
    });

    if (readError) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Collection</h1>
                    <p className="text-gray-400">Invalid contract address or network issue.</p>
                    <Link href="/" className="mt-8 text-blue-400 hover:underline">Return Home</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-xl mx-auto">
                <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
                    {/* Header / Metadata */}
                    <div className="text-center mb-8">
                        {name?.status === "success" ? (
                            <>
                                <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">
                                    {String(name.result)}
                                </h1>
                                <p className="text-xl text-gray-400 font-mono">{String(symbol?.result)}</p>
                            </>
                        ) : (
                            <div className="animate-pulse space-y-4">
                                <div className="h-10 bg-gray-800 rounded w-3/4 mx-auto"></div>
                                <div className="h-6 bg-gray-800 rounded w-1/4 mx-auto"></div>
                            </div>
                        )}
                    </div>

                    {/* Collection Image */}
                    {collectionURI?.status === "success" && String(collectionURI.result) && (
                        <div className="mb-8 rounded-xl overflow-hidden">
                            <img
                                src={String(collectionURI.result)}
                                alt={name?.status === "success" ? String(name.result) : "NFT Collection"}
                                className="w-full h-64 object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* Creator Info */}
                    {owner?.status === "success" && (
                        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                            <span>Created by:</span>
                            <code className="bg-gray-800 px-3 py-1 rounded font-mono text-blue-400">
                                {formatAddress(String(owner.result), ownerUsername)}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(String(owner.result));
                                    alert("Address copied!");
                                }}
                                className="text-gray-500 hover:text-white transition-colors"
                                title="Copy address"
                            >
                                📋
                            </button>
                        </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-sm font-medium text-gray-400 mb-2">
                            <span>Total Minted</span>
                            <span>
                                {totalMinted?.result?.toString() ?? "0"} / {maxSupply?.result?.toString() ?? "..."}
                            </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 ease-out"
                                style={{ width: `${mintProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Price Info */}
                    <div className="text-center mb-6">
                        <div className="inline-block bg-gray-800 px-4 py-2 rounded-lg">
                            <span className="text-gray-400 text-sm uppercase tracking-wider">Price</span>
                            <div className="text-2xl font-bold text-white">
                                {priceFormatted === "0" ? "Free" : `${priceFormatted} USDC`}
                            </div>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-4">
                        {!isConnected ? (
                            <div className="text-center p-6 bg-gray-950/50 rounded-xl border border-gray-800">
                                <p className="text-gray-400 mb-4">Connect wallet to mint</p>
                            </div>
                        ) : isWrongNetwork ? (
                            <button
                                onClick={() => switchChain({ chainId: arcTestnet.id })}
                                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all"
                            >
                                Switch to Arc Testnet
                            </button>
                        ) : (
                            <button
                                onClick={handleMint}
                                disabled={isWritePending || isConfirming || isSoldOut || !Boolean(name?.result) || Boolean(userBalance?.result && maxPerWallet?.result && Number(userBalance.result) >= Number(maxPerWallet.result))}
                                className={`w-full py-4 rounded-xl font-bold text-xl transition-all shadow-lg ${isSoldOut || (userBalance?.result && maxPerWallet?.result && Number(userBalance.result) >= Number(maxPerWallet.result))
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : isWritePending || isConfirming
                                        ? "bg-blue-600/50 text-white cursor-wait"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] hover:shadow-blue-500/25 text-white"
                                    }`}
                            >
                                {userBalance?.result && maxPerWallet?.result && Number(userBalance.result) >= Number(maxPerWallet.result)
                                    ? "✓ Already Minted (Max Reached)"
                                    : isSoldOut
                                        ? "Sold Out"
                                        : isWritePending
                                            ? "Confirm in Wallet..."
                                            : isConfirming
                                                ? "Minting..."
                                                : `Mint (${priceFormatted === "0" ? "Free" : `${priceFormatted} USDC`})`}
                            </button>
                        )}

                        {writeError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                {writeError.message.split("\n")[0]}
                            </div>
                        )}

                        {isConfirmed && (
                            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center animate-fade-in">
                                <h3 className="text-green-400 font-bold text-lg mb-2">Mint Successful! 🎉</h3>
                                <a
                                    href={`https://testnet.arcscan.app/tx/${hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                                >
                                    View Transaction
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
