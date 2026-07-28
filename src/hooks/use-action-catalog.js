"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { actionCatalogService } from "@/services/actionCatalogService";
import { useI18n } from "@/hooks/useI18n";
import {
  getLocalizedActionLabel,
  buildActionOptions,
} from "@/components/actions/action-label-utils";

export const actionCatalogKeys = {
  all: ["action-catalog"],
  detail: () => [...actionCatalogKeys.all, "detail"],
};

/**
 * Loads / caches the Action Catalog (24h React Query staleTime + localStorage).
 */
export function useActionCatalog(options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: actionCatalogKeys.detail(),
    queryFn: () => actionCatalogService.getCatalog(),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    enabled,
  });
}

/**
 * Options for selects / filters, filtered by owner type(s).
 *
 * @param {object} params
 * @param {string|null} [params.ownerType] — single lead owner type
 * @param {Array<string|null|undefined>} [params.ownerTypes] — bulk: intersection
 * @param {boolean} [params.includeFilterOnly=false] — include filter_only (e.g. "new")
 * @param {boolean} [params.enabled=true]
 */
export function useActionOptions({
  ownerType = null,
  ownerTypes = null,
  includeFilterOnly = false,
  enabled = true,
} = {}) {
  const { translate } = useI18n();
  const query = useActionCatalog({ enabled });

  const options = useMemo(() => {
    const catalog = query.data;
    if (!catalog) return [];

    return buildActionOptions({
      catalog,
      ownerType,
      ownerTypes,
      includeFilterOnly,
      translate,
    });
  }, [query.data, ownerType, ownerTypes, includeFilterOnly, translate]);

  return {
    ...query,
    options,
    catalog: query.data ?? null,
  };
}

/**
 * Localized label for any action value (catalog + translate fallback).
 */
export function useActionLabel(value) {
  const { translate } = useI18n();
  const { data: catalog } = useActionCatalog();

  return useMemo(
    () => getLocalizedActionLabel(value, translate, catalog),
    [value, translate, catalog]
  );
}

export function getScheduledActionsFromCatalog(catalog) {
  if (!catalog?.actions) return [];
  return catalog.actions
    .filter((a) => a.requires_meeting_time)
    .map((a) => a.value);
}
