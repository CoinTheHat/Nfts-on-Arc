import React from "react";
import { Button } from "./Button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Previous
            </Button>

            <span className="text-sm text-gray-400 font-medium px-4">
                Page {currentPage} of {totalPages}
            </span>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </Button>
        </div>
    );
};
