import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "text" | "circular" | "rectangular";
    width?: string | number;
    height?: string | number;
}

export const Skeleton = ({
    className = "",
    variant = "text",
    width,
    height,
    style,
    ...props
}: SkeletonProps) => {
    const baseClass = "animate-pulse bg-gray-800/50";

    const variants = {
        text: "rounded-md h-4 w-full",
        circular: "rounded-full",
        rectangular: "rounded-xl",
    };

    const styles = {
        width: width,
        height: height,
        ...style,
    };

    return (
        <div
            className={`${baseClass} ${variants[variant]} ${className}`}
            style={styles}
            {...props}
        />
    );
};
