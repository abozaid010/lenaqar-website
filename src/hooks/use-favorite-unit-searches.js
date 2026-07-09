"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFavoriteId,
  getFavoriteSearchesStorageKey,
  isDuplicateFavoriteName,
  normalizeFavoriteName,
  readFavoriteSearches,
  writeFavoriteSearches,
} from "@/lib/units/favorite-searches";

export function useFavoriteUnitSearches(isPublic = false) {
  const storageKey = useMemo(
    () => getFavoriteSearchesStorageKey(isPublic),
    [isPublic]
  );
  const [favorites, setFavorites] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setFavorites(readFavoriteSearches(storageKey));
    setIsHydrated(true);
  }, [storageKey]);

  const persist = useCallback(
    (nextFavorites) => {
      setFavorites(nextFavorites);
      writeFavoriteSearches(storageKey, nextFavorites);
    },
    [storageKey]
  );

  const saveFavorite = useCallback(
    (name, filters) => {
      const normalizedName = normalizeFavoriteName(name);
      if (!normalizedName) {
        return { ok: false, error: "empty_name" };
      }
      if (isDuplicateFavoriteName(favorites, normalizedName)) {
        return { ok: false, error: "duplicate_name" };
      }

      const nextFavorite = {
        id: createFavoriteId(),
        name: normalizedName,
        filters: { ...filters },
        savedAt: new Date().toISOString(),
      };

      persist([nextFavorite, ...favorites]);
      return { ok: true, favorite: nextFavorite };
    },
    [favorites, persist]
  );

  const renameFavorite = useCallback(
    (id, name) => {
      const normalizedName = normalizeFavoriteName(name);
      if (!normalizedName) {
        return { ok: false, error: "empty_name" };
      }
      if (isDuplicateFavoriteName(favorites, normalizedName, id)) {
        return { ok: false, error: "duplicate_name" };
      }

      const nextFavorites = favorites.map((favorite) =>
        favorite.id === id ? { ...favorite, name: normalizedName } : favorite
      );
      persist(nextFavorites);
      return { ok: true };
    },
    [favorites, persist]
  );

  const deleteFavorite = useCallback(
    (id) => {
      persist(favorites.filter((favorite) => favorite.id !== id));
      return { ok: true };
    },
    [favorites, persist]
  );

  return {
    favorites,
    isHydrated,
    saveFavorite,
    renameFavorite,
    deleteFavorite,
  };
}
