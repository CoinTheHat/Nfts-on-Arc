import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Version: 2.1 - Multi-strategy AI generation with robust fallbacks
    console.log("[AI-GEN v2.1] Image generation request received");

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // URL-encode the prompt to use as a seed
        // Strategy 1: Pollinations.ai (New & Old Endpoints)
        // We try multiple constructed URLs to find one that works.
        const encodedPrompt = encodeURIComponent(prompt + " high quality, digital art, highly detailed, 8k, cyberpunk style, vivid colors");
        const randomSeed = Math.floor(Math.random() * 1000000);

        const candidates = [
            `https://pollinations.ai/p/${encodedPrompt}?seed=${randomSeed}&width=512&height=512&nologo=true`,
            `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${randomSeed}&width=512&height=512&nologo=true`
        ];

        let buffer: ArrayBuffer | null = null;

        for (const url of candidates) {
            try {
                console.log("Trying AI URL:", url);
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                if (res.ok) {
                    buffer = await res.arrayBuffer();
                    break;
                }
            } catch (e) {
                console.error("Failed candidate:", url);
            }
        }

        // Strategy 2: DiceBear Fallback (If AI fails completely)
        if (!buffer) {
            console.log("AI Generation failed, falling back to DiceBear");
            const fallbackUrl = `https://api.dicebear.com/9.x/bottts-neutral/png?seed=${encodedPrompt}`;
            const res = await fetch(fallbackUrl);
            if (res.ok) {
                buffer = await res.arrayBuffer();
            } else {
                throw new Error("All image generation strategies failed");
            }
        }

        const base64 = Buffer.from(buffer!).toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;

        return NextResponse.json({ url: dataUrl });

    } catch (error) {
        console.error("Image Gen Error:", error);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}
