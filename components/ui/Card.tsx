import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ children, className = "", hover = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`
          bg-card border border-border rounded-2xl overflow-hidden
          ${hover ? "hover-glow hover:border-border-hover cursor-pointer" : ""}
          ${className}
        `}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
