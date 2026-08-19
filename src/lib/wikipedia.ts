export interface WikipediaSuggestion {
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
}

interface WikipediaSearchResponse {
  pages: {
    key: string;
    title: string;
    description: string | null;
    thumbnail: { url: string } | null;
  }[];
}

// API REST publique de Wikipédia : gratuite, sans clé, CORS activé.
// https://www.mediawiki.org/wiki/API:REST_API
export async function searchWikipedia(
  query: string,
  signal?: AbortSignal,
): Promise<WikipediaSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `https://fr.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(
    trimmed,
  )}&limit=5`;

  const response = await fetch(url, { signal });
  if (!response.ok) return [];

  const data = (await response.json()) as WikipediaSearchResponse;

  return data.pages.map((page) => ({
    title: page.title,
    description: page.description,
    url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.key)}`,
    thumbnailUrl: page.thumbnail
      ? page.thumbnail.url.startsWith("//")
        ? `https:${page.thumbnail.url}`
        : page.thumbnail.url
      : null,
  }));
}
