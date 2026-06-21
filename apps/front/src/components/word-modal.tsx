"use client";

import { useEffect, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWordDetails, favoriteWord, unfavoriteWord } from "@/lib/api";
import type { WordDetail } from "@/lib/types";
import Skeleton from "./skeleton";

export default function WordModal({
  word,
  onClose,
  isFavorited,
  onFavoriteChange,
}: {
  word: string;
  onClose: () => void;
  isFavorited?: boolean;
  onFavoriteChange?: () => void;
}) {
  const queryClient = useQueryClient();
  const [localFavorited, setLocalFavorited] = useState(isFavorited ?? false);

  useEffect(() => {
    setLocalFavorited(isFavorited ?? false);
  }, [isFavorited]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["word-detail", word],
    queryFn: () => getWordDetails(word),
  });

  const favoriteMutation = useMutation({
    mutationFn: () => (localFavorited ? unfavoriteWord(word) : favoriteWord(word)),
    onSuccess: () => {
      setLocalFavorited(!localFavorited);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      onFavoriteChange?.();
    },
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const detail: WordDetail | null = Array.isArray(data) ? data[0] ?? null : data ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes da palavra ${word}`}
    >
      <div className="absolute inset-0 bg-text/30 backdrop-blur-sm" />

      <div
        className="glass-modal relative w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 sm:p-8 animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="modal-close-button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-border/40 text-text-muted hover:bg-border-strong/50 hover:text-text transition-colors"
          aria-label="Fechar modal"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton height="32px" width="50%" />
            <Skeleton height="16px" width="30%" />
            <Skeleton height="80px" />
            <Skeleton height="60px" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-error mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-error font-medium">Palavra não encontrada</p>
            <p className="text-text-muted text-sm mt-1">Não foi possível carregar os detalhes.</p>
          </div>
        )}

        {detail && (
          <div className="space-y-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-text capitalize">{detail.word}</h2>
                <button
                  id="favorite-toggle-button"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-accent-light/50 hover:bg-accent-light transition-colors disabled:opacity-50"
                  aria-label={localFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <svg
                    className={`w-5 h-5 transition-colors ${localFavorited ? "text-accent fill-accent" : "text-text-muted"}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    fill={localFavorited ? "currentColor" : "none"}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
              </div>
              {detail.phonetic && (
                <p className="text-text-muted text-lg mt-1">{detail.phonetic}</p>
              )}
            </div>

            {detail.phonetics && detail.phonetics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detail.phonetics
                  .filter((p) => p.audio)
                  .map((p, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const audio = new Audio(p.audio);
                        audio.play();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-light/40 rounded-full text-sm text-text-muted hover:bg-accent-light/70 transition-colors"
                      aria-label={`Ouvir pronúncia ${p.text || ""}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      {p.text || "Ouvir"}
                    </button>
                  ))}
              </div>
            )}

            <div className="space-y-4">
              {detail.meanings.map((meaning, idx) => (
                <div key={idx} className="space-y-2">
                  <span className="inline-block px-3 py-1 bg-accent text-input text-xs font-semibold rounded-full uppercase tracking-wide">
                    {meaning.partOfSpeech}
                  </span>

                  <ol className="space-y-2 pl-5">
                    {meaning.definitions.slice(0, 5).map((def, dIdx) => (
                      <li key={dIdx} className="list-decimal text-text-muted text-sm leading-relaxed marker:text-text-light">
                        <p className="text-text">{def.definition}</p>
                        {def.example && (
                          <p className="text-text-muted italic mt-1 pl-2 border-l-2 border-accent-light">
                            &ldquo;{def.example}&rdquo;
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>

                  {meaning.synonyms && meaning.synonyms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-xs text-text-light font-medium">Sinônimos:</span>
                      {meaning.synonyms.slice(0, 8).map((syn) => (
                        <span key={syn} className="text-xs px-2 py-0.5 bg-accent-light/30 text-text-muted rounded-full">
                          {syn}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
