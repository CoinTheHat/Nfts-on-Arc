"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/components/Layout";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";

export default function UserProfile() {
    const params = useParams();
    const address = params.address as string;
    const { address: myAddress } = useAccount();

    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("collected");

    useEffect(() => {
        if (address) {
            loadProfile();
        }
    }, [address]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("wallet_address", address)
                .single();

            if (data) {
                setUsername(data.username || "");
                setBio(data.bio || "");
                setAvatarUrl(data.avatar_url || "");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const isMe = address?.toLowerCase() === myAddress?.toLowerCase();

    const tabs = [
        { id: "collected", label: "Collected", count: 0 },
        { id: "created", label: "Created", count: 0 },
    ];

    return (
        <Layout>
            {/* Header */}
            <div className="relative mb-8">
                <div className="h-48 md:h-64 rounded-3xl bg-gradient-to-r from-gray-900 via-gray-800 to-black overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                </div>
                <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                    <div className="w-32 h-32 rounded-2xl border-4 border-background bg-gray-800 overflow-hidden relative shadow-xl">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-4xl">
                                👤
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold text-white">{username || "Unnamed User"}</h1>
                        <p className="text-gray-400 font-mono text-sm bg-black/30 backdrop-blur px-3 py-1 rounded-full inline-block mt-2">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                    </div>
                </div>
                <div className="absolute -bottom-12 right-8">
                    {isMe && (
                        <Button href="/profile" variant="secondary" size="sm">
                            Edit Profile
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-24 max-w-2xl">
                {bio && (
                    <p className="text-gray-300 text-lg leading-relaxed mb-8">{bio}</p>
                )}
            </div>

            <div className="mt-8">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === "collected" && (
                    <div className="text-center py-20 text-gray-400 border border-dashed border-gray-800 rounded-2xl">
                        <p className="text-xl">No collected NFTs visible</p>
                    </div>
                )}
                {activeTab === "created" && (
                    <div className="text-center py-20 text-gray-400 border border-dashed border-gray-800 rounded-2xl">
                        <p className="text-xl">No created collections visible</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
