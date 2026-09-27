# Map 2 handoff

## Scope

`/[city]/map2` is an opt-in visual variant of the existing map.
The legacy `/[city]/map` route remains the default for existing links.
The new route has `noindex` metadata and a canonical link to the legacy map.
No API, schema, taxonomy, or backend behavior was changed.

Map 2 uses the shared event/venue hooks, marker data, filters, sorting,
selection restoration, date handlers, action destinations, and analytics.
Shared components opt into the presentation through `refined` props.
`MapPageClient` defaults to the legacy variant.

## Current interface

The top toolbar stays in one 44 px band:

- Original animated WMV logo, with a static source under reduced motion.
- Compact Today/date-range trigger and visibly labelled Filters.
- Four complete date cells with weekday, day, and month context.
- Swipe and Left/Right keyboard paging on the date rail.

The Today popup provides the existing six range presets plus Previous/Next
controls and four selectable dates, preserving pointer access to every date.
Selecting Today resets the rail to today's page even after paging or selecting
another date. Global dates and card-specific date overrides remain distinct.

The toolbar and category rail use opaque graphite surfaces without heavy frames.
Inactive controls are borderless. Selected dates use soft cyan; unselected Today
has a small indicator. The logo is centred, with a deliberate 4 px gap to Today.

Primary categories occupy two horizontally scrollable rows. Their semantic icons,
labels, and counts remain visible. More/Earlier uses its own 44 px column beside
the scroll viewport, so the control never covers a category label.
Secondary options appear only for an expanded primary and scroll independently.
Selected primary and secondary options use a category tint, stronger weight,
and underline; selection is not communicated by colour alone.

Preview cards retain a neutral graphite body, contained 82×104 px portrait on
the right, event title, venue, metadata, and category tags. The category edge and
44×44 px up action use the same resolved category colour. The up control has an
8 px gap from clipped tags and is labelled “Open event details” for accessibility.

The accent uses the first selected primary that belongs to the represented event,
falling back to that event's original primary. It does not recolour an unrelated
event merely because its venue matches a selected category.

Details are one continuous scroll document with Event/Venue section jumps.
The fixed identity and navigation remain visible. Portrait media sits beside
compact date/time/entry facts; contacts follow immediately. Change date reveals
the existing card-specific complete-tile pager.

All event and venue information remains accessible: offers, artists, music, vibes,
categories, expandable notes, address, rating, contacts, and venue attributes.
Both authentic media slots, gallery navigation, and fullscreen remain available.
Book stays visible and uses the original booking URL when present. Without that
URL it is disabled and says “No booking link provided”; no destination is invented.
Directions, Share, Call, Instagram, and Website retain their existing handlers.

## Main files

| Area | File |
| --- | --- |
| Route/metadata/loading | `src/app/[city]/map2/page.tsx`, `Map2Loader.tsx` |
| Scoped presentation | `src/app/[city]/map2/map2.css`, `map2-details.css` |
| Variant and shared map state | `src/app/[city]/map/MapPageClient.tsx` |
| Toolbar/date browsing | `src/components/navigation/TopNav.tsx` |
| Primary/secondary categories | `src/components/filters/CategoryPills.tsx` |
| Carousel and measured dock | `src/components/mobile/MobileEventList.tsx` |
| Preview/detail presentation | `src/components/mobile/MobileEventCard.tsx` |
| Filters/actions | `FilterBottomSheet.tsx`, `FilterActionBar.tsx` |
| Bottom navigation/share | `NavPill.tsx`, `ShareModal.tsx` |

The header, category rail, and carousel dock report their measured heights.
Keep those measurements when changing density; fixed offsets can cover map controls
on short phones. Map 2 styles are scoped beneath `.wmv-map2`.

## Local setup

Use the project's existing private environment and backend configuration.
Never commit `.env.local`, credentials, or runtime build output.
The API proxy defaults to `127.0.0.1:2300` when backend URL overrides are unset.
Use a local backend or your authorized localhost-only SSH forward to that port.
Do not point the API proxy at the frontend URL, which would make it call itself.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3001
# http://127.0.0.1:3001/dubai/map2
```

For a production preview, run `npm run build`, then:

```sh
HOSTNAME=127.0.0.1 PORT=3004 node .next/standalone/server.js
```

Do not run dev and build against the same `.next` output concurrently.
During local QA, macOS offloaded repository files blocked reads. The final build
used `/private/tmp/wmv-spacing-v13-build` outside iCloud, checked out at exact
commit `a0d3ecbf82800d12281018c2ee5e86793804d0f6` with the task source overlaid.
The temporary standalone directory is a local troubleshooting runtime only.
Original source edits remain in the project; this is not a deployment procedure.

## Validation and limits

The final production build passed. Scoped ESLint reported zero errors and existing
warnings. At 360/390/424 px and short portrait, four full date cells fit with no
horizontal page overflow. At 360 px each date is 45×44 px and the numeral is 16 px.
The logo's vertical centre offset measured 0 px. Swipe/keyboard forward and back,
popup paging/date selection, Today reset, Filters, and reduced-motion logo passed.

Category paging reached all nine active Dubai primaries and returned to the start.
Food and Special Menu retained matching semantic selection colours. Prior real-data
comparison showed matching legacy/Map 2 map counts; no data filtering code changed.
The footer was checked at 360/390 px: 44×44 px control, 8 px tag gap, centred icon,
contained portrait, and working detail opening. Contacts and media remain available.
External booking/contact destinations were not invoked during final visual QA.

Representative final captures: [compact map at 360 px](map2/compact-map-360.png)
and [card footer at 390 px](map2/card-footer-390.png).

Whole-repository TypeScript checking has a known baseline of 1,060 errors;
production builds skip type/lint validation. A passing build is not a clean whole-
repository type check. Authentic video playback was not established in headless
Chrome; media slots/fullscreen and image fallback were verified, but successful
video playback remains a manual-browser check.
