import React from "react";

interface Tab {
    id: string;
    label: string;
    count?: number;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className = "" }: TabsProps) => {
    return (
        <div className={`flex items-center gap-6 border-b border-border mb-6 overflow-x-auto no-scrollbar ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`
              relative pb-4 text-sm font-medium transition-colors whitespace-nowrap
              ${isActive ? "text-white" : "text-gray-500 hover:text-gray-300"}
            `}
                    >
                        <div className="flex items-center gap-2">
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`
                  text-xs px-2 py-0.5 rounded-full 
                  ${isActive ? "bg-white/10 text-white" : "bg-gray-800 text-gray-400"}
                `}>
                                    {tab.count}
                                </span>
                            )}
                        </div>

                        {/* Active Indicator */}
                        {isActive && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full animate-fade-in" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
