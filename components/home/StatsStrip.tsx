import { Skeleton } from "@/components/ui/Skeleton";

interface StatProps {
    label: string;
    value: string;
    trend?: string;
    sublabel?: string;
    isLoading?: boolean;
}

const Stat = ({ label, value, trend, sublabel, isLoading }: StatProps) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24 bg-surface-2" />
                <Skeleton className="h-8 w-32 bg-surface-2" />
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <span className="text-xs font-bold text-text-tertiary tracking-wider uppercase mb-1">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">{value}</span>
                {trend && (
                    <span className={`text-xs font-medium ${trend.startsWith('+') ? 'text-success' : 'text-error'}`}>
                        {trend}
                    </span>
                )}
            </div>
            {sublabel && <span className="text-xs text-text-muted mt-1">{sublabel}</span>}
        </div>
    );
};


interface StatsStripProps {
    totalVolume: string;
    activeMints: number;
    newCollections24h: number;
    totalMinted24h: number;
    isLoading: boolean;
}

export default function StatsStrip({
    totalVolume,
    activeMints,
    newCollections24h,
    totalMinted24h,
    isLoading
}: StatsStripProps) {

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Mobile: 2x2 Grid, Desktop: 4 Col */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative">

                {/* Divider lines for desktop */}
                <div className="hidden md:block absolute top-2 bottom-2 left-1/4 w-[1px] bg-border-default" />
                <div className="hidden md:block absolute top-2 bottom-2 left-2/4 w-[1px] bg-border-default" />
                <div className="hidden md:block absolute top-2 bottom-2 left-3/4 w-[1px] bg-border-default" />

                <Stat
                    label="24H Mint Volume"
                    value={totalVolume}
                    // trend="+??%" // Real trend data would come from historical stats
                    isLoading={isLoading}
                />
                <Stat
                    label="Active Mints"
                    value={activeMints.toLocaleString()}
                    // trend="+??" 
                    isLoading={isLoading}
                />
                <Stat
                    label="New Collections"
                    value={newCollections24h.toLocaleString()}
                    sublabel="Last 24 hours"
                    isLoading={isLoading}
                />
                <Stat
                    label="Total Minted"
                    value={totalMinted24h.toLocaleString()}
                    sublabel="All time"
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
