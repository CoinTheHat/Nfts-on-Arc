import { NextResponse } from 'next/server';

// --- Helper: Levenshtein Distance for Fuzzy Matching ---
function levenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1) // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function isSimilar(inputWord: string, targetWord: string, threshold = 2): boolean {
    if (Math.abs(inputWord.length - targetWord.length) > threshold) return false;
    return levenshtein(inputWord.toLowerCase(), targetWord.toLowerCase()) <= threshold;
}

// --- Knowledge Base & Persona ---
const INTENTS = {
    CREATE: {
        id: 'create',
        keywords: ['create', 'mint', 'launch', 'deploy', 'generate', 'publish', 'list', 'start', 'make', 'drop'],
        threshold: 0.3
    },
    EXPLORE: {
        id: 'explore',
        keywords: ['explore', 'find', 'search', 'browse', 'buy', 'market', 'trending', 'hot', 'collections', 'nfts'],
        threshold: 0.3
    },
    PROFILE: {
        id: 'profile',
        keywords: ['profile', 'my', 'account', 'wallet', 'balance', 'settings', 'dashboard', 'inventory'],
        threshold: 0.4
    },
    SITE_INFO: {
        id: 'site_info',
        keywords: ['site', 'website', 'arc', 'platform', 'about', 'what is', 'features', 'fees', 'network', 'chain'],
        threshold: 0.3
    },
    HELP: {
        id: 'help',
        keywords: ['help', 'support', 'guide', 'how to', 'assist', 'confused'],
        threshold: 0.3
    },
    GREETING: {
        id: 'greeting',
        keywords: ['hi', 'hello', 'hey', 'yo', 'greetings', 'sup'],
        threshold: 0.6
    }
};

const RESPONSES = {
    create: [
        "To publish your own NFT, head over to our Studio. It's the 'Create' button in the menu.",
        "You can deploy a contract and mint your NFTs in the Create section. Shall I take you there?",
        "Publishing is easy! Just go to the Create page, fill in the details, and you're live on Arc."
    ],
    explore: [
        "Looking for inspiration? The Explore page has the latest drops.",
        "I can take you to the marketplace to see what's trending.",
        "Let's see what others are building. Heading to Explore."
    ],
    profile: [
        "Your dashboard is where you manage everything. Taking you to your Profile.",
        "You can view your collected NFTs and balance in your Profile.",
        "Opening your personal dashboard now."
    ],
    site_info: [
        "Arc is the premier NFT launchpad on the Arc Testnet. We empower creators with code-free smart contract deployment.",
        "This platform lets you deploy NFT collections, generating unique art with AI, all with zero coding required.",
        "We are running on the Arc Network. Fees are low, and minting is instant."
    ],
    help: [
        "I'm here to help! specific things you can do: 'Create an NFT', 'Explore collections', or 'Check my profile'.",
        "Try asking me: 'How do I mint?', 'Where is my wallet?', or 'Show me trending art'.",
        "If you're stuck, just say 'Create' to start a new project or 'Explore' to browse."
    ],
    greeting: [
        "Hello! I'm Arc Intelligence. Ready to build something cool?",
        "Hi there! How can I help you navigate the Arc ecosystem today?",
        "Greetings! I'm online and ready to assist with your NFT needs."
    ],
    default: [
        "I'm smart, but context is key. Try asking 'How to create?' or 'Go to explore'.",
        "I didn't quite catch that. Do you want to Create or Explore?",
        "My database is vast, but I missed that connection. Are you trying to launch a collection?"
    ]
};

// --- Logic ---

function calculateScore(query: string, keywords: string[]): number {
    const tokens = query.toLowerCase().replace(/[?,.!]/g, '').split(/\s+/);
    let matchScore = 0;

    // 1. Direct & Fuzzy Matching
    tokens.forEach(token => {
        keywords.forEach(kw => {
            if (token === kw) {
                matchScore += 1; // Perfect match
            } else {
                // Fuzzy Match Logic (Prevent short word noise)
                // Only check fuzzy match if BOTH token and keyword are long enough
                if (token.length > 3 && kw.length > 3) {
                    if (isSimilar(token, kw, 1)) {
                        matchScore += 0.8; // Strong typo match
                    } else if (isSimilar(token, kw, 2) && kw.length > 5) {
                        matchScore += 0.5; // Weak typo match
                    }
                }
            }
        });
    });

    // 2. Phrase Matching (bonus)
    keywords.forEach(kw => {
        if (query.toLowerCase().includes(kw)) matchScore += 0.5;
    });

    return Math.min(matchScore, 2);
}

export async function POST(req: Request) {
    try {
        const { query } = await req.json();


        // --- Specific Rule for "How to..." questions ---
        // often imply HELP or the specific verb following "to"

        const lowerQuery = query.toLowerCase();

        // 1. Scripted Overrides for Demo Reliability
        if (lowerQuery.includes("help me find a collection") || lowerQuery.includes("find a collection")) {
            await new Promise(r => setTimeout(r, 600));
            return NextResponse.json({
                text: "I can help with that! Navigating you to the Explore page where you can find the latest collections.",
                action: { type: 'NAVIGATE', payload: '/explore' }
            });
        }

        if (lowerQuery.includes("what is this platform") || lowerQuery.includes("what is arc")) {
            await new Promise(r => setTimeout(r, 600));
            return NextResponse.json({
                text: "Arc NFTs is an AI-powered marketplace on the Arc Testnet. We help you create, discover, and trade NFTs with the help of an intelligent assistant.",
                action: null
            });
        }


        let bestIntent = null;
        let bestScore = 0;

        for (const [key, data] of Object.entries(INTENTS)) {
            const score = calculateScore(query, data.keywords);
            // console.log(`Intent: ${key}, Score: ${score}`); // Debug
            if (score > bestScore) {
                bestScore = score;
                bestIntent = data.id;
            }
        }

        // Logic Tweaks based on threshold
        if (bestScore < 0.4) bestIntent = null; // Stricter fallback

        let responseText = "";
        let action = null;

        if (bestIntent) {
            const possibleResponses = RESPONSES[bestIntent as keyof typeof RESPONSES] || RESPONSES.default;
            responseText = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];

            if (bestIntent === 'create') action = { type: 'NAVIGATE', payload: '/create' };
            if (bestIntent === 'explore') action = { type: 'NAVIGATE', payload: '/explore' };
            if (bestIntent === 'profile') action = { type: 'NAVIGATE', payload: '/profile' };
        } else {
            const defaults = RESPONSES.default;
            responseText = defaults[Math.floor(Math.random() * defaults.length)];
        }

        // Simulate "Thinking"
        await new Promise(r => setTimeout(r, 600));

        return NextResponse.json({
            text: responseText,
            action: action
        });

    } catch (error) {
        console.error("Agent Error:", error);
        return NextResponse.json({ text: "System Error." }, { status: 500 });
    }
}
