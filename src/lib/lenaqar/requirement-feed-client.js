import {
  HOME_REQUIREMENT_LIMIT,
  publicRequirementsQuery,
} from "./requirement-sort.js";

/** Owns cancellation so only the latest selection can update the feed. */
export function createRequirementFeedLoader({
  fetcher = fetch,
  onStart,
  onSuccess,
  onError,
}) {
  let version = 0;
  let controller;

  function cancel() {
    version += 1;
    controller?.abort();
  }

  async function load(sort) {
    const query = publicRequirementsQuery({ limit: HOME_REQUIREMENT_LIMIT, sort });
    cancel();
    const requestVersion = version;
    const requestController = new AbortController();
    controller = requestController;
    onStart();
    const timeout = setTimeout(() => requestController.abort(), 30_000);
    try {
      const response = await fetcher(`/api/lenaqar/requirements?${query}`, {
        signal: requestController.signal,
        headers: { Accept: "application/json" },
      });
      const json = await response.json();
      if (
        !response.ok ||
        json?.data?.error ||
        !Array.isArray(json?.data?.requirements)
      ) {
        throw new Error("Public requirements unavailable");
      }
      if (version === requestVersion) onSuccess(json.data.requirements);
    } catch {
      if (version === requestVersion) onError("unavailable");
    } finally {
      clearTimeout(timeout);
    }
  }

  return { load, cancel };
}
