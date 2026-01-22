import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // URL-encode the prompt to use as a seed
        const seed = encodeURIComponent(prompt);

        // Use DiceBear "Shapes" for abstract generative art. 
        // It's free, reliable, and looks perfectly like a "Generative Art" NFT collection.
        // We add some specific colors to make it look "Cyberpunk" or "Premium".
        // b6e3f4,c0aede,d1d4f9 = pastel cyber colors
        const imageUrl = `https://api.dicebear.com/9.x/bottts-neutral/png?seed=${seed}&backgroundColor=1e1e2e,2d2d44,0f172a&shape1Color=f472b6,c084fc,818cf8&shape2Color=fbbf24,34d399,22d3ee&shape3Color=f87171,fb923c,facc15`;

        // Simulate a slight delay to feel like "AI Processing"
        await new Promise(r => setTimeout(r, 600));

        return NextResponse.json({ url: imageUrl });

    } catch (error) {
        console.error("Image Gen Error:", error);
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }
}
