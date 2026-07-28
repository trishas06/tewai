import axiosInstance from "../utils/axiosInstance";

// In-memory cache for the whole rule book so pages/components don't each
// fire their own network request — fetched once, reused for the session.
let rulebookCache = null;
let rulebookPromise = null;

export const ruleBookService = {
  // { [model]: { [category]: [entry, ...] } }
  getRulebook: async ({ forceRefresh = false } = {}) => {
    if (rulebookCache && !forceRefresh) return rulebookCache;
    if (rulebookPromise && !forceRefresh) return rulebookPromise;

    const promise = axiosInstance
      .get("/rulebook")
      .then((response) => {
        rulebookCache = response.data.rulebook || {};
        return rulebookCache;
      })
      .finally(() => {
        // Only clear the shared in-flight slot if we're still the current
        // request — guards against a forceRefresh call racing an
        // already-in-flight non-forced one and clobbering its result.
        if (rulebookPromise === promise) rulebookPromise = null;
      });

    rulebookPromise = promise;
    return promise;
  },

  // { [type]: entry } — flattened for O(1) lookup by a question's `type`,
  // e.g. the Report Analysis screen's per-question info icon.
  getFlatRulebook: async (opts) => {
    const grouped = await ruleBookService.getRulebook(opts);
    const flat = {};
    Object.values(grouped).forEach((categories) => {
      Object.values(categories).forEach((entries) => {
        entries.forEach((entry) => {
          flat[entry.type] = entry;
        });
      });
    });
    return flat;
  },
};

export default ruleBookService;
