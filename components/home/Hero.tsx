import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function Hero() {
    return (
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-4 overflow-hidden">

            {/* 1. Minimal Radial Glow (Background) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-[160px] opacity-[0.06] pointer-events-none" />

            {/* 2. Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 z-10 leading-[1.1] text-text-primary">
                Discover & Launch <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                    Premium NFTs
                </span>
            </h1>

            {/* 3. Subheadline (High Readability) */}
            <p className="text-lg md:text-xl text-text-secondary max-w-xl mx-auto mb-10 font-normal leading-relaxed">
                The most efficient marketplace for creators and collectors. <br className="hidden md:block" />
                Launch securely. Trade instantly.
            </p>

            {/* 4. CTAs (Primary Solid, Secondary Outline) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 z-10 w-full sm:w-auto">
                <Button
                    size="lg"
                    href="/create"
                    className="text-lg px-8 py-4 w-full sm:w-auto h-auto min-w-[200px] shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 bg-primary hover:bg-primary-hover text-white border-none"
                >
                    Create Collection
                </Button>
                <Button
                    size="lg"
                    variant="secondary"
                    href="/explore"
                    className="text-lg px-8 py-4 w-full sm:w-auto h-auto min-w-[200px]"
                >
                    Explore Collections
                </Button>
            </div>
        </section>
    );
}
