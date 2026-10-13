import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number, direction: 'left' | 'right') => void;
    label?: string;
    className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    label,
    className = ''
}) => {
    const { t } = useTranslation();

    if (totalItems === 0 || totalPages <= 1) {
        return null;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1, 'left');
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1, 'right');
        }
    };

    const handleSelectPage = (page: number) => {
        if (page === currentPage) return;
        const direction = page > currentPage ? 'right' : 'left';
        onPageChange(page, direction);
    };

    // Smart window of page numbers
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | string)[] = [1];
        if (currentPage > 3) {
            pages.push('...');
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push('...');
        }
        pages.push(totalPages);

        return pages;
    };

    const pageNumbers = getPageNumbers();
    const displayRange = label || t.common.pagination.showing(startIndex + 1, endIndex, totalItems);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-white/[0.02] rounded-b-2xl ${className}`}>
            <span className="text-xs text-rain-300 font-medium">
                {displayRange}
            </span>

            <div className="flex items-center gap-1.5">
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-rain-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title={t.common.pagination.previous}
                >
                    <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((page, idx) => {
                    if (typeof page === 'string') {
                        return (
                            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-rain-400 select-none">
                                ...
                            </span>
                        );
                    }

                    const isActive = page === currentPage;
                    return (
                        <button
                            key={page}
                            onClick={() => handleSelectPage(page)}
                            className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                isActive
                                    ? 'bg-fiery text-white border-fiery shadow-glow-accent'
                                    : 'bg-white/5 hover:bg-white/10 text-rain-200 hover:text-white border-white/10'
                            }`}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-rain-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title={t.common.pagination.next}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};
