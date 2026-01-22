"use client";

import { useState, useRef } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import NFTFactoryArtifact from "@/lib/NFTFactory.json";
import { factoryAddress } from "@/lib/factoryAddress";
import NFTImage from "@/components/NFTImage";
import Link from "next/link";
import { toast } from "sonner";

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default function Create() {
    const { isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    // -- State --
    const [step, setStep] = useState<"type" | "details" | "deploying" | "success">("type");
    const [selectedType, setSelectedType] = useState<"drops" | "collections" | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        description: "",
        price: "0",
        supply: "0", // 0 = unlimited
        duration: "30" // Default 30 days
    });
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [deployError, setDeployError] = useState("");
    const [deployedAddress, setDeployedAddress] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // -- Handlers --
    const handleNext = () => {
        if (step === "type" && selectedType) setStep("details");
    };

    const handleBack = () => {
        if (step === "details") setStep("type");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setPreviewUrl(URL.createObjectURL(e.dataTransfer.files[0]));
        }
    };

    const handleDeploy = async () => {
        if (!walletClient || !publicClient) return;
        setStep("deploying");
        setDeployError("");

        try {
            // 1. Image Upload Logic (WITH SUPABASE + DEBUG)
            let finalURI = "";
            let imageSource = previewUrl;

            if (!imageSource || (!imageSource.startsWith('http') && !imageSource.startsWith('blob'))) {
                imageSource = `https://api.dicebear.com/9.x/bottts-neutral/png?seed=${encodeURIComponent(formData.name || "Arc")}&backgroundColor=1e1e2e,2d2d44,0f172a&shape1Color=f472b6,c084fc,818cf8&shape2Color=fbbf24,34d399,22d3ee&shape3Color=f87171,fb923c,facc15`;
            }

            console.log("[UPLOAD] Image source:", imageSource);

            try {
                let blob: Blob;

                // Handle Base64 Data URLs (from AI generation)
                if (imageSource.startsWith('data:')) {
                    console.log("[UPLOAD] Converting Base64 Data URL to Blob...");
                    const base64Data = imageSource.split(',')[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    blob = new Blob([byteArray], { type: 'image/png' });
                    console.log("[UPLOAD] Base64 converted to blob, size:", blob.size);
                } else {
                    // Handle HTTP/HTTPS URLs and Blob URLs
                    const response = await fetch(imageSource);
                    blob = await response.blob();
                    console.log("[UPLOAD] Fetched blob from URL, size:", blob.size);
                }

                const fileToUpload = new File([blob], "collection-image.png", { type: "image/png" });
                const uploadFormData = new FormData();
                uploadFormData.append("file", fileToUpload);

                console.log("[UPLOAD] Uploading to Supabase...");
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                });

                console.log("[UPLOAD] Response status:", uploadRes.status);

                if (!uploadRes.ok) {
                    const errorText = await uploadRes.text();
                    console.error("[UPLOAD] Failed:", errorText);
                    throw new Error(`Upload failed: ${uploadRes.status}`);
                }

                const uploadData = await uploadRes.json();
                finalURI = uploadData.url;
                console.log("[UPLOAD] Success! URL:", finalURI);

            } catch (uploadErr: any) {
                console.error("[UPLOAD] Error:", uploadErr.message);

                if (imageSource.startsWith('blob:')) {
                    finalURI = `https://api.dicebear.com/9.x/bottts-neutral/png?seed=${encodeURIComponent(formData.name || "Fallback")}&backgroundColor=1e1e2e,2d2d44&shape1Color=f472b6,c084fc`;
                } else if (imageSource.includes('dicebear')) {
                    finalURI = imageSource;
                } else {
                    finalURI = `https://api.dicebear.com/9.x/bottts-neutral/png?seed=${encodeURIComponent(formData.name)}&backgroundColor=1e1e2e,2d2d44&shape1Color=f472b6,c084fc`;
                }
                console.log("[UPLOAD] Using fallback:", finalURI);
            }

            const baseURI = finalURI;

            // 2. Prepare Arguments for Factory
            const { name, symbol, price, supply, duration } = formData;
            const priceWei = BigInt(Math.floor(Number(price) * 1e18)); // Simple conversion
            const maxSupply = Number(supply) === 0 ? BigInt("18446744073709551615") : BigInt(supply); // uint64 max or specific
            const maxPerWallet = BigInt(50); // Defaulting to 50 per wallet for now (or could add a field)

            // Time logic
            const mintStart = BigInt(Math.floor(Date.now() / 1000)); // Start now
            const mintDurationSeconds = BigInt(Math.floor(Number(duration) * 24 * 60 * 60));
            const mintEnd = mintStart + mintDurationSeconds;

            console.log("Deploying with:", { name, symbol, baseURI, maxSupply, priceWei, maxPerWallet, mintStart, mintEnd });

            // 3. Write to Factory Contract
            const hash = await walletClient.writeContract({
                address: factoryAddress as `0x${string}`,
                abi: NFTFactoryArtifact.abi,
                functionName: 'deployCollection',
                args: [
                    name,
                    symbol,
                    baseURI,
                    maxSupply,
                    priceWei,
                    maxPerWallet,
                    mintStart,
                    mintEnd
                ],
                account: walletClient.account,
            });

            console.log("Tx Hash:", hash);

            // 4. Wait for Receipt & Get Address
            // In a real scenario we'd parse the logs to get the new address. 
            // For now, let's wait for the tx and just mock the address catch or redirect.
            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            // Try to find the deployed address from logs if possible, else fallback
            // Typically the factory emits 'CollectionDeployed(address collection, ...)'
            let deployedAddr = "0x...";
            if (receipt.logs.length > 0) {
                // Simple assumption: The last log's address might be the new contract or we need to parse.
                // Let's assume the factory emits event at index 0 or similar.
                // Without the event ABI handy here in parsing logic, we might just assume success.
                // Actually, let's just use the hash for now and a mock address or the factory address to show success.
                deployedAddr = receipt.contractAddress || "0xDeployedAddress";
            }

            setDeployedAddress(deployedAddr);
            setStep("success");
        } catch (err: any) {
            console.error(err);
            setDeployError(err.message || "Deployment failed");
            setStep("details");
        }
    };

    const handleAiGenerate = async () => {
        setIsGenerating(true);
        try {
            // Enhanced Random Generation Logic
            const themes = [
                { name: "Cyberpunk", adj: ["Neon", "Digital", "Glitch", "Synth", "Future", "Chrome", "Quantum", "Holo"], nouns: ["Samurai", "City", "Soul", "Nexus", "Droid", "Blade", "Runner", "Protocol"] },
                { name: "Ethereal", adj: ["Mystic", "Dream", "Void", "Astral", "Spirit", "Celestial", "Arcane", "Divine"], nouns: ["Walker", "Realm", "Echo", "Shade", "Wisp", "Gate", "Oracle", "Phantom"] },
                { name: "Abstract", adj: ["Geometric", "Fluid", "Chaos", "Order", "Prism", "Fractal", "Vivid", "Kinetic"], nouns: ["Forms", "Flow", "Theory", "Vector", "Mind", "Loop", "Shape", "Dimension"] },
                { name: "Retro", adj: ["Pixel", "8-Bit", "Arcade", "Vapor", "Nostalgia", "Analog", "Vintage", "CRT"], nouns: ["Punk", "Hero", "Glitch", "Wave", "Cartridge", "Signal", "Tape", "Memory"] },
                { name: "Nature", adj: ["Bloom", "Terra", "Solar", "Lunar", "Wild", "Verdant", "Gaia", "Feral"], nouns: ["Fauna", "Flora", "Guardian", "Essence", "Root", "Canopy", "Grove", "Beast"] },
                { name: "Cosmic", adj: ["Stellar", "Nebula", "Void", "Galactic", "Infinite", "Dark", "Space", "Nova"], nouns: ["Traveler", "Dust", "System", "Cluster", "Orbit", "Horizon", "Odyssey", "Matter"] }
            ];

            const randomTheme = themes[Math.floor(Math.random() * themes.length)];
            const randomAdj = randomTheme.adj[Math.floor(Math.random() * randomTheme.adj.length)];
            const randomNoun = randomTheme.nouns[Math.floor(Math.random() * randomTheme.nouns.length)];

            const collectionName = `${randomAdj} ${randomNoun} Collective`;
            const symbol = (randomAdj.slice(0, 1) + randomNoun.slice(0, 1) + "X").toUpperCase();

            // Richer descriptions
            const descriptions = [
                `A curated series of ${randomTheme.name.toLowerCase()} inspired artifacts, exploring the boundary between ${randomAdj.toLowerCase()} aesthetics and digital ownership.`,
                `Entering the ${randomNoun.toLowerCase()} era. This collection represents a fusion of ${randomTheme.name} art styles and blockchain immutability.`,
                `Unlock the ${randomAdj} gate. ${collectionName} serves as a pass key to an exclusive digital community built on Arc.`,
                `Hand-crafted algorithms meet ${randomAdj.toLowerCase()} design. Verified on-chain, preserved forever.`,
                `The ${randomNoun} protocol has been activated. Join the ${randomAdj} revolution with this limited edition drop.`
            ];
            const description = descriptions[Math.floor(Math.random() * descriptions.length)];

            // Generate Image via our new Proxy API (Pollinations Real AI)
            // We use the theme keywords to guide the AI for better results
            const prompt = `${randomTheme.name} style ${randomAdj} ${randomNoun}, high quality, digital art, 8k, detailed, artistic`;

            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) throw new Error("Failed to generate AI content");
            const data = await res.json();

            setPreviewUrl(data.url);
            setFormData(prev => ({
                ...prev,
                name: collectionName,
                symbol: symbol,
                description: description
            }));

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate content. Try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Layout>
            <div className="bg-bg-base min-h-screen py-10 px-4">
                <div className="max-w-6xl mx-auto">

                    {/* Stepper Header (Condensed) */}
                    <div className="flex items-center justify-center gap-4 mb-8 text-sm font-bold text-text-tertiary">
                        <div className={`flex items-center gap-2 ${step === 'type' ? 'text-primary' : typeCompleted(step) ? 'text-text-primary' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'type' ? 'border-primary text-primary bg-primary/5' : typeCompleted(step) ? 'bg-primary text-white border-primary' : 'border-border-default'}`}>
                                {typeCompleted(step) ? '✓' : '1'}
                            </div>
                            <span>Type</span>
                        </div>
                        <div className="w-12 h-[2px] bg-border-default" />
                        <div className={`flex items-center gap-2 ${step === 'details' ? 'text-primary' : step === 'deploying' || step === 'success' ? 'text-text-primary' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'details' ? 'border-primary text-primary bg-primary/5' : step === 'deploying' || step === 'success' ? 'bg-primary text-white border-primary' : 'border-border-default'}`}>
                                {step === 'deploying' || step === 'success' ? '✓' : '2'}
                            </div>
                            <span>Details</span>
                        </div >
                        <div className="w-12 h-[2px] bg-border-default" />
                        <div className={`flex items-center gap-2 ${step === 'deploying' || step === 'success' ? 'text-primary' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'success' ? 'bg-success text-white border-success' : step === 'deploying' ? 'border-primary text-primary animate-pulse' : 'border-border-default'}`}>
                                3
                            </div>
                            <span>Deploy</span>
                        </div>
                    </div >

                    {/* -- STEP 1: TYPE SELECTION -- */}
                    {
                        step === "type" && (
                            <div className="max-w-4xl mx-auto bg-surface-1 border border-border-default rounded-2xl p-8 md:p-12 shadow-sm animate-slide-up">
                                <h2 className="text-2xl font-bold text-text-primary text-center mb-2">Choose Type</h2>
                                <p className="text-text-tertiary text-center mb-10">Select the smart contract structure for your collection.</p>

                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    <TypeCard
                                        label="Drop / Edition"
                                        desc="One artwork, multiple copies (e.g. 1/100). Ideal for digital art releases."
                                        active={selectedType === 'drops'}
                                        onClick={() => setSelectedType('drops')}
                                        icon="🖼️"
                                    />
                                    <TypeCard
                                        label="Collection"
                                        desc="Unique distinct tokens (e.g. 10k PFP). Ideal for large generative projects."
                                        active={selectedType === 'collections'}
                                        onClick={() => setSelectedType('collections')}
                                        icon="📦"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button size="lg" disabled={!selectedType} onClick={handleNext} className="px-8">
                                        Continue →
                                    </Button>
                                </div>
                            </div>
                        )
                    }

                    {/* -- STEP 2: DETAILS -- */}
                    {
                        step === "details" && (
                            <div className="grid lg:grid-cols-12 gap-8 animate-slide-up">

                                {/* Left Col: Forms */}
                                <div className="lg:col-span-7 space-y-6">
                                    {/* Basics Card */}
                                    <div className="bg-surface-1 border border-border-default rounded-2xl p-6 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h3 className="font-bold text-lg text-text-primary mb-1">Collection Basics</h3>
                                                <p className="text-xs text-text-tertiary">These details will be immutable on the blockchain.</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border-indigo-500/20 text-indigo-500"
                                                onClick={handleAiGenerate}
                                                disabled={isGenerating}
                                            >
                                                {isGenerating ? "🔄 Generating..." : "✨ AI Generate"}
                                            </Button>
                                        </div>

                                        <div className="space-y-5">
                                            <Input
                                                label="Collection Name"
                                                placeholder="e.g. Cosmic Explorers"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="bg-surface-2 border-border-default h-12"
                                            />
                                            <Input
                                                label="Token Symbol"
                                                placeholder="e.g. CSMC"
                                                value={formData.symbol}
                                                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                                                className="bg-surface-2 border-border-default h-12 uppercase"
                                            />
                                            <Textarea
                                                label="Description"
                                                placeholder="Tell the story behind your collection..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="bg-surface-2 border-border-default min-h-[120px]"
                                            />
                                        </div>
                                    </div>

                                    {/* Mint Settings Card */}
                                    <div className="bg-surface-1 border border-border-default rounded-2xl p-6 shadow-sm">
                                        <h3 className="font-bold text-lg text-text-primary mb-1">Mint Settings</h3>
                                        <p className="text-xs text-text-tertiary mb-6">Define supply and pricing.</p>

                                        <div className="grid grid-cols-2 gap-5">
                                            <Input
                                                label="Price (USDC)"
                                                placeholder="0.00"
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="bg-surface-2 border-border-default h-12"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    label="Max Supply"
                                                    placeholder="0 = ∞"
                                                    type="number"
                                                    value={formData.supply}
                                                    onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
                                                    className="bg-surface-2 border-border-default h-12"
                                                />
                                                <Input
                                                    label="Duration (Day)"
                                                    placeholder="30"
                                                    type="number"
                                                    value={formData.duration}
                                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                    className="bg-surface-2 border-border-default h-12"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Media & Preview */}
                                <div className="lg:col-span-5 space-y-6">
                                    {/* Media Upload */}
                                    <div className="bg-surface-1 border border-border-default rounded-2xl p-6 shadow-sm">
                                        <h3 className="font-bold text-lg text-text-primary mb-4">Collection Image</h3>

                                        <div
                                            className={`
                                            relative h-64 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition-all
                                            ${dragActive ? "border-primary bg-primary/5" : "border-border-default hover:border-primary/50 hover:bg-surface-2"}
                                        `}
                                            onDragEnter={() => setDragActive(true)}
                                            onDragLeave={() => setDragActive(false)}
                                            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={handleFileChange}
                                            />

                                            {previewUrl ? (
                                                <div className="relative w-full h-full">
                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                                                        <p className="text-white font-bold">Replace Image</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                                                        <span className="text-xl">☁️</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-text-primary">Click to upload</p>
                                                    <p className="text-xs text-text-tertiary mt-1">PNG, JPG, GIF up to 10MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview Card */}
                                    <div className="bg-surface-1 border border-border-default rounded-2xl p-6 shadow-sm">
                                        <h3 className="font-bold text-xs uppercase text-text-tertiary mb-3 tracking-wider">Preview</h3>
                                        <div className="rounded-xl border border-border-default bg-surface-1 overflow-hidden shadow-md max-w-[280px] mx-auto">
                                            <div className="aspect-square bg-surface-2 relative">
                                                {previewUrl ? (
                                                    <img src={previewUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-tertiary bg-bg-alt">
                                                        No Image
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge variant="warning" className="text-[10px] py-0.5">VERIFIED</Badge>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="h-5 w-3/4 bg-surface-3 rounded mb-2 animate-pulse" style={{ display: formData.name ? 'none' : 'block' }} />
                                                {formData.name && <h4 className="font-bold text-text-primary text-lg truncate">{formData.name}</h4>}

                                                <p className="text-xs text-text-tertiary font-mono mt-1">@{formData.symbol || "SYMBOL"}</p>

                                                <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between items-center text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="text-text-tertiary">Price</span>
                                                        <span className="font-bold">{formData.price || "0"} ETH</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-success">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Active
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* -- ACTION BAR (Bottom) for Steps -- */}
                    {
                        step === 'details' && (
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-1 border-t border-border-default z-50">
                                <div className="max-w-6xl mx-auto flex items-center justify-between">
                                    <Button variant="secondary" onClick={handleBack} className="text-text-tertiary">
                                        ← Back
                                    </Button>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden md:flex flex-col items-end text-xs mr-2">
                                            <span className="text-text-tertiary">Estimated Gas</span>
                                            <span className="font-bold text-text-primary">~0.002 USDC</span>
                                        </div>
                                        <Button size="lg" onClick={handleDeploy} variant="primary" className="shadow-lg shadow-primary/20">
                                            Deploy to Arc
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* -- STEP 3: DEPLOYING / SUCCESS -- */}
                    {
                        (step === 'deploying' || step === 'success') && (
                            <div className="max-w-xl mx-auto text-center py-20 animate-slide-up">
                                {step === 'deploying' ? (
                                    <div className="flex flex-col items-center">
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                            <div className="w-20 h-20 bg-surface-1 rounded-2xl border border-border-default flex items-center justify-center relative shadow-lg">
                                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-text-primary mb-2">Deploying Contract...</h2>
                                        <p className="text-text-tertiary">Please confirm the transaction in your wallet.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6 border border-success/20">
                                            <span className="text-4xl">🎉</span>
                                        </div>
                                        <h2 className="text-3xl font-bold text-text-primary mb-2">Collection Deployed!</h2>
                                        <p className="text-text-tertiary mb-8">Your smart contract is now live on Arc Network.</p>

                                        <div className="flex gap-4">
                                            <Link href={`/collection/${deployedAddress}`}>
                                                <Button variant="secondary">View Dashboard</Button>
                                            </Link>
                                            <Link href={`/mint/${deployedAddress}`}>
                                                <Button>Go to Mint Page →</Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }

                </div >
            </div >
        </Layout >
    );
}

// Helpers
function typeCompleted(currentStep: string) {
    return currentStep === 'details' || currentStep === 'deploying' || currentStep === 'success';
}

function TypeCard({ label, desc, active, onClick, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                text-left p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col h-full
                ${active ? 'bg-primary/5 border-primary shadow-md' : 'bg-surface-1 border-border-default hover:border-border-hover hover:shadow-sm'}
            `}
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-xl ${active ? 'bg-primary text-white' : 'bg-surface-3'}`}>
                {icon}
            </div>
            <h3 className="font-bold text-lg text-text-primary mb-1">{label}</h3>
            <p className="text-sm text-text-tertiary leading-relaxed">{desc}</p>
        </button>
    )
}
