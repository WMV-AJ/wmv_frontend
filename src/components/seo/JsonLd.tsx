// Renders a schema.org JSON-LD block from a server component.
// Next sanitizes nothing here — the data objects are built from our own
// backend records, but we still escape `<` to prevent script breakout if a
// scraped field ever contains "</script>".
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
