"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

interface Message {
    role: "user" | "agent";
    text: string;
}

export default function CopilotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "agent", text: "Hello! I'm your Arc Copilot. How can I help you navigate or create today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: "user", text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input }),
            });
            const data = await res.json();

            // Agent Reply
            setMessages(prev => [...prev, { role: "agent", text: data.text }]);

            // Handle Action
            if (data.action) {
                if (data.action.type === "NAVIGATE") {
                    setTimeout(() => {
                        router.push(data.action.payload);
                    }, 1000);
                }
            }

        } catch (err) {
            setMessages(prev => [...prev, { role: "agent", text: "Sorry, I encountered a glitch. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            {/* Chat Window */}
            <div className={`
                mb-4 w-80 md:w-96 bg-surface-1 border border-border-default rounded-2xl shadow-2xl overflow-hidden transition-all origin-bottom-right pointer-events-auto
                ${isOpen ? "scale-100 opacity-100" : "scale-75 opacity-0 h-0 pointer-events-none"}
            `}>
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-surface-1 p-4 border-b border-border-default flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <div>
                            <h3 className="font-bold text-text-primary text-sm">Arc Copilot</h3>
                            <p className="text-[10px] text-text-tertiary">Agentic Commerce Engine</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-text-tertiary hover:text-text-primary">✕</button>
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-bg-base/50">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[80%] p-3 rounded-2xl text-sm 
                                ${m.role === 'user'
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-surface-2 text-text-primary border border-border-default rounded-bl-none'
                                }
                            `}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-surface-2 p-3 rounded-2xl rounded-bl-none border border-border-default flex gap-1">
                                <span className="w-1.5 h-1.5 bg-text-tertiary/50 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-text-tertiary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-text-tertiary/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-surface-1 border-t border-border-default flex gap-2">
                    <input
                        className="flex-1 bg-surface-2 border border-border-default rounded-xl px-3 text-sm focus:outline-none focus:border-primary text-text-primary"
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button size="sm" onClick={handleSend} disabled={!input.trim() || loading} className="w-10 px-0 flex items-center justify-center rounded-xl">
                        ↑
                    </Button>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-primary hover:bg-primary-hover text-white rounded-full shadow-xl flex items-center justify-center text-2xl transition-transform hover:scale-105 active:scale-95 pointer-events-auto"
            >
                {isOpen ? "✕" : "🤖"}
            </button>
        </div>
    );
}
