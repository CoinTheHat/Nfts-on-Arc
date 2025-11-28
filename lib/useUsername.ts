import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export const useUsername = (address: string | undefined) => {
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) {
            setUsername(null);
            return;
        }

        const fetchUsername = async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("wallet_address", address.toLowerCase())
                    .single();

                setUsername(data?.username || null);
            } catch (e) {
                setUsername(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUsername();
    }, [address]);

    return { username, loading };
};

export const formatAddress = (address: string, username?: string | null) => {
    if (username) return username;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
