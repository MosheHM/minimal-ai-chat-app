import { Component, OnInit, OnDestroy, input, output, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NbChatModule, NbIconModule, NbButtonModule, NbSpinnerModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { Subject, takeUntil } from 'rxjs';
import {
  AmitalChatConfig,
  ChatMessage,
  ChatConversation,
  ChatRequest,
  Citation,
  SelectedCitation,
} from '../../types/ai-chat/ai-chat.types';
import { AiChatService } from '../../services/ai-chat/ai-chat.service';
import { AmitalPdfViewerComponent } from '../amital-pdf-viewer/amital-pdf-viewer.component';
import { AmitalWordViewerComponent } from '../amital-word-viewer/amital-word-viewer.component';
import { AmitalExcelViewerComponent } from '../amital-excel-viewer/amital-excel-viewer.component';
import { AmitalImageViewerComponent } from '../amital-image-viewer/amital-image-viewer.component';
import { MessageWithCitationsComponent } from './message-with-citations.component';


@Component({
  selector: 'amital-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NbChatModule,
    NbIconModule,
    NbButtonModule,
    NbSpinnerModule,
    NbEvaIconsModule,
    AmitalPdfViewerComponent,
    AmitalWordViewerComponent,
    AmitalExcelViewerComponent,
    AmitalImageViewerComponent,
    MessageWithCitationsComponent
  ],
  templateUrl: './amital-ai-chat.component.html',
  styleUrls: ['./amital-ai-chat.component.scss'],
})
export class AmitalAiChatComponent implements OnInit, OnDestroy {
  config = input.required<AmitalChatConfig>();
  height = input<string>('600px');
  width = input<string>('100%');

  @HostBinding('style.height') get hostHeight(): string {
    return this.height();

  }
  @HostBinding('style.width') get hostWidth(): string {
    return this.width();
  }
  @HostBinding('style.display') hostDisplay = 'block';

  messageSent = output<ChatMessage>();
  messageReceived = output<ChatMessage>();
  error = output<Error>();
  citationClicked = output<Citation>();

  currentMessage = '';
  messages: ChatMessage[] = [];
  isLoading = false;
  errorMessage?: string;
  currentConversation?: ChatConversation;
  currentDate = new Date();

  selectedCitation?: SelectedCitation;
  isSidebarOpen = false;
  sidebarView: 'list' | 'document' = 'list';
  availableCitations: (Citation & { messageIndex: number; displayId: string })[] = [];

  private destroy$ = new Subject<void>();
  private errorTimeout?: any;

  constructor(
    private chatService: AiChatService,
  ) { }

  ngOnInit(): void {
    this.chatService.setBaseUrl(this.config().apiConfig.baseUrl);

    this.currentConversation = {
      id: this.generateId(),
      title: 'AI Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    if (this.selectedCitation?.blobUrl) {
      URL.revokeObjectURL(this.selectedCitation.blobUrl);
    }
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const messageContent = this.currentMessage.trim();
    this.currentMessage = '';

    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
    };

    const request: ChatRequest = {
      message: messageContent,
      conversation_history: this.messages,
      use_rag: false,
    };

    this.addMessage(userMessage);
    this.messageSent.emit(userMessage);

    this.isLoading = true;

