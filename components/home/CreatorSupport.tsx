import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button"; // Or Link

export default function CreatorSupport() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-20">
            <div className="grid md:grid-cols-2 gap-8">

                {/* Docs Card */}
                <Card hover className="bg-surface-1 border-border-default hover:border-primary/30 p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left group transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        📚
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-2">Creator Documentation</h3>
                        <p className="text-text-secondary mb-4 text-sm">Learn how to launch, manage, and grow your NFT collection on Arc Network.</p>
                        <a href="/docs" className="text-primary font-bold text-sm hover:underline">Read the Docs →</a>
                    </div>
                </Card>

                {/* Support Card */}
                <Card hover className="bg-surface-1 border-border-default hover:border-secondary/30 p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left group transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        🐦
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-2">Join the Community</h3>
                        <p className="text-text-secondary mb-4 text-sm">Follow us on X (Twitter) for updates or contact our support team.</p>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-secondary font-bold text-sm hover:underline">Follow @ArcNetwork →</a>
                    </div>
                </Card>

            </div>
        </div>
    );
}
