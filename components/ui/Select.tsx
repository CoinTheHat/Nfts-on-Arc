import React from "react";

interface Option {
    label: string;
    value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: Option[];
    containerClassName?: string;
    leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, className = "", containerClassName = "", leftIcon, id, ...props }, ref) => {
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
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors pointer-events-none z-10">
                            {leftIcon}
                        </div>
                    )}
                    <select
                        ref={ref}
                        id={inputId}
                        className={`
              w-full bg-surface-2 text-text-primary rounded-xl border border-border-default 
              px-4 py-3 outline-none transition-all duration-300 appearance-none
              focus:ring-2 focus:ring-primary/50 focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
              ${leftIcon ? "pl-11" : ""}
              ${error ? "border-error focus:ring-error/30 focus:border-error" : "hover:border-border-hover"}
              ${className}
            `}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value} className="bg-bg-alt text-text-primary py-2">
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {/* Custom Arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
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

Select.displayName = "Select";
