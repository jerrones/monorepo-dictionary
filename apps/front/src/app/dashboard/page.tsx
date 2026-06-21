"use client";

import { useEffect, useState, useCallback } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEntries, getHistory, getFavorites, unfavoriteWord, getWordDetails } from "@/lib/api";
import dynamic from "next/dynamic";
import SearchInput from "@/components/search-input";
import WordList from "@/components/word-list";

const WordModal = dynamic(() => import("@/components/word-modal"), { ssr: false });

type Tab = "dictionary" | "history" | "favorites";

const TAB_CONFIG = [
  {
    key: "dictionary" as Tab,
    label: "Dicionário",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    key: "history" as Tab,
    label: "Histórico",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "favorites" as Tab,
    label: "Favoritos",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dictionary");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dictionaryQuery = useInfiniteQuery({
    queryKey: ["entries"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return getEntries(pageParam, 40);
    },
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    enabled: isMounted && !searchTerm,
  });

  const searchQuery = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async () => {
      try {
        await getWordDetails(searchTerm);
        return [searchTerm];
      } catch {
        return [];
      }
    },
    enabled: isMounted && searchTerm.length > 0,
    retry: false,
  });

  const historyQuery = useInfiniteQuery({
    queryKey: ["history"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return getHistory(pageParam, 40);
    },
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    enabled: isMounted && activeTab === "history",
  });

  const favoritesQuery = useInfiniteQuery({
    queryKey: ["favorites"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      return getFavorites(pageParam, 40);
    },
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    enabled: isMounted && activeTab === "favorites",
  });

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  async function handleUnfavorite(word: string) {
    try {
      await unfavoriteWord(word);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    } catch {
      // silently fail
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === "history") {
      queryClient.invalidateQueries({ queryKey: ["history"] });
    }
    if (tab === "favorites") {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
  }

  const allDictionaryWords = searchTerm
    ? (searchQuery.data || [])
    : (dictionaryQuery.data?.pages.flatMap((p) => p.results) || []);
  const allHistoryWords = historyQuery.data?.pages.flatMap((p) => p.results) || [];
  const allFavoriteWords = favoritesQuery.data?.pages.flatMap((p) => p.results) || [];

  const favoriteWordsSet = new Set(allFavoriteWords.map((f) => f.word));

  // Find total docs safely from the first page
  const dictionaryTotalDocs = searchTerm
    ? (searchQuery.data ? searchQuery.data.length : undefined)
    : dictionaryQuery.data?.pages[0]?.totalDocs;
  const favoritesTotalDocs = favoritesQuery.data?.pages[0]?.totalDocs ?? allFavoriteWords.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 sm:pb-0">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab.key
              ? "bg-accent text-input shadow-md shadow-accent/20"
              : "bg-surface text-text-muted hover:bg-surface-hover hover:text-text"
              }`}
            aria-selected={activeTab === tab.key}
            role="tab"
          >
            {tab.icon}
            {tab.label}
            {tab.key === "favorites" && allFavoriteWords.length > 0 && activeTab === "favorites" && (
              <span className="ml-1 px-1.5 py-0.5 bg-input/30 rounded-full text-xs">
                {favoritesTotalDocs}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "dictionary" && (
        <div className="space-y-6 animate-fade-in">
          <SearchInput onSearch={handleSearch} initialValue={searchTerm} />

          {dictionaryTotalDocs !== undefined && (
            <p className="text-sm text-text-muted">
              {dictionaryTotalDocs.toLocaleString("pt-BR")} palavras
              {searchTerm && ` para "${searchTerm}"`}
            </p>
          )}

          <WordList
            words={allDictionaryWords}
            isLoading={searchTerm ? searchQuery.isLoading || searchQuery.isFetching : dictionaryQuery.isLoading || dictionaryQuery.isFetching}
            hasNext={searchTerm ? false : dictionaryQuery.hasNextPage}
            onLoadMore={() => {
              if (!searchTerm) dictionaryQuery.fetchNextPage();
            }}
            onWordClick={setSelectedWord}
          />
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-text">Palavras pesquisadas recentemente</h2>
          </div>

          <WordList
            words={allHistoryWords.map((h) => h.word)}
            isLoading={historyQuery.isLoading || historyQuery.isFetching}
            hasNext={historyQuery.hasNextPage}
            onLoadMore={() => historyQuery.fetchNextPage()}
            onWordClick={setSelectedWord}
            emptyMessage="Nenhuma pesquisa no histórico."
          />
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <h2 className="text-lg font-semibold text-text">Suas palavras favoritas</h2>
          </div>

          <WordList
            words={allFavoriteWords.map((f) => f.word)}
            isLoading={favoritesQuery.isLoading || favoritesQuery.isFetching}
            hasNext={favoritesQuery.hasNextPage}
            onLoadMore={() => favoritesQuery.fetchNextPage()}
            onWordClick={setSelectedWord}
            emptyMessage="Nenhuma palavra favorita ainda."
            renderActions={(word) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnfavorite(word);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                aria-label={`Remover ${word} dos favoritos`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          />
        </div>
      )}

      {selectedWord && (
        <WordModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          isFavorited={favoriteWordsSet.has(selectedWord)}
          onFavoriteChange={() => {
            queryClient.invalidateQueries({ queryKey: ["favorites"] });
          }}
        />
      )}
    </div>
  );
}
