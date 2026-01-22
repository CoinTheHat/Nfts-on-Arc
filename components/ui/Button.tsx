import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
    href?: string;
    external?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        children,
        className = "",
        variant = "primary",
        size = "md",
        isLoading = false,
        disabled,
        href,
        external,
        leftIcon,
        rightIcon,
        fullWidth = false,
        type = "button",
        ...props
    }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none select-none rounded-[12px] active:scale-95";

        // Size styles
        const sizeStyles = {
            sm: "text-xs px-3 py-1.5 gap-1.5",
            md: "text-sm px-5 py-2.5 gap-2",
            lg: "text-base px-7 py-3.5 gap-2.5",
            icon: "p-2.5 aspect-square",
        };

        // Variant styles
        const variantStyles = {
            primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 border border-transparent",
            secondary: "bg-surface-2 text-text-primary border border-border-default hover:border-border-hover hover:bg-surface-3",
            outline: "bg-transparent text-text-secondary border border-border-default hover:border-border-hover hover:text-text-primary",
            ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2",
            danger: "bg-error/10 text-error border border-error/20 hover:bg-error/20 hover:border-error/50",
            glass: "glass text-text-primary hover:bg-surface-2 hover:border-border-hover",
        };

        const widthClass = fullWidth ? "w-full" : "";

        const combinedClassName = `
      ${baseStyles} 
      ${sizeStyles[size]} 
      ${variantStyles[variant]} 
      ${widthClass} 
      ${className}
    `;

        const content = (
            <>
                {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {!isLoading && leftIcon}
                {children}
                {!isLoading && rightIcon}
            </>
        );

        if (href) {
            if (external) {
                return (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={combinedClassName}
                    >
                        {content}
                    </a>
                );
            }
            return (
                <Link href={href} className={combinedClassName}>
                    {content}
                </Link>
            );
        }

        return (
            <button
                ref={ref}
                type={type}
                className={combinedClassName}
                disabled={disabled || isLoading}
                {...props}
            >
                {content}
            </button>
        );
    }
);

Button.displayName = "Button";
