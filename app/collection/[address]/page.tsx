"use client";

import { useParams, useRouter } from "next/navigation";
import { useReadContract, useAccount, useWriteContract, useBalance } from "wagmi";
import Layout from "@/components/Layout";
import Link from "next/link";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import { Abi, formatEther } from "viem";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export default function CollectionOverview() {
    const params = useParams();
    const router = useRouter();
    const { address: userAddress } = useAccount();
    const collectionAddress = params.address as `0x${string}`;

    const contractConfig = {
        address: collectionAddress,
        abi: NFTCollectionArtifact.abi as unknown as Abi,
    };

    const { data: name } = useReadContract({ ...contractConfig, functionName: "name" });
    const { data: symbol } = useReadContract({ ...contractConfig, functionName: "symbol" });
    const { data: maxSupply } = useReadContract({ ...contractConfig, functionName: "maxSupply" });
    const { data: totalMinted } = useReadContract({ ...contractConfig, functionName: "totalMinted" });
    const { data: mintPrice } = useReadContract({ ...contractConfig, functionName: "mintPrice" });
    const { data: collectionURI } = useReadContract({ ...contractConfig, functionName: "collectionURI" });
    const { data: owner } = useReadContract({ ...contractConfig, functionName: "owner" });

    const isOwner = userAddress && owner && userAddress.toLowerCase() === (owner as string).toLowerCase();

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{String(name || "Collection")}</h1>
                        <p className="text-gray-500 text-sm font-mono">{collectionAddress}</p>
                    </div>
                    <Link
                        href={`/mint/${collectionAddress}`}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                        View Mint Page ↗
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Left: Image */}
                    <div>
                        {Boolean(collectionURI) && (
                            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-900 border-2 border-gray-800">
                                <img
                                    src={String(collectionURI)}
                                    alt={String(name)}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right: Stats */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                                <p className="text-gray-400 text-sm mb-1">Total Supply</p>
                                <p className="text-3xl font-bold">{String(maxSupply || "0")}</p>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                                <p className="text-gray-400 text-sm mb-1">Minted</p>
                                <p className="text-3xl font-bold text-blue-400">{String(totalMinted || "0")}</p>
                            </div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                            <p className="text-gray-400 text-sm mb-1">Mint Price</p>
                            <p className="text-3xl font-bold text-green-400">
                                {mintPrice ? (Number(mintPrice) / 1e18).toFixed(4) : "0"} {CURRENCY_SYMBOL}
                            </p>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                            <p className="text-gray-400 text-sm mb-2">Collection Details</p>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Symbol</p>
                                    <p className="font-mono text-sm">{String(symbol || "-")}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Image URI</p>
                                    <p className="font-mono text-xs text-gray-400 break-all">{String(collectionURI || "-")}</p>
                                </div>
                            </div>
                        </div>

                        {Boolean(isOwner) && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-4">
                                <p className="text-blue-400 text-sm">✓ You are the owner of this collection</p>
                                <WithdrawButton contractAddress={collectionAddress} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function WithdrawButton({ contractAddress }: { contractAddress: `0x${string}` }) {
    const { data: balance } = useBalance({ address: contractAddress });
    const { writeContract, isPending, isSuccess, error } = useWriteContract();

    const handleWithdraw = () => {
        writeContract({
            address: contractAddress,
            abi: NFTCollectionArtifact.abi as unknown as Abi,
            functionName: "withdraw",
        });
    };

    return (
        <div>
            <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex justify-between items-center">
                <span className="text-gray-400 text-sm">Available Earnings</span>
                <span className="text-xl font-bold text-green-400">
                    {balance ? Number(formatEther(balance.value)).toFixed(4) : "0.0000"} {CURRENCY_SYMBOL}
                </span>
            </div>

            <button
                onClick={handleWithdraw}
                disabled={isPending || isSuccess || !balance || balance.value === 0n}
                className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition-all ${isSuccess
                    ? "bg-green-500 text-white cursor-default"
                    : isPending
                        ? "bg-blue-600/50 text-white cursor-wait"
                        : (!balance || balance.value === 0n)
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
            >
                {isSuccess ? "Withdrawn Successfully!" : isPending ? "Withdrawing..." : "Withdraw Earnings"}
            </button>
            {error && (
                <p className="text-red-400 text-xs mt-2 text-center">{error.message.split("\n")[0]}</p>
            )}
            <p className="text-xs text-gray-500 mt-2 text-center">
                * 0.5% platform fee applies
            </p>
        </div>
    );
}
