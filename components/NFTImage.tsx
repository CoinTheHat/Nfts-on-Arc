"use client";

import Image from "next/image";
import { useState } from "react";

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

const resolveIPFS = (url: string) => {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
        return url.replace("ipfs://", IPFS_GATEWAY);
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

    const imageUrl = resolveIPFS(src || "");

    if (!imageUrl || error) {
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
                src={imageUrl}
                alt={alt}
                fill={fill}
                width={!fill ? width : undefined}
                height={!fill ? height : undefined}
                className={`object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
    );
}
