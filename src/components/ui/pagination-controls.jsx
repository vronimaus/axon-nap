import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PaginationControls({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          >
            1
          </Button>
          {startPage > 2 && <span className="text-slate-500">...</span>}
        </>
      )}

      {pages.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className={
            page === currentPage
              ? "bg-cyan-500 text-white hover:bg-cyan-600"
              : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          }
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-slate-500">...</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <span className="text-sm text-slate-400 ml-2">
        Seite {currentPage} von {totalPages} ({totalItems} gesamt)
      </span>
    </div>
  );
}