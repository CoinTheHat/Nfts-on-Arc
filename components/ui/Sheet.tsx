"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    trigger?: React.ReactNode;
}

export function Sheet({ isOpen, onClose, children, title }: SheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Portal to body to avoid z-index issues
    if (typeof window === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Sheet Content */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-surface-1 rounded-t-2xl z-[70] max-h-[90vh] overflow-y-auto border-t border-border-default shadow-[0_-8px_30px_rgba(0,0,0,0.2)]"
                    >
                        {/* Drag Handle (Visual only) */}
                        <div className="w-full h-6 flex items-center justify-center pt-2 pb-4" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-border-strong rounded-full opacity-50" />
                        </div>

                        {/* Header */}
                        <div className="px-6 pb-4 flex justify-between items-center border-b border-border-default">
                            {title && <h3 className="text-xl font-bold text-text-primary">{title}</h3>}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 text-text-tertiary hover:bg-surface-3 hover:text-text-primary transition-colors text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 safe-area-bottom">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

// Helper trigger component if needed, though usually controlled externally
export function SheetTrigger({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return <div onClick={onClick} className="cursor-pointer">{children}</div>;
}
