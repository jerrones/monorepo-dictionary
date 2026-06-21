"use client";

import { useState, useEffect, useRef } from "react";

export default function SearchInput({
  onSearch,
  placeholder = "Buscar palavra...",
  initialValue = "",
}: {
  onSearch: (value: string) => void;
  placeholder?: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onSearch]);

  return (
    <div className="relative w-full">
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="m21 21-4.35-4.35" />
      </svg>
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-4 py-3 bg-input border border-border rounded-xl text-text placeholder-text-light focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
        aria-label="Buscar palavra no dicionário"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-border-strong/30 text-text-muted hover:bg-border-strong/50 transition-colors"
          aria-label="Limpar busca"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
