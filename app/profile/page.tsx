"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
    const { address, isConnected } = useAccount();
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [twitterHandle, setTwitterHandle] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (isConnected && address) {
            loadProfile();
        }
    }, [isConnected, address]);

    const loadProfile = async () => {
        if (!address) return;
        setLoading(true);
        try {
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("wallet_address", address.toLowerCase())
                .single();

            if (data) {
                setUsername(data.username || "");
                setBio(data.bio || "");
                setTwitterHandle(data.twitter_handle || "");
                setAvatarUrl(data.avatar_url || "");
            }
        } catch (e) {
            console.log("No profile yet");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.url) {
                setAvatarUrl(data.url);
                setMessage("✅ Avatar uploaded!");
            }
        } catch (e) {
            setMessage("❌ Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!address || !username.trim()) {
            setMessage("❌ Username required");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            const { error } = await supabase
                .from("profiles")
                .upsert({
                    wallet_address: address.toLowerCase(),
                    username: username.trim(),
                    bio: bio.trim(),
                    twitter_handle: twitterHandle.trim().replace("@", ""), // Remove @ if user added it
                    avatar_url: avatarUrl,
                }, { onConflict: "wallet_address" });

            if (error) throw error;
            setMessage("✅ Saved!");
        } catch (error: any) {
            setMessage(error.code === "23505" ? "❌ Username taken" : `❌ ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (!isConnected) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
                    <p className="text-gray-400">Connect to edit profile</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Edit Profile</h1>

                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                        {/* Avatar Upload */}
                        <div className="mb-8 flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 mb-4">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        👤
                                    </div>
                                )}
                            </div>
                            <label className="cursor-pointer">
                                <span className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                                    {uploading ? "Uploading..." : "Change Avatar"}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2">Username *</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="cryptoartist"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                maxLength={20}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="About you..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                                maxLength={200}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2">Twitter Handle (Optional)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-gray-500">@</span>
                                <input
                                    type="text"
                                    value={twitterHandle}
                                    onChange={(e) => setTwitterHandle(e.target.value)}
                                    placeholder="username"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                    maxLength={30}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`w-full py-4 rounded-xl font-bold ${saving ? "bg-blue-600/50" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02]"} text-white transition-all`}
                        >
                            {saving ? "Saving..." : "Save Profile"}
                        </button>

                        {message && (
                            <div className={`mt-4 p-4 rounded-lg text-center ${message.startsWith("✅") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                                {message}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