    if (this.config().enableStreaming) {
      this.sendStreamingMessage(request);
    } else {
      this.sendStandardMessage(request);
    }
  }


  private sendStandardMessage(request: ChatRequest): void {
    this.chatService
      .chat(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const aiMessage: ChatMessage = {
            id: this.generateId(),
            content: response.message,
            role: 'assistant',
            timestamp: new Date(),
            citations: response.citations,
          };
          this.addMessage(aiMessage);
          this.messageReceived.emit(aiMessage);
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.setErrorMessage(err.message);
          this.error.emit(err);
          console.error('Error sending message:', err);
        },
      });
  }


  private sendStreamingMessage(request: ChatRequest): void {

    const aiMessage: ChatMessage = {
      id: this.generateId(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
    };
    this.addMessage(aiMessage);

    this.chatService
      .chatStream(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.content) {
              aiMessage.content += parsed.content;
              this.updateMessage(aiMessage);
            }
            if (parsed.citations) {
              aiMessage.citations = parsed.citations;
              this.updateMessage(aiMessage);
            }
          } catch (e) {
            console.error('Error parsing streaming data:', e);
          }
        },
        complete: () => {
          aiMessage.isStreaming = false;
          this.updateMessage(aiMessage);
          this.messageReceived.emit(aiMessage);
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.setErrorMessage(err.message);
          this.error.emit(err);
          console.error('Error streaming message:', err);
        },
      });
  }


  onSendMessage(event: any): void {
    if (event.message && event.message.trim()) {
      this.currentMessage = event.message.trim();
      this.sendMessage();
    }
  }

  clearConversation(): void {
    this.currentConversation = {
      id: this.generateId(),
      title: 'AI Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.messages = [];
    this.errorMessage = undefined;
    this.updateAvailableCitations();
  }


  private addMessage(message: ChatMessage): void {
    if (this.currentConversation) {
      this.currentConversation.messages.push(message);
      this.currentConversation.updatedAt = new Date();
      this.messages = [...this.currentConversation.messages];
      this.updateAvailableCitations();
    }
  }

  private updateMessage(message: ChatMessage): void {
    if (this.currentConversation) {
      const index = this.currentConversation.messages.findIndex((m) => m.id === message.id);
      if (index !== -1) {
        this.currentConversation.messages[index] = { ...message };
        this.messages = [...this.currentConversation.messages];
        this.updateAvailableCitations();
      }
    }
  }


  private updateAvailableCitations(): void {
    const allCitations = new Map<string, Citation & { messageIndex: number; displayId: string }>();
    let assistantMessageIndex = 0;
    this.messages.forEach((message) => {
      if (message.role === 'assistant') {
        assistantMessageIndex++;
        if (message.citations) {
          message.citations.forEach((citation) => {
            const uniqueKey = `${assistantMessageIndex}.${citation.citation_id}`;
            if (!allCitations.has(uniqueKey)) {
              allCitations.set(uniqueKey, {
                ...citation,
                messageIndex: assistantMessageIndex,
                displayId: `${assistantMessageIndex}.${citation.citation_id}`
              });
            }
          });
        }
      }
    });

    this.availableCitations = Array.from(allCitations.values());
  }

 
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    if (this.isSidebarOpen) {
      this.sidebarView = 'list';
      this.updateAvailableCitations();
    }
  }


  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }


  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  getMessageClass(message: ChatMessage): string {
    const classes = ['message', `message-${message.role}`];

    if (message.isStreaming) {
      classes.push('streaming');
    }

    if (this.config().customClasses) {
      if (message.role === 'user' && this.config().customClasses?.messageUser) {
        classes.push(this.config().customClasses!.messageUser!);
      }
      if (message.role === 'assistant' && this.config().customClasses?.messageAssistant) {
        classes.push(this.config().customClasses!.messageAssistant!);
      }
    }

    return classes.join(' ');
  }

  /**
   * Set error message with auto-clear after 5 seconds
   */
  private setErrorMessage(message: string): void {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    this.errorMessage = message;

    this.errorTimeout = setTimeout(() => {
      this.errorMessage = undefined;
      this.errorTimeout = undefined;
    }, 5000);
  }


  onCitationClick(citation: Citation): void {
    this.citationClicked.emit(citation);
    this.isSidebarOpen = true;

    this.selectCitationFromList(citation);
  }


  selectCitationFromList(citation: Citation): void {
    this.citationClicked.emit(citation);

    this.selectedCitation = {
      citation,
      isLoading: true
    };
    this.sidebarView = 'document';

    const filename = citation.metadata?.filename || citation.title;

    this.chatService
      .downloadBlob(filename)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          if (this.selectedCitation) {
            const blobUrl = URL.createObjectURL(blob);
            this.selectedCitation = {
              ...this.selectedCitation,
              blobUrl,
              isLoading: false,
            };
          }
        },
        error: (err) => {
          console.error('Error downloading blob:', err);
          if (this.selectedCitation) {
            this.selectedCitation = {
              ...this.selectedCitation,
              isLoading: false,
              error: `Failed to load document: ${err.message || 'Unknown error'}`,
            };
          }
        },
      });
  }


  backToList(): void {
    if (this.selectedCitation?.blobUrl) {
      URL.revokeObjectURL(this.selectedCitation.blobUrl);
    }
    this.sidebarView = 'list';
    this.selectedCitation = undefined;
  }

 
  closeSidebar(): void {
    if (this.selectedCitation?.blobUrl) {
      URL.revokeObjectURL(this.selectedCitation.blobUrl);
    }
    this.isSidebarOpen = false;
    this.sidebarView = 'list';
    this.selectedCitation = undefined;
  }


  getViewerStartPage(): number {
    if (this.selectedCitation?.citation.citation_location?.length) {
      const firstPage = parseInt(this.selectedCitation.citation.citation_location[0], 10);
      return isNaN(firstPage) ? 1 : firstPage;
    }
    return 1;
  }


  getFileType(): string {
    return this.selectedCitation?.citation.file_type?.toLowerCase() || '';
  }


  isPdf(): boolean {
    return this.getFileType() === 'pdf';
  }


  isWord(): boolean {
    const type = this.getFileType();
    return type === 'docx' || type === 'doc';
  }


  isExcel(): boolean {
    const type = this.getFileType();
    return type === 'xlsx' || type === 'xls';
  }


  isImage(): boolean {
    const type = this.getFileType();
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(type);
  }


  onViewerError(error: string): void {
    if (this.selectedCitation) {
      this.selectedCitation = {
        ...this.selectedCitation,
        error,
      };
    }
  }
}
