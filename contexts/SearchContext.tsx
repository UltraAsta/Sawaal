import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContexts";

interface SearchFilters {
  query: string;
  category: string;
  difficulty: string;
}

interface SearchContextType {
  filters: SearchFilters;
  setSearchQuery: (query: string) => void;
  setCategory: (category: string) => void;
  setDifficulty: (difficulty: string) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const defaultFilters: SearchFilters = {
  query: "",
  category: "all",
  difficulty: "all",
};

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const { registerCleanupCallback, unregisterCleanupCallback } = useAuth();

  // Register cleanup callback
  useEffect(() => {
    const cleanup = () => {
      setFilters(defaultFilters);
      console.log("Search filters cleared on logout");
    };

    registerCleanupCallback(cleanup);
    return () => unregisterCleanupCallback(cleanup);
  }, [registerCleanupCallback, unregisterCleanupCallback]);

  const setSearchQuery = (query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  };

  const setCategory = (category: string) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const setDifficulty = (difficulty: string) => {
    setFilters((prev) => ({ ...prev, difficulty }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.query !== "" || filters.category !== "all" || filters.difficulty !== "all"
    );
  };

  return (
    <SearchContext.Provider
      value={{
        filters,
        setSearchQuery,
        setCategory,
        setDifficulty,
        clearFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
