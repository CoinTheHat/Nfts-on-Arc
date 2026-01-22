"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "./ui/Skeleton";

const IPFS_GATEWAYS = [
    "https://ipfs.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://dweb.link/ipfs/"
];

const resolveIPFS = (url: string, gatewayIndex: number) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
        return url.replace("ipfs://", IPFS_GATEWAYS[gatewayIndex]);
    }
    return url;
};

interface NFTImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
}

export default function NFTImage({ src, alt, className, fill, width, height }: NFTImageProps) {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [gatewayIndex, setGatewayIndex] = useState(0);
    const [currentSrc, setCurrentSrc] = useState("");

    useEffect(() => {
        if (src && src.trim() !== "") {
            setCurrentSrc(resolveIPFS(src, 0));
            setGatewayIndex(0);
            setError(false);
            setLoading(true);
        } else {
            setError(true);
            setLoading(false);
            setCurrentSrc("");
        }
    }, [src]);

    const handleError = () => {
        if (src?.startsWith("ipfs://")) {
            const nextIndex = gatewayIndex + 1;
            if (nextIndex < IPFS_GATEWAYS.length) {
                setGatewayIndex(nextIndex);
                setCurrentSrc(resolveIPFS(src, nextIndex));
                // Resets loading to true to give visual feedback that we are trying again
                setLoading(true);
            } else {
                setLoading(false);
                setError(true);
            }
        } else {
            setLoading(false);
            setError(true);
        }
    };

    if (error || !currentSrc) {
        return (
            <div
                className={`flex flex-col items-center justify-center bg-gray-900 border border-gray-800/50 text-gray-700 ${className} ${fill ? 'w-full h-full' : ''}`}
                style={!fill ? { width, height } : undefined}
            >
                <span className="text-3xl grayscale opacity-50">🖼️</span>
                <span className="text-[10px] mt-2 font-mono">Image N/A</span>
            </div>
        );
    }

    return (
        <div
            className={`relative w-full h-full overflow-hidden bg-gray-900 ${className}`}
            style={!fill ? { width, height } : undefined}
        >
            {loading && (
                <div className="absolute inset-0 z-10 w-full h-full bg-gray-900 flex items-center justify-center">
                    <Skeleton className="w-full h-full rounded-none opacity-50" variant="rectangular" />
                </div>
            )}

            {/* Using standard img tag to bypass Next.js Image Optimization issues with dynamic IPFS */}
            <img
                src={currentSrc}
                alt={alt || "NFT Image"}
                className={`
                    w-full h-full object-cover transition-all duration-700 ease-out
                    ${loading ? 'opacity-0 scale-105 blur-lg' : 'opacity-100 scale-100 blur-0'}
                `}
                style={{ position: fill ? 'absolute' : 'static' }}
                onLoad={() => setLoading(false)}
                onError={handleError}
                loading="lazy"
            />
        </div>
    );
}
