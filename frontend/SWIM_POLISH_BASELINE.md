# Swim Dashboard Baseline Audit

## Current strengths
- Uses shared `DashboardLayout`, section wrappers, chart wrappers, and table component.
- Themed palette and spacing tokens are already wired in.
- Chart variety is complete (column, bar, pie, donut) and functional.

## Gaps to address in polish pass
- KPI summary row still uses mixed card density and weak visual hierarchy compared to final mortgage tiles.
- Stroke KPI cards feel visually separate from summary KPI style (inconsistent component language).
- Rate/metric framing style from mortgage is not yet carried over to swim "headline" metrics.
- Chart section titles are descriptive but not grouped into a stronger narrative flow.
- Chart panels need slightly cleaner axis/readability tuning for dense daily data.
- Table needs stronger row readability polish (line separators, compact typography hierarchy).

## Target visual direction for swim
- Keep dashboard cohesion with mortgage updates while preserving swim color identity.
- Make top KPI section the visual anchor using contained metric tiles.
- Group and sequence sections as:
  1. Swim Summary KPI tiles
  2. Distance trend chart
  3. Stroke composition (bar + pie/donut)
  4. Recent workouts table
- Ensure all cards/panels feel distinct with clear boundaries and breathing room.

## Completed implementation summary
- Reframed section flow with narrative subtitles and clearer block hierarchy.
- Upgraded top summary cards to contained KPI tiles with stronger visual hierarchy.
- Standardized stroke snapshot cards to the same contained tile language.
- Tuned chart readability (daily axis density/domain controls) and grouped stroke visuals.
- Improved recent-workouts table readability (header contrast, row separators, hover, alignment).
- Applied swim-specific tile theming while preserving shared reporting-package style.

## Validation completed
- Frontend tests: 6/6 passing via `npm test -- --run`.
- Frontend production build passes via `npm run build`.
- Remaining technical note: Vite chunk size warning persists (>500 kB), unchanged by this polish pass.
