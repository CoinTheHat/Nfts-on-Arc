import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // URL-encode the prompt to use as a seed
        const seed = encodeURIComponent(prompt);

        // Use Pollinations.ai for REAL AI Image Generation (Stable Diffusion)
        const encodedPrompt = encodeURIComponent(prompt + " high quality, digital art, highly detailed, 8k, cyberpunk style, vivid colors");
        const randomSeed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?seed=${randomSeed}&width=512&height=512&nologo=true`;

        // Server-side Fetch & Proxy (Fixes CORS/Broken Image issues)
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) throw new Error("Failed to fetch image from AI provider");

        const arrayBuffer = await imageRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;

        return NextResponse.json({ url: dataUrl });

    } catch (error) {
        console.error("Image Gen Error:", error);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}
