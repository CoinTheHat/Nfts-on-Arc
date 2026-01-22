import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        const lowerQuery = query.toLowerCase();

        let responseText = "I'm not sure specifically, but I can help you create or explore NFTs.";
        let action = null;

        // --- Simple Rule-Based NLP (MVP) ---

        // 1. Creation Intents
        if (lowerQuery.includes("create") || lowerQuery.includes("mint") || lowerQuery.includes("launch")) {
            responseText = "I can take you to the Studio to launch your collection right away!";
            action = { type: 'NAVIGATE', payload: '/create' };
        }
        // 2. Exploration Intents
        else if (lowerQuery.includes("explore") || lowerQuery.includes("find") || lowerQuery.includes("buy") || lowerQuery.includes("market")) {
            responseText = "Let's explore the marketplace. Redirecting you there now.";
            action = { type: 'NAVIGATE', payload: '/explore' };
        }
        // 3. Admin/Profile Intents
        else if (lowerQuery.includes("profile") || lowerQuery.includes("account") || lowerQuery.includes("wallet")) {
            responseText = "Opening your profile dashboard.";
            action = { type: 'NAVIGATE', payload: '/profile' };
        }
        // 4. Help/Info
        else if (lowerQuery.includes("help") || lowerQuery.includes("agent") || lowerQuery.includes("what is arc")) {
            responseText = "Arc is a premier NFT marketplace. I am an autonomous agent here to help you navigate, analyze data, and perform actions.";
        }
        // 5. Analysis (Mock)
        else if (lowerQuery.includes("trend") || lowerQuery.includes("stats") || lowerQuery.includes("price")) {
            responseText = "The market is currently up 12% in volume. Navigate to the dashboard for deeper insights.";
            action = { type: 'NAVIGATE', payload: '/' }; // Home has stats
        }

        // Simulate "Thinking" delay
        await new Promise(r => setTimeout(r, 800));

        return NextResponse.json({
            text: responseText,
            action: action
        });

    } catch (error) {
        return NextResponse.json({ text: "I encountered a processing error." }, { status: 500 });
    }
}
