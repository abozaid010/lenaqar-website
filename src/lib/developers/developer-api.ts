import axiosInstance from '@/utils/axiosInstance';

interface SlimDeveloper {
  id?: string;
  en_name?: string;
  ar_name?: string;
  [key: string]: unknown;
}

interface DevelopersPage {
  developers: SlimDeveloper[];
  nextCursor: string | null;
  hasNext: boolean;
}

/**
 * Server-side first-page fetch for the developers infinite list.
 * Mirrors `fetchDevelopersBase` from `src/utils/api.js` but:
 *  - Runs on the server (uses server axios, no window/localStorage)
 *  - Skips the localStorage lang sort (server has no locale at this point;
 *    the client hook re-sorts subsequent pages consistently)
 *  - Returns a TanStack `useInfiniteQuery`-compatible shape:
 *      `{ pages: [firstPage], pageParams: [undefined] }`
 *
 * Returns null on error so the client hook retries transparently.
 */
export async function fetchDevelopersServer(
  pageSize = 20
): Promise<{ pages: DevelopersPage[]; pageParams: unknown[] } | null> {
  try {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    const response = await axiosInstance.get(
      `/developers/v1/get_all_slim?${params.toString()}`
    );

    if (!response.data?.status || !response.data?.data) return null;

    const { developers, next_cursor } = response.data.data;
    if (!Array.isArray(developers)) return null;

    const page: DevelopersPage = {
      developers,
      nextCursor: next_cursor ?? null,
      hasNext: next_cursor !== null && next_cursor !== undefined,
    };

    return {
      pages: [page],
      pageParams: [undefined],
    };
  } catch {
    return null;
  }
}
