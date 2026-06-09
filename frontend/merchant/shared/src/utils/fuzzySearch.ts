function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function subsequenceScore(text: string, query: string): number {
  if (!query) {
    return 0;
  }

  let qIndex = 0;
  let streak = 0;
  let score = 0;

  for (let i = 0; i < text.length && qIndex < query.length; i += 1) {
    if (text[i] === query[qIndex]) {
      qIndex += 1;
      streak += 1;
      score += 2 + streak;
    } else {
      streak = 0;
    }
  }

  if (qIndex !== query.length) {
    return -1;
  }

  return score;
}

export function fuzzyScore(text: string, query: string): number {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedText.startsWith(normalizedQuery)) {
    return 1000 - (normalizedText.length - normalizedQuery.length);
  }

  const directIndex = normalizedText.indexOf(normalizedQuery);
  if (directIndex >= 0) {
    return 800 - directIndex;
  }

  return subsequenceScore(normalizedText, normalizedQuery);
}

export function fuzzyFilterAndSort<T>(
  items: T[],
  query: string,
  stringify: (item: T) => string,
): T[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return items;
  }

  const scored: Array<{ item: T; score: number }> = [];
  for (const item of items) {
    const score = fuzzyScore(stringify(item), normalizedQuery);
    if (score >= 0) {
      scored.push({ item, score });
    }
  }

  return scored.sort((a, b) => b.score - a.score).map((entry) => entry.item);
}
