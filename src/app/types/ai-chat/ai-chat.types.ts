export interface Citation {
  id: string;
  citation_id: string;
  title: string;
  content: string;
  file_path: string;
  file_type: string;
  citation_location_type: string;
  citation_location: string[];
  score?: number;
  metadata?: CitationMetadata;
}

export interface CitationMetadata {
  filename: string;
  file_path: string;
  relative_path: string;
  extension: string;
  size_bytes: number;
  created_at: string;
  modified_at: string;
  file_type: string;
  num_pages?: number;
  title?: string;
  author?: string;
  creator?: string;
  category?: string;
  chunk_index?: number;
  is_single_chunk?: boolean | null;
}

export interface SelectedCitation {
  citation: Citation;
  blobUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface ChatMessage {
  content: string;
  role: 'user' | 'assistant' | 'system';
  id: string;
  timestamp: Date;
  citations?: Citation[];
  isStreaming?: boolean;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  use_rag?: boolean;
}

export interface ChatResponse {
  message: string;
  citations?: Citation[];
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AmitalChatConfig {
  apiConfig: {
    baseUrl: string;
    apiKey?: string;
    headers?: Record<string, string>;
    useRagByDefault?: boolean;
  };
  placeholder?: string;
  showTimestamps?: boolean;
  enableStreaming?: boolean;
  enableRag?: boolean;
  showCitations?: boolean;
  userAvatar?: string;
  assistantAvatar?: string;
  customClasses?: {
    container?: string;
    messageUser?: string;
    messageAssistant?: string;
    citation?: string;
  };
}
