import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className = "", containerClassName = "", id, ...props }, ref) => {
        const inputId = id || props.name || Math.random().toString(36).substring(7);

        return (
            <div className={`space-y-2 ${containerClassName}`}>
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-gray-400">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <textarea
                        ref={ref}
                        id={inputId}
                        className={`
              w-full bg-surface-hover text-white rounded-xl border border-border 
              px-4 py-3 outline-none transition-all duration-300
              placeholder:text-gray-600 min-h-[100px] resize-y
              focus:ring-2 focus:ring-primary/50 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "border-error focus:ring-error/30 focus:border-error" : "hover:border-gray-600"}
              ${className}
            `}
                        {...props}
                    />
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

Textarea.displayName = "Textarea";
