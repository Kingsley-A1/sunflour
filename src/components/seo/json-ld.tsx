interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Renders a schema.org JSON-LD `<script>` tag. The serialized JSON has `<`
 * escaped so product names or descriptions can never break out of the script
 * element (e.g. a literal `</script>`).
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // Content is app-controlled structured data with `<` escaped above.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
