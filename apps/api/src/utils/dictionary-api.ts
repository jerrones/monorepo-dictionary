const BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

export interface DictionaryApiResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
    sourceUrl?: string;
  }>;
  meanings?: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      synonyms?: string[];
      antonyms?: string[];
      example?: string;
    }>;
    synonyms?: string[];
    antonyms?: string[];
  }>;
  license?: {
    name: string;
    url: string;
  };
  sourceUrls?: string[];
}

export async function fetchWordFromApi(word: string): Promise<DictionaryApiResponse[] | null> {
  try {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(word)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Dictionary API returned status ${response.status}`);
    }

    const data = (await response.json()) as DictionaryApiResponse[];
    return data;
  } catch (error) {
    console.error(`❌ Error fetching word "${word}" from Dictionary API:`, error);
    throw error;
  }
}
