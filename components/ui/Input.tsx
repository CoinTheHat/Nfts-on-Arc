import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, rightIcon, className = "", containerClassName = "", id, ...props }, ref) => {
        const inputId = id || props.name || Math.random().toString(36).substring(7);

        return (
            <div className={`space-y-2 ${containerClassName}`}>
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-gray-400">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`
              w-full bg-surface-2 text-text-primary rounded-xl border border-border-default 
              px-4 py-3 outline-none transition-all duration-300
              placeholder:text-text-tertiary
              focus:ring-2 focus:ring-primary/50 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? "pl-11" : ""}
              ${rightIcon ? "pr-11" : ""}
              ${error ? "border-error focus:ring-error/30 focus:border-error" : "hover:border-border-hover"}
              ${className}
            `}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-sm text-error animate-slide-up">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
