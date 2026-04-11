"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface SearchContextValue {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  open: false,
  openSearch: () => {},
  closeSearch: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

export default function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  return (
    <SearchContext value={{ open, openSearch, closeSearch }}>
      {children}
    </SearchContext>
  );
}
