import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState = ({ icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-900/30 border border-gray-800/50 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6 text-3xl">
                {icon || "📂"}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 max-w-sm mb-8">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
