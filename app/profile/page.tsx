"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
    const { address, isConnected } = useAccount();
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
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
            }
        } catch (e) {
            console.log("No profile yet");
        } finally {
            setLoading(false);
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
