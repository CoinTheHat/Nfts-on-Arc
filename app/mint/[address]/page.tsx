"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { useParams } from "next/navigation";
import { formatEther } from "viem";
import Layout from "@/components/Layout";
import { arcTestnet } from "@/lib/arcChain";
import NFTCollectionArtifact from "@/lib/NFTCollection.json";
import Link from "next/link";
import { useUsername } from "@/lib/useUsername";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import NFTImage from "@/components/NFTImage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Abi } from "viem";

export default function MintPage() {
    const params = useParams();
    const address = params.address as `0x${string}`;
    const { isConnected, address: userAddress } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const { writeContract, data: hash, error: writeError, isPending: isWritePending } = useWriteContract();

    // UI State
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState("description");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { toast } = useToast();
    const { width, height } = useWindowSize();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Transaction Monitor
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isConfirmed) {
            setShowSuccessModal(true);
            refetch();
        }
        if (writeError) {
            toast(writeError.message.split("\n")[0] || "Mint failed", "error");
        }
    }, [isConfirmed, writeError]);

    // Contract Reads
    const contractConfig = {
        address,
        abi: NFTCollectionArtifact.abi as unknown as Abi,
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
            { ...contractConfig, functionName: "balanceOf", args: [userAddress] },
            { ...contractConfig, functionName: "mintStart" },
            { ...contractConfig, functionName: "mintEnd" },
        ],
    });

    const [name, symbol, maxSupply, totalMinted, mintPrice, collectionURI, owner, maxPerWallet, userBalance, mintStart, mintEnd] = contractData || [];

    // Logic
    const isWrongNetwork = isConnected && chainId !== arcTestnet.id;
    const isSoldOut = totalMinted?.result !== undefined && maxSupply?.result !== undefined ? Number(totalMinted.result) >= Number(maxSupply.result) : false;

    // Time Logic
    const now = Math.floor(Date.now() / 1000);
    const start = mintStart?.result ? Number(mintStart.result) : 0;
    const end = mintEnd?.result ? Number(mintEnd.result) : 0;
    const isStarted = start === 0 || now >= start;
    const isEnded = end !== 0 && now > end;
    const isActive = isStarted && !isEnded;

    const mintProgress = totalMinted?.result && maxSupply?.result
        ? (Number(totalMinted.result) / Number(maxSupply.result)) * 100
        : 0;

    const priceEth = mintPrice?.result ? formatEther(mintPrice.result as bigint) : "0";
    const maxAvailable = maxPerWallet?.result ? Number(maxPerWallet.result) - Number(userBalance?.result || 0) : 10;

    const ownerAddress = owner?.result as string | undefined;
    const { username: ownerUsername } = useUsername(ownerAddress);

    const handleMint = () => {
        if (mintPrice?.result === undefined) return;
        const totalPrice = BigInt(mintPrice.result as bigint) * BigInt(quantity);
        writeContract({
            ...contractConfig,
            functionName: "mintMultiple",
            args: [quantity],
            value: totalPrice,
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast("Copied to clipboard", "success");
    };

    const tabsList = [
        { id: "description", label: "Description" },
        { id: "details", label: "Details" },
        { id: "activity", label: "Activity" },
    ];

    if (readError) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <h1 className="text-2xl font-bold mb-4 text-text-primary">Collection Not Found</h1>
                    <Button href="/explore">Explore Collections</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {showSuccessModal && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                    <Card className="max-w-md w-full p-8 text-center bg-surface-1 border-border-default shadow-2xl relative">
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary"
                        >
                            ✕
                        </button>
                        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl border border-success/20">
                            🎉
                        </div>
                        <h2 className="text-3xl font-bold text-text-primary mb-2">Mint Successful!</h2>
                        <p className="text-text-secondary mb-8">You minted <span className="font-bold">{quantity}x {name?.result as string}</span></p>
                        <div className="flex flex-col gap-3">
                            <Button href={`/dashboard`} fullWidth size="lg">View in Dashboard</Button>
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={() => window.open(`https://twitter.com/intent/tweet?text=Just minted ${name?.result as string} on Arc! 🚀&url=${window.location.href}`, '_blank')}
                            >
                                Share on X
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            <div className="bg-bg-base min-h-screen pb-20">
                {/* Navbar Spacer */}
                <div className="h-4 md:h-8" />

                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid lg:grid-cols-12 gap-8 lg:gap-16">

                        {/* LEFT: Image & Content */}
                        <div className="lg:col-span-7 space-y-8">
                            {/* Artwork */}
                            <div className="relative aspect-square w-full bg-surface-2 rounded-2xl overflow-hidden shadow-sm border border-border-default group">
                                <NFTImage
                                    src={collectionURI?.result as string}
                                    alt={name?.result as string}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute top-4 left-4">
                                    <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-full px-3 py-1 text-xs font-bold">
                                        {symbol?.result as string}
                                    </div>
                                </div>
                            </div>

                            {/* Tabs & Content */}
                            <div>
                                <div className="flex gap-8 border-b border-border-default mb-6">
                                    {tabsList.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                pb-3 text-sm font-bold transition-all border-b-2 
                                                ${activeTab === tab.id
                                                    ? "border-primary text-text-primary"
                                                    : "border-transparent text-text-tertiary hover:text-text-secondary"
                                                }
                                            `}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="min-h-[200px] animate-fade-in">
                                    {activeTab === "description" && (
                                        <div className="bg-surface-1 border border-border-default rounded-xl p-6 text-text-secondary leading-relaxed space-y-4 shadow-sm">
                                            <p>
                                                <strong className="text-text-primary">{name?.result as string}</strong> is a unique collection on the Arc Network.
                                                Ownership is verified on-chain.
                                            </p>
                                            <p>
                                                Created by <span className="font-mono bg-surface-2 px-1 rounded text-text-primary">{ownerUsername || (ownerAddress ? `${ownerAddress.slice(0, 6)}...` : "Unknown")}</span>.
                                                This collection features unique digital assets securely stored on IPFS.
                                            </p>
                                        </div>
                                    )}

                                    {activeTab === "details" && (
                                        <div className="bg-surface-1 border border-border-default rounded-xl p-6 shadow-sm">
                                            <div className="space-y-0 divide-y divide-border-subtle">
                                                {[
                                                    { label: "Contract", value: address, copy: true },
                                                    { label: "Token Standard", value: "ERC-721" },
                                                    { label: "Network", value: "Arc Testnet" },
                                                    { label: "Max Per Wallet", value: maxPerWallet?.result?.toString() || "Unlimited" },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                                                        <span className="text-sm text-text-tertiary">{item.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-text-primary font-mono">{item.value}</span>
                                                            {item.copy && (
                                                                <button onClick={() => copyToClipboard(String(item.value))} className="text-text-tertiary hover:text-primary transition-colors">
                                                                    ❐
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "activity" && (
                                        <div className="bg-surface-1 border border-border-default rounded-xl p-6 shadow-sm flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-12 h-12 bg-surface-2 rounded-full flex items-center justify-center mb-3 text-2xl">
                                                📉
                                            </div>
                                            <p className="font-bold text-text-primary mb-1">No Activity Yet</p>
                                            <p className="text-sm text-text-tertiary">Be the first to mint from this collection.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Sticky Mint Panel */}
                        <div className="lg:col-span-5 relative">
                            <div className="sticky top-24 space-y-6">

                                {/* Header Info */}
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2 leading-tight">{name?.result as string}</h1>
                                    <div className="flex items-center gap-3">
                                        <Link href={`/user/${ownerAddress}`} className="flex items-center gap-2 group">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden border border-white">
                                                {/* Avatar Placeholder */}
                                            </div>
                                            <span className="text-sm font-bold text-text-secondary group-hover:text-primary transition-colors">
                                                {ownerUsername || (ownerAddress ? `${ownerAddress.slice(0, 6)}...` : "Creator")}
                                            </span>
                                        </Link>
                                        <Badge variant="default" className="text-[10px] py-0.5 px-2 bg-blue-100 text-blue-700 border-blue-200 rounded-full">
                                            VERIFIED
                                        </Badge>
                                    </div>
                                </div>

                                {/* Mint Card */}
                                <div className="bg-surface-1 border border-border-default rounded-2xl p-6 shadow-lg">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1">Mint Price</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-text-primary">
                                                    {priceEth === "0" ? "Free" : priceEth}
                                                </span>
                                                <span className="text-sm font-bold text-text-tertiary">{CURRENCY_SYMBOL}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1.5 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                                <span className="text-xs font-bold text-success uppercase">Live</span>
                                            </div>
                                            <p className="text-sm font-mono text-text-secondary font-medium">
                                                {totalMinted?.result?.toString() ?? "0"} / {maxSupply?.result?.toString() ?? "..."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-8">
                                        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000 ease-out"
                                                style={{ width: `${mintProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs text-text-tertiary">
                                            <span>{Math.round(mintProgress)}% minted</span>
                                            <span>{maxSupply?.result?.toString()} total</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!mounted ? (
                                        <div className="h-12 bg-surface-2 rounded-lg animate-pulse w-full" />
                                    ) : !isConnected ? (
                                        <Button fullWidth size="lg" disabled>Connect Wallet to Mint</Button>
                                    ) : isWrongNetwork ? (
                                        <Button fullWidth variant="danger" size="lg" onClick={() => switchChain({ chainId: arcTestnet.id })}>
                                            Switch Network
                                        </Button>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Quantity Stepper */}
                                            <div className="flex items-center justify-between bg-surface-2 rounded-xl p-1 border border-border-default">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    disabled={quantity <= 1}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-1 text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-lg font-bold"
                                                >
                                                    -
                                                </button>
                                                <span className="font-mono text-lg font-bold text-text-primary">{quantity}</span>
                                                <button
                                                    onClick={() => setQuantity(Math.min(quantity + 1, maxAvailable))}
                                                    disabled={quantity >= maxAvailable}
                                                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-1 text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-lg font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Total & CTA */}
                                            <div className="flex justify-between text-sm px-1">
                                                <span className="text-text-tertiary">Total</span>
                                                <span className="font-bold text-text-primary">{(Number(priceEth) * quantity).toFixed(4)} {CURRENCY_SYMBOL}</span>
                                            </div>

                                            <Button
                                                fullWidth
                                                size="lg"
                                                className="h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                                                onClick={handleMint}
                                                isLoading={isWritePending || isConfirming}
                                                disabled={isSoldOut || !isActive || maxAvailable <= 0}
                                            >
                                                {isSoldOut ? "Sold Out" : "Mint Now"}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Secondary Actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => copyToClipboard(window.location.href)}
                                        className="border-border-default bg-surface-1 hover:bg-surface-2 text-text-secondary"
                                    >
                                        Share
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        href={`https://scan.testnet.arc.network/address/${address}`}
                                        external
                                        className="border-border-default bg-surface-1 hover:bg-surface-2 text-text-secondary"
                                    >
                                        Contract
                                    </Button>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

                {/* Mobile Bottom Sticky Bar (Visible only on small screens) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-1 border-t border-border-default lg:hidden z-40 safe-area-bottom">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <p className="text-xs text-text-tertiary font-bold uppercase">Price</p>
                            <p className="font-bold text-text-primary">{priceEth} {CURRENCY_SYMBOL}</p>
                        </div>
                        <Button className="flex-1 shadow-lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            Mint Now
                        </Button>
                    </div>
                </div>

            </div>
        </Layout>
    );
}

// -- Helpers --
