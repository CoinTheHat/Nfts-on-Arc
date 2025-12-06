"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

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
        if (src) {
            setCurrentSrc(resolveIPFS(src, 0));
            setGatewayIndex(0);
            setError(false);
            setLoading(true);
        }
    }, [src]);

    const handleError = () => {
        if (src?.startsWith("ipfs://")) {
            const nextIndex = gatewayIndex + 1;
            if (nextIndex < IPFS_GATEWAYS.length) {
                setGatewayIndex(nextIndex);
                setCurrentSrc(resolveIPFS(src, nextIndex));
                // Keep loading true as we try next gateway
            } else {
                setLoading(false);
                setError(true);
            }
        } else {
            setLoading(false);
            setError(true);
        }
    };

    if (!src || error) {
        return (
            <div className={`flex items-center justify-center bg-gray-800 text-gray-600 ${className}`}>
                <span className="text-4xl">🎨</span>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {loading && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse z-10" />
            )}
            <Image
                src={currentSrc}
                alt={alt}
                fill={fill}
                width={!fill ? width : undefined}
                height={!fill ? height : undefined}
                className={`object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
                onError={handleError}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized={true} // Try unoptimized to bypass next/image server-side fetch issues with some gateways
            />
        </div>
    );
}
