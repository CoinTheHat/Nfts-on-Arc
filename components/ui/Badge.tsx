import React from "react";

export type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "error" | "default" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export const Badge = ({ children, className = "", variant = "default", ...props }: BadgeProps) => {
    const variants = {
        default: "bg-gray-800 text-gray-300 border-gray-700",
        primary: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        secondary: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        success: "bg-green-500/10 text-green-400 border-green-500/20",
        warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        error: "bg-red-500/10 text-red-400 border-red-500/20",
        outline: "bg-transparent border-gray-700 text-gray-400",
    };

    return (
        <span
            className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variants[variant]}
        ${className}
      `}
            {...props}
        >
            {children}
        </span>
    );
};
