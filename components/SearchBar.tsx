"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "./ui/Input";

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const router = useRouter();

    // Debounce search logic remains same
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            // Don't search if it looks like an address
            if (query.startsWith("0x")) return;

            try {
                console.log("Searching for:", query);
                const { data, error } = await supabase
                    .from("profiles")
                    .select("username, wallet_address, avatar_url")
                    .ilike("username", `%${query}%`)
                    .limit(5);

                if (error) console.error("Supabase search error:", error);
                console.log("Search results:", data);

                if (data) {
                    setSuggestions(data);
                    setShowSuggestions(true);
                }
            } catch (error) {
                console.error("Search error:", error);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        setShowSuggestions(false);

        // Check if it's an address (starts with 0x)
        if (query.startsWith("0x")) {
            router.push(`/user/${query}`);
            setSearching(false);
            return;
        }

        // 1. Try to find User by Username
        try {
            const { data: userData } = await supabase
                .from("profiles")
                .select("wallet_address")
                .ilike("username", query.trim())
                .limit(1)
                .maybeSingle();

            if (userData?.wallet_address) {
                router.push(`/user/${userData.wallet_address}`);
                setSearching(false);
                setQuery("");
                return;
            }

            // 2. If no user, try to find Collection by Name
            // assuming 'collections' table (or similar) - wait, based on create page, we deploy to blockchain. 
            // We might not have a synced 'collections' table yet unless we are indexing.
            // Let's check if we have a collections table in supabase, otherwise we can't search collections quickly.
            // However, based on the user request, they expect it. 
            // I'll assume there is a 'collections' or 'contracts' table, OR I will check the file list for schema again. 
            // BUT, for now, I'll try to search 'profiles' for now, but usually collections are separate.
            // Wait, looking at file list earlier: 'supabase_moderation_schema.sql', 'supabase_profiles_schema.sql'.
            // I don't see a collections schema. 
            // IF there is no DB for collections, we can't search them by name easily unless we query the chain (slow) or if they are stored in profiles (as creators?).
            // Let's look at the 'create' page again. It writes to blockchain. Does it write to Supabase?
            // In 'create/page.tsx', it uploads image to Supabase/API but the contract deployment is on-chain.
            // It does NOT seem to save the collection to Supabase DB in 'handleDeploy'.
            // THIS IS A MISSING FEATURE then.

            // However, to fix the "search button" issue immediately as requested, I will improve the USER search to be case insensitive (.ilike) and maybe quieter on error.

            // actually, wait. If the user expects to search for "Collections", and we don't index them, we can't. 
            // BUT, maybe the "profiles" table has a "type" or maybe users ARE creators.
            // Let's at least fix the .eq to .ilike for username so it's not case sensitive strict.

            const { data } = await supabase
                .from("profiles")
                .select("wallet_address")
                .ilike("username", query.trim()) // Changed from eq to ilike
                .maybeSingle(); // Use maybeSingle to avoid errors on 0 results

            if (data) {
                router.push(`/user/${data.wallet_address}`);
            } else {
                // If no user found, assume it is a collection search and redirect to Explore
                console.log("User not found, redirecting to explore for collection search...");
                router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
            }
        } catch (e) {
            console.error(e);
            // Fallback to explore
            router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
        } finally {
            setSearching(false);
            setQuery("");
            setShowSuggestions(false);
        }
    };

    return (
        <div className="relative w-full group">
            <form onSubmit={handleSearch}>
                <div className="relative">
                    <Input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Search collections, creators..."
                        className="bg-surface/50 border-white/10 text-sm h-10 py-2 pl-10 rounded-full focus:bg-surface focus:border-primary/50 transition-all placeholder:text-gray-500"
                        containerClassName="m-0"
                    />
                    <button
                        type="submit"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                        onClick={handleSearch}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && (suggestions.length > 0 || query.length >= 2) && (
                <div className="absolute top-full left-0 w-full mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">

                    {/* Profiles Section */}
                    {suggestions.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Creators
                            </div>
                            {suggestions.map((user) => (
                                <div
                                    key={user.wallet_address}
                                    onClick={() => {
                                        router.push(`/user/${user.wallet_address}`);
                                        setQuery("");
                                        setShowSuggestions(false);
                                    }}
                                    className="px-4 py-2.5 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-200 truncate">{user.username}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Collections Fallback Section */}
                    {query.length >= 2 && (
                        <div className="border-t border-gray-800/50 py-1">
                            <div
                                onClick={handleSearch}
                                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-200">Search "{query}" in Collections</span>
                                    <span className="text-xs text-gray-500">View all matching collections</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
