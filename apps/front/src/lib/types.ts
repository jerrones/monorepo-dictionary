export interface AuthResponse {
  id: string;
  name: string;
  token: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  totalDocs: number;
  previous: string | null;
  next: string | null;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface HistoryItem {
  word: string;
  added: string;
}

export interface FavoriteItem {
  word: string;
  added: string;
}

export interface WordPhonetic {
  text?: string;
  audio?: string;
}

export interface WordDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface WordMeaning {
  partOfSpeech: string;
  definitions: WordDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface WordDetail {
  word: string;
  phonetic?: string;
  phonetics?: WordPhonetic[];
  meanings: WordMeaning[];
  sourceUrls?: string[];
}

export interface ApiError {
  message: string;
}
