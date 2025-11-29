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
    const [quantity, setQuantity] = useState(1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const isWrongNetwork = isConnected && chainId !== arcTestnet.id;
    const isSoldOut = totalMinted?.result && maxSupply?.result ? totalMinted.result >= maxSupply.result : false;

    const mintProgress = totalMinted?.result && maxSupply?.result
        ? (Number(totalMinted.result) / Number(maxSupply.result)) * 100
        : 0;

    const priceInUSDC = mintPrice?.result ? (Number(mintPrice.result) / 1e6).toFixed(2) : "0";
    const maxAvailable = maxPerWallet?.result ? Number(maxPerWallet.result) - Number(userBalance?.result || 0) : 1;

    // Fetch username for collection owner
    const ownerAddress = owner?.result as string | undefined;
    const { username: ownerUsername } = useUsername(ownerAddress);

    const handleMintMultiple = () => {
        console.log("Mint button clicked");
        console.log("Quantity:", quantity);
        console.log("Mint Price Result:", mintPrice?.result);

        if (!mintPrice?.result) {
            console.error("Mint price is missing");
            return;
        }

        const totalPrice = BigInt(mintPrice.result as bigint) * BigInt(quantity);
        console.log("Total Price:", totalPrice.toString());

        console.log("Calling writeContract with:", {
            ...contractConfig,
            functionName: "mintMultiple",
            args: [quantity],
            value: totalPrice,
        });

        writeContract({
            ...contractConfig,
            functionName: "mintMultiple",
            args: [quantity],
            value: totalPrice,
        }, {
            onError: (error) => {
                console.error("Contract write error:", error);
            },
            onSuccess: (data) => {
                console.log("Contract write success:", data);
            }
        });
    };

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
                    {/* Header */}
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
                        <div className="mb-8 mx-auto max-w-md aspect-square rounded-2xl overflow-hidden bg-gray-900 border-2 border-gray-800 flex items-center justify-center">
                            <img
                                src={String(collectionURI.result)}
                                alt={name?.status === "success" ? String(name.result) : "NFT Collection"}
                                className="w-full h-full object-contain"
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
                            <Link href={`/user/${owner.result}`} className="bg-gray-800 px-3 py-1 rounded font-mono text-blue-400 hover:text-blue-300 transition-colors">
                                {formatAddress(String(owner.result), ownerUsername)}
                            </Link>
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
                            <span className="text-gray-400 text-sm uppercase tracking-wider">Price per NFT</span>
                            <div className="text-2xl font-bold text-white">
                                {priceInUSDC === "0" ? "Free" : `${priceInUSDC} USDC`}
                            </div>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-4">
                        {/* Quantity Selector */}
                        {mounted && isConnected && !isWrongNetwork && !isSoldOut && maxAvailable > 0 && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                                <label className="block text-sm font-bold text-gray-300 mb-3">Quantity</label>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
                                        disabled={quantity <= 1}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={maxAvailable}
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setQuantity(Math.min(Math.max(1, val), maxAvailable));
                                        }}
                                        className="w-24 h-12 text-center text-xl font-bold bg-gray-800 border border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(Math.min(quantity + 1, maxAvailable))}
                                        className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
                                        disabled={quantity >= maxAvailable}
                                    >
                                        +
                                    </button>
                                    <div className="flex-1 text-right">
                                        <p className="text-sm text-gray-400">Total: <span className="text-white font-bold">{(Number(priceInUSDC) * quantity).toFixed(2)} USDC</span></p>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                onClick={handleMintMultiple}
                                disabled={isWritePending || isConfirming || isSoldOut || !Boolean(name?.result) || maxAvailable <= 0}
                                className={`w-full py-4 rounded-xl font-bold text-xl transition-all shadow-lg ${isSoldOut || maxAvailable <= 0
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : isWritePending || isConfirming
                                        ? "bg-blue-600/50 text-white cursor-wait"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] hover:shadow-blue-500/25 text-white"
                                    }`}
                            >
                                {maxAvailable <= 0
                                    ? "✓ Already Minted (Max Reached)"
                                    : isSoldOut
                                        ? "Sold Out"
                                        : isWritePending
                                            ? "Preparing..."
                                            : isConfirming
                                                ? "Minting..."
                                                : `Mint ${quantity > 1 ? quantity + " NFTs" : ""} ${priceInUSDC === "0" ? "(Free)" : `(${(Number(priceInUSDC) * quantity).toFixed(2)} USDC)`}`
                                }
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
