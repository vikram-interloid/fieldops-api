/**
 * Utility for parsing and validating dynamic relation inclusion query parameters.
 * E.g., `GET /work-orders?include=customer,technician,site,attachments`
 */

export function parseIncludes(queryValue?: unknown): string[] {
  if (!queryValue) return [];

  let items: string[] = [];
  if (typeof queryValue === 'string') {
    items = queryValue.split(',');
  } else if (Array.isArray(queryValue)) {
    items = queryValue.flatMap((v) =>
      typeof v === 'string' ? v.split(',') : [],
    );
  }

  return Array.from(
    new Set(
      items
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0),
    ),
  );
}

export function filterAllowedIncludes(
  requested: string[],
  allowed: string[],
): string[] {
  const allowedSet = new Set(allowed.map((a) => a.toLowerCase()));
  return requested.filter((r) => allowedSet.has(r));
}
