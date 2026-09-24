# Home 3 and Home 4 handoff

These are two self-contained marketing-page variants for Where's My Vibe:

| Route | Design | Entry point |
| --- | --- | --- |
| `/home3` | Graphite, slate, silver, and restrained accents | [`src/app/home3/page.tsx`](../src/app/home3/page.tsx) |
| `/home4` | The same layout with a vivid palette taken from the official logo GIF | [`src/app/home4/page.tsx`](../src/app/home4/page.tsx) |

Both routes are passed through by [`src/middleware.ts`](../src/middleware.ts). They do not replace the main landing page or change the venue API. Their component and CSS source is intentionally separate, so Arpit can develop one treatment without changing the other. They **share** everything under [`public/home3`](../public/home3); changing a shared image, font, or poster affects both routes.

## Run locally

Use the project's Node/npm setup and install the lockfile dependencies:

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Open `http://127.0.0.1:3001/home3` or `/home4`. For a production preview:

```sh
npm run build
PORT=3004 HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

`npm run build` runs `next build` and [`scripts/sync-standalone.js`](../scripts/sync-standalone.js), which copies `public` and `.next/static` into the standalone output. Use another free port if 3001 or 3004 is occupied. No page-specific environment variables are required. City and venue data follow the existing app configuration/API; without its upstream service, venue-driven links may lead to pages with unavailable data.

## Change the pages

| To change… | Edit… |
| --- | --- |
| Headline, section copy, FAQ selection, category descriptions, city controls, links, hero scene buttons | `src/app/home3/Home3Client.tsx` or `src/app/home4/Home4Client.tsx` |
| Hero's four 3D formations, five photo planes, camera, lights, and transitions | The variant's `HeroSculpture.tsx` |
| Eight-photo category fan, framing, and lighting | The variant's `VibeInstallation.tsx` |
| Responsive layout, CSS static scenes, and fallback styling | The variant's `home3.module.css` or `home4.module.css` |
| Page metadata | The variant's `page.tsx` |
| Actual city/category IDs and destination routes | Shared `src/config/cities.config.ts` and `src/config/vibes-data.ts`; keep the marketing page mapped to these IDs |

The hero pose order is **Portal, Spread, Orbit, Cascade**. In each `HeroSculpture.tsx`, `POSES` holds position, rotation, and size targets for the same three metal loops and five photo planes. The lead photo by pose is club, rooftop, beach, and live performance respectively; friends is a supporting photo. The image source array must remain in that order if the pose table is unchanged. Transforms interpolate in the render loop. Match any pose-order edits in the client's `heroPoses` labels, CSS static `[data-pose]` composition, and (for Home 4) `HERO_PALETTES`. Changing only the WebGL scene would break the CSS/no-WebGL view.

Home 4's colour starts with the **actual** [`public/wmv-logo.gif`](../public/wmv-logo.gif). Its four distinct frames are saved as [frame 00](../public/home3/logo-frames/frame-00.png), [01](../public/home3/logo-frames/frame-01.png), [02](../public/home3/logo-frames/frame-02.png), and [03](../public/home3/logo-frames/frame-03.png); see the [contact sheet](assets/home3-logo-contact-sheet.png). The principal pairs are blue/cyan with yellow, violet/pink with lime, teal/cream with orange, and red with mint. Set 3D material/light colours in Home 4's `HERO_PALETTES` and `framePalette`, then tune matching CSS accents in `home4.module.css`. Keep the official GIF untinted. Its still poster is `public/home3/wmv-logo-still.png`. Photos are the local `public/home3/*.webp` files; the Inter font files and their license are there too.

## Motion and responsive behaviour

Each page scrolls inside its own `<main>` element, not the window. IntersectionObservers for the hero/gallery and the scroll choreography use that element as their root. Home 4's phone story collage, journey pieces, and atlas route/pins are driven by the existing scroll `update()` function in `Home4Client.tsx`; the short transforms and opacity changes are gated by viewport width and motion preference. Tune phone spacing/framing in its CSS media rules and inspect at **360 and 390 px** before expanding effects.

The global **MOTION ON/OFF** control switches the logo between GIF and still poster, stops scene animation, and shows CSS/DOM compositions. `prefers-reduced-motion: reduce` starts in the static state. Missing WebGL or lost context also uses the static scene; its four manual pose buttons still work. While motion is on, the hero advances after roughly five seconds of **visible, active** time, pausing when the document/hero is hidden or a fine pointer hovers or keyboard focus is inside the scene. A manual pose choice starts a fresh hold. The gallery mounts near its section; both Three.js scenes pause offscreen and dispose textures, geometry, and listeners on unmount. Preserve those paths when extending effects.

The category fan keeps its buttons, previous/next controls, touch drag, and links. Links are built from the selected city and the IDs in `VIBES_DATA`; do not substitute display labels for route IDs. No backend or main-app changes are needed for visual iteration.

## Verify before sharing

Run scoped lint on these routes and middleware, then build:

```sh
npx eslint src/app/home3 src/app/home4 src/middleware.ts
npm run build
```

Check both routes at 360, 390, 768, 1024, and 1440 px for horizontal overflow and image/control framing. On each, try four hero buttons, automatic cycling when motion is on, Motion Off and reduced motion, category selection/drag, city links, and the mobile menu. Also test a browser without WebGL if changing scene setup. The current project config allows production builds despite repository-wide TypeScript and ESLint errors; a successful build is therefore **not** a substitute for scoped lint and route checks. Keep changes on the intended branch, review the staged file list, and avoid committing `.next`, environment files, or QA screenshots.
