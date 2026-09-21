# Self-hosted fonts

`SUSEMono-*.woff2` — **SUSE Mono**, variable weight axis 100–800, normal style only.

Loaded via `next/font/local` in `src/app/layout.tsx` as `--font-suse-mono`.

## Why self-hosted

SUSE Mono is not in the Google Fonts metadata bundled with Next 15.5, so
`next/font/google` cannot resolve it. The two `.woff2` files here are the
`latin` and `latin-ext` subsets pulled from the Google Fonts CSS2 API
(`fonts.gstatic.com/s/susemono/v1/...`). Re-download both if the family is
updated upstream.

Its companion, **SUSE**, *is* in the bundled metadata and loads normally
through `next/font/google`.

## Licence

SIL Open Font License 1.1 — see `OFL.txt`. Copyright the SUSE Mono authors.
