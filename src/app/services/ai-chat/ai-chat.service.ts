import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatRequest, ChatResponse } from '../../types/ai-chat/ai-chat.types';

@Injectable({
  providedIn: 'root',
})
export class AiChatService {
  private baseUrl = '';

  constructor(private http: HttpClient) {}

  setBaseUrl(url: string): void {
    this.baseUrl = (url.endsWith('/') ? url.slice(0, -1) : url) + 'aichattest/api';
  }

  chat(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, request);
  }

  chatStream(request: ChatRequest): Observable<MessageEvent> {
    return new Observable((observer) => {
      fetch(`${this.baseUrl}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
        .then((response) => {
          if (!response.ok) {
            observer.error(new Error(`HTTP error! status: ${response.status}`));
            return;
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            observer.error(new Error('No response body'));
            return;
          }

          const readStream = (): void => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  observer.complete();
                  return;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    observer.next(new MessageEvent('message', { data }));
                  }
                }

                readStream();
              })
              .catch((error) => observer.error(error));
          };

          readStream();
        })
        .catch((error) => observer.error(error));

      return () => {
        // Cleanup
      };
    });
  }

  downloadBlob(blobName: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/blob/download/${blobName}`, {
      responseType: 'blob',
    });
  }
}
