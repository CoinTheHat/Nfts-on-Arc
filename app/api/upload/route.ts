import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
    try {
        console.log("Upload request started");
        console.log("Supabase URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log("Supabase Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error("No file found in formData");
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();

        // Sanitize filename: replace Turkish chars and special chars
        let safeName = file.name
            .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
            .replace(/ü/g, 'u').replace(/Ü/g, 'U')
            .replace(/ş/g, 's').replace(/Ş/g, 'S')
            .replace(/ı/g, 'i').replace(/İ/g, 'I')
            .replace(/ö/g, 'o').replace(/Ö/g, 'O')
            .replace(/ç/g, 'c').replace(/Ç/g, 'C')
            .replace(/[^a-zA-Z0-9._-]/g, '_'); // Replace any other special char with underscore

        const filename = `${Date.now()}_${safeName}`;

        console.log("Uploading file:", filename);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from("uploads")
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error("Supabase upload error details:", JSON.stringify(error, null, 2));
            throw error;
        }

        console.log("Upload successful:", data);

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from("uploads")
            .getPublicUrl(filename);

        return NextResponse.json({ url: publicUrl });
    } catch (e: any) {
        console.error("Catch block error:", e);
        return NextResponse.json({ error: e.message || "Unknown server error", details: JSON.stringify(e) }, { status: 500 });
    }
}
