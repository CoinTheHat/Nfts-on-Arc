import Link from "next/link";
import WalletConnectButton from "./WalletConnectButton";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-950 text-white font-sans">
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Arc NFT Launchpad
                        </Link>
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">

                            <Link href="/create" className="hover:text-white transition-colors">
                                Create Collection
                            </Link>
                            <Link href="/dashboard" className="hover:text-white transition-colors">
                                Dashboard
                            </Link>
                        </nav>
                    </div>
                    <WalletConnectButton />
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>

            <footer className="border-t border-gray-800 py-8 mt-auto bg-gray-900">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    <p className="mb-2">Built on <span className="text-white font-medium">Arc Testnet</span></p>
                    <a
                        href="https://docs.arc.network"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-400 transition-colors"
                    >
                        Read the Docs
                    </a>
                </div>
            </footer>
        </div>
    );
}
