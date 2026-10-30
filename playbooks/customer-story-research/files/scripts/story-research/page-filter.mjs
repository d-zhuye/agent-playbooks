// The story browser's filters. build-report.mjs inlines this file into the page (dropping
// "export "), so it must stay self-contained: no imports.
//
// Unset filters (undefined, null or '') match every story. Situation matches any part of the
// situation text, ignoring case, since finders describe situations in their own words. A story
// without a fit matches only while both fit bounds are unset. Every force listed must be present.
export function filterStories(stories, filters = {}) {
  const isSet = (v) => v !== undefined && v !== null && v !== '';
  const situation = isSet(filters.situation) ? String(filters.situation).toLowerCase() : null;
  return stories.filter((s) => {
    if (situation && !String(s.situation ?? '').toLowerCase().includes(situation)) return false;
    if (isSet(filters.type) && s.type !== filters.type) return false;
    if (isSet(filters.platform) && s.platform !== filters.platform) return false;
    if (isSet(filters.confidence) && s.fit?.confidence !== filters.confidence) return false;
    if (isSet(filters.minFit) || isSet(filters.maxFit)) {
      if (!s.fit) return false;
      if (isSet(filters.minFit) && s.fit.total < Number(filters.minFit)) return false;
      if (isSet(filters.maxFit) && s.fit.total > Number(filters.maxFit)) return false;
    }
    for (const f of filters.forces ?? []) {
      if (!s.forces?.[f]) return false;
    }
    return true;
  });
}
