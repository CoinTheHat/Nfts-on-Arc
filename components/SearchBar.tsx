"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);

        // Check if it's an address (starts with 0x)
        if (query.startsWith("0x")) {
            router.push(`/user/${query}`);
            setSearching(false);
            return;
        }

        // Search by username
        try {
            const { data } = await supabase
                .from("profiles")
                .select("wallet_address")
                .eq("username", query.trim())
                .single();

            if (data) {
                router.push(`/user/${data.wallet_address}`);
            } else {
                alert("User not found");
            }
        } catch (e) {
            alert("User not found");
        } finally {
            setSearching(false);
            setQuery("");
        }
    };

    return (
        <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search user..."
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <button
                type="submit"
                disabled={searching}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
                {searching ? "..." : "🔍"}
            </button>
        </form>
    );
}
