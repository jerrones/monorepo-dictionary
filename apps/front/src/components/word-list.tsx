"use client";

import { useEffect, useRef } from "react";
import { WordListSkeleton } from "./skeleton";

export default function WordList({
  words,
  isLoading,
  hasNext,
  onLoadMore,
  onWordClick,
  emptyMessage = "Nenhuma palavra encontrada.",
  renderActions,
}: {
  words: string[];
  isLoading: boolean;
  hasNext: boolean;
  onLoadMore: () => void;
  onWordClick: (word: string) => void;
  emptyMessage?: string;
  renderActions?: (word: string) => React.ReactNode;
}) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isLoading) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasNext, isLoading]);

  if (isLoading && words.length === 0) {
    return <WordListSkeleton />;
  }

  if (!isLoading && words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <svg className="w-16 h-16 text-text-light/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-text-muted text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {words.map((word, index) => (
          <div
            key={`${word}-${index}`}
            className="glass-card p-4 cursor-pointer hover:bg-surface-hover hover:shadow-md hover:scale-[1.02] transition-all duration-200 animate-fade-in flex items-center justify-between gap-2"
            style={{ animationDelay: `${Math.min(index * 20, 300)}ms` }}
            onClick={() => onWordClick(word)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onWordClick(word);
              }
            }}
            aria-label={`Ver detalhes de ${word}`}
          >
            <span className="text-text font-medium truncate">{word}</span>
            {renderActions && (
              <div onClick={(e) => e.stopPropagation()}>
                {renderActions(word)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div ref={observerTarget} className="w-full h-1" aria-hidden="true" />

      {isLoading && hasNext && (
        <div className="flex justify-center mt-6 mb-8">
          <span className="flex items-center gap-2 text-text-muted font-medium">
            <svg className="w-5 h-5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Carregando mais...
          </span>
        </div>
      )}
    </div>
  );
}
