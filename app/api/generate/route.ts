import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Version: 3.0 - DiceBear Primary with Diverse Styles (No Rate Limits!)
    console.log("[AI-GEN v3.0] Image generation request received");

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const encodedPrompt = encodeURIComponent(prompt);
        const randomSeed = Math.floor(Math.random() * 1000000);

        // STRATEGY 1: DiceBear (Primary) - Fast, reliable, no rate limits
        // Multiple styles for variety
        const dicebearStyles = [
            'lorelei',        // Artistic, colorful characters
            'notionists',     // Modern, geometric avatars
            'shapes',         // Abstract, vibrant patterns
            'rings',          // Unique ring patterns
            'identicon',      // Geometric, crypto-style
            'bottts-neutral'  // Robot avatars
        ];

        const randomStyle = dicebearStyles[Math.floor(Math.random() * dicebearStyles.length)];
        const dicebearUrl = `https://api.dicebear.com/9.x/${randomStyle}/png?seed=${encodedPrompt}-${randomSeed}`;

        console.log("Using DiceBear style:", randomStyle);

        let buffer: ArrayBuffer | null = null;

        // Try DiceBear first (always fast and reliable)
        try {
            const res = await fetch(dicebearUrl);
            if (res.ok) {
                buffer = await res.arrayBuffer();
                console.log("✓ DiceBear generated successfully");
            }
        } catch (e) {
            console.error("DiceBear failed (rare):", e);
        }

        // STRATEGY 2: Pollinations.ai (Optional, if DiceBear somehow fails)
        // Very short timeout since it's just a backup
        if (!buffer) {
            console.log("DiceBear failed, trying Pollinations.ai as backup...");
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " digital art")}?seed=${randomSeed}&width=512&height=512&nologo=true`;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const res = await fetch(pollinationsUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (res.ok) {
                    buffer = await res.arrayBuffer();
                    console.log("✓ Pollinations backup worked");
                }
            } catch (e) {
                console.error("Pollinations backup failed:", e);
            }
        }

        // Final fallback: Simple DiceBear bottts if everything failed
        if (!buffer) {
            console.log("Using final DiceBear fallback");
            const finalFallback = `https://api.dicebear.com/9.x/bottts-neutral/png?seed=${randomSeed}`;
            const res = await fetch(finalFallback);
            if (!res.ok) {
                throw new Error("All image generation strategies failed");
            }
            buffer = await res.arrayBuffer();
        }

        const base64 = Buffer.from(buffer!).toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;

        return NextResponse.json({ url: dataUrl });

    } catch (error) {
        console.error("Image Gen Error:", error);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}
