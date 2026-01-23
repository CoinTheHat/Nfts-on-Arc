import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export const useUsername = (address: string | undefined) => {
    const [username, setUsername] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchUsername = async () => {
        if (!address) {
            setUsername(null);
            setAvatarUrl(null);
            return;
        }
        setLoading(true);
        try {
            const { data } = await supabase
                .from("profiles")
                .select("username, avatar_url")
                .eq("wallet_address", address.toLowerCase())
                .single();

            setUsername(data?.username || null);
            setAvatarUrl(data?.avatar_url || null);
            console.log("[useUsername] Fetched:", { username: data?.username, avatarUrl: data?.avatar_url });
        } catch (e) {
            setUsername(null);
            setAvatarUrl(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsername();
    }, [address]);

    return { username, avatarUrl, loading, refetch: fetchUsername };
};

export const formatAddress = (address: string, username?: string | null) => {
    if (username) return username;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
