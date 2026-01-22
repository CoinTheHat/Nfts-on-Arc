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
        // No API Key required, free for usage.
        const encodedPrompt = encodeURIComponent(prompt + " high quality, digital art, highly detailed, 8k, cyberpunk style, vivid colors");
        // Random seed to ensure uniqueness even for same prompt
        const randomSeed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?seed=${randomSeed}&width=512&height=512&nologo=true`;

        // Simulate a slight delay to feel like "AI Processing"
        // Pollinations is fast but give it a sec to seem "impressed"
        await new Promise(r => setTimeout(r, 1000));

        return NextResponse.json({ url: imageUrl });

    } catch (error) {
        console.error("Image Gen Error:", error);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}
