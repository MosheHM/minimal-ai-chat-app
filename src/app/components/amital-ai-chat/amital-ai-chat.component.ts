import { Component, OnInit, OnDestroy, input, output, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NbChatModule, NbIconModule, NbButtonModule, NbSpinnerModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { Subject, takeUntil } from 'rxjs';
import {
  AmitalChatConfig,
  ChatMessage,
  ChatConversation,
  Citation,
  SelectedCitation,
} from '../../types/ai-chat/ai-chat.types';
import { AiChatService } from '../../services/ai-chat/ai-chat.service';
import { AmitalPdfViewerComponent } from '../amital-pdf-viewer/amital-pdf-viewer.component';
import { AmitalWordViewerComponent } from '../amital-word-viewer/amital-word-viewer.component';
import { AmitalExcelViewerComponent } from '../amital-excel-viewer/amital-excel-viewer.component';
import { AmitalImageViewerComponent } from '../amital-image-viewer/amital-image-viewer.component';

/**
 * Amital AI Chat Component
 * A standalone chat interface component for AI conversations
 */
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
    AmitalImageViewerComponent
  ],
  templateUrl: './amital-ai-chat.component.html',
  styleUrls: ['./amital-ai-chat.component.scss'],
})
export class AmitalAiChatComponent implements OnInit, OnDestroy {
  // Inputs
  config = input.required<AmitalChatConfig>();
  height = input<string>('600px');
  width = input<string>('100%');

  // Host bindings for dimensions
  @HostBinding('style.height') get hostHeight(): string {
    return this.height();

  }
  @HostBinding('style.width') get hostWidth(): string {
    return this.width();
  }
  @HostBinding('style.display') hostDisplay = 'block';

  // Outputs
  messageSent = output<ChatMessage>();
  messageReceived = output<ChatMessage>();
  error = output<Error>();
  citationClicked = output<Citation>();

  // Component state
  currentMessage = '';
  messages: ChatMessage[] = [];
  isLoading = false;
  errorMessage?: string;
  currentConversation?: ChatConversation;
  currentDate = new Date();

  // Citation sidebar state
  selectedCitation?: SelectedCitation;
  isSidebarOpen = false;
  sidebarView: 'list' | 'document' = 'list';
  availableCitations: Citation[] = [];

  private destroy$ = new Subject<void>();
  private errorTimeout?: any;

  constructor(
    private chatService: AiChatService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    // Initialize the chat service with API config
    this.chatService.setBaseUrl(this.config().apiConfig.baseUrl);

    // Initialize conversation
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
    // Cleanup blob URL
    if (this.selectedCitation?.blobUrl) {
      URL.revokeObjectURL(this.selectedCitation.blobUrl);
    }
  }

  /**
   * Send a message
   */
  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const messageContent = this.currentMessage.trim();
    this.currentMessage = '';

    // Create user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
    };

    // Add user message to conversation
    this.addMessage(userMessage);
    this.messageSent.emit(userMessage);

    // Set loading state
    this.isLoading = true;

    const useRag = false;
    // const useRag = this.config().enableRag ?? this.config().apiConfig.useRagByDefault ?? true;

    // Prepare request
    const request: { message: string; conversation_history?: ChatMessage[]; use_rag?: boolean } = {
      message: messageContent,
      conversation_history: this.messages.slice(0, -1), // Exclude the message just added
      use_rag: useRag,
    };

    // Check if streaming is enabled
    if (this.config().enableStreaming) {
      this.sendStreamingMessage(request);
    } else {
      this.sendStandardMessage(request);
    }
  }

  /**
   * Send standard (non-streaming) message
   */
  private sendStandardMessage(request: {
    message: string;
    conversation_history?: ChatMessage[];
    use_rag?: boolean;
  }): void {
    this.chatService
      .chat(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Chat response received:', response);
          console.log('Citations in response:', response.citations);

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

  /**
   * Send streaming message
   */
  private sendStreamingMessage(request: {
    message: string;
    conversation_history?: ChatMessage[];
    use_rag?: boolean;
  }): void {
    // Create placeholder AI message
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

  /**
   * Handle message sent from Nebular chat form
   */
  onSendMessage(event: any): void {
    if (event.message && event.message.trim()) {
      this.currentMessage = event.message.trim();
      this.sendMessage();
    }
  }

  /**
   * Clear the current conversation
   */
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

  /**
   * Add message to conversation
   */
  private addMessage(message: ChatMessage): void {
    if (this.currentConversation) {
      this.currentConversation.messages.push(message);
      this.currentConversation.updatedAt = new Date();
      this.messages = [...this.currentConversation.messages];
      this.updateAvailableCitations();
    }
  }

  /**
   * Update message in conversation
   */
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

  /**
   * Update the list of available citations from all messages
   */
  private updateAvailableCitations(): void {
    const allCitations = new Map<string, Citation>();

    this.messages.forEach((message) => {
      if (message.citations) {
        message.citations.forEach((citation) => {
          // Use id (source doc id) for deduplication
          if (!allCitations.has(citation.id)) {
            allCitations.set(citation.id, citation);
          }
        });
      }
    });

    this.availableCitations = Array.from(allCitations.values());
  }

  /**
   * Toggle the citation sidebar
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    if (this.isSidebarOpen) {
      this.sidebarView = 'list';
      this.updateAvailableCitations();
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Track by function for messages
   */
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  /**
   * Get CSS class for message
   */
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
    // Clear any existing timeout
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    this.errorMessage = message;

    // Auto-clear after 5 seconds
    this.errorTimeout = setTimeout(() => {
      this.errorMessage = undefined;
      this.errorTimeout = undefined;
    }, 5000);
  }

  /**
   * Handle citation click - opens sidebar with citation list
   */
  onCitationClick(citation: Citation): void {
    console.log('onCitationClick called', { citation });

    this.citationClicked.emit(citation);

    // Open sidebar
    this.isSidebarOpen = true;

    // Select the citation and show document
    this.selectCitationFromList(citation);
  }

  /**
   * Select a citation from the list and load the document
   */
  selectCitationFromList(citation: Citation): void {
    this.citationClicked.emit(citation);

    // Set loading state
    this.selectedCitation = {
      citation,
      isLoading: true,
    };
    this.sidebarView = 'document';

    // Get the filename from metadata
    const filename = citation.metadata?.filename || citation.title;

    // Download the blob content
    this.chatService
      .downloadBlob(filename)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          if (this.selectedCitation) {
            // Create a blob URL from the downloaded content
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

  /**
   * Go back to citation list from document view
   */
  backToList(): void {
    // Cleanup blob URL
    if (this.selectedCitation?.blobUrl) {
      URL.revokeObjectURL(this.selectedCitation.blobUrl);
    }
    this.sidebarView = 'list';
    this.selectedCitation = undefined;
  }

  /**
   * Close the citation sidebar completely
   */
  closeSidebar(): void {
    // Cleanup blob URL
    if (this.selectedCitation?.blobUrl) {
      URL.revokeObjectURL(this.selectedCitation.blobUrl);
    }
    this.isSidebarOpen = false;
    this.sidebarView = 'list';
    this.selectedCitation = undefined;
    // We don't clear availableCitations anymore as they are global
  }

  /**
   * Check if text contains Hebrew characters
   */
  public hasHebrew(text: string): boolean {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  }

  /**
   * Parse message content to make citation references clickable
   * Converts [1], [2], etc. to clickable links
   * Supports bold text with **text** syntax
   */
  parseMessageWithCitations(content: string, citations?: Citation[]): SafeHtml {
    let parsed = content;

    // Replace citations [1], [2], etc. with clickable links
    if (citations && citations.length > 0) {
      const citationMap = new Map<string, Citation>();
      citations.forEach((c) => citationMap.set(c.citation_id, c));

      parsed = parsed.replace(/\[(\d+)\]/g, (match, num) => {
        const citation = citationMap.get(num);
        if (citation) {
          return `<a href="javascript:void(0)" class="citation-link" data-citation-id="${num}" title="${this.escapeHtml(citation.title)}">[${num}]</a>`;
        }
        return match;
      });
    }

    return this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(parsed, true));
  }

  /**
   * Escape HTML special characters and apply markdown formatting
   */
  private escapeHtml(text: string, preserveLinks = false): string {
    if (preserveLinks) {
      // First escape everything except our citation links
      const linkPlaceholder = '___CITATION_LINK___';
      const boldPlaceholder = '___BOLD_TEXT___';
      const links: string[] = [];
      const boldTexts: string[] = [];

      // Extract links
      let result = text.replace(/<a[^>]*class="citation-link"[^>]*>\[(\d+)\]<\/a>/g, (match) => {
        links.push(match);
        return linkPlaceholder;
      });

      // Extract bold text with **text** syntax
      result = result.replace(/\*\*(.+?)\*\*/g, (match, content) => {
        boldTexts.push(`<strong>${content}</strong>`);
        return boldPlaceholder;
      });

      // Escape the rest
      result = result
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');

      // Restore bold texts
      boldTexts.forEach((bold) => {
        result = result.replace(boldPlaceholder, bold);
      });

      // Restore links
      links.forEach((link) => {
        result = result.replace(linkPlaceholder, link);
      });

      return result;
    }

    // For non-preserve mode, still support bold and line breaks
    let result = text;

    // Extract bold text before escaping
    const boldPlaceholder = '___BOLD_TEXT___';
    const boldTexts: string[] = [];

    result = result.replace(/\*\*(.+?)\*\*/g, (match, content) => {
      boldTexts.push(content);
      return boldPlaceholder;
    });

    // Escape HTML
    result = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');

    // Restore bold with proper tags
    boldTexts.forEach((content) => {
      result = result.replace(boldPlaceholder, `<strong>${content}</strong>`);
    });

    return result;
  }

  /**
   * Handle click on citation link in message
   */
  handleCitationLinkClick(event: Event, message: ChatMessage): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('citation-link')) {
      event.preventDefault();
      const citationId = target.getAttribute('data-citation-id');
      if (citationId && message.citations) {
        const citation = message.citations.find((c) => c.citation_id === citationId);
        if (citation) {
          this.onCitationClick(citation);
        }
      }
    }
  }

  /**
   * Get the starting page for the viewer from citation locations
   */
  getViewerStartPage(): number {
    if (this.selectedCitation?.citation.citation_location?.length) {
      const firstPage = parseInt(this.selectedCitation.citation.citation_location[0], 10);
      return isNaN(firstPage) ? 1 : firstPage;
    }
    return 1;
  }

  /**
   * Get file type for viewer selection
   */
  getFileType(): string {
    return this.selectedCitation?.citation.file_type?.toLowerCase() || '';
  }

  /**
   * Check if file is a PDF
   */
  isPdf(): boolean {
    return this.getFileType() === 'pdf';
  }

  /**
   * Check if file is a Word document
   */
  isWord(): boolean {
    const type = this.getFileType();
    return type === 'docx' || type === 'doc';
  }

  /**
   * Check if file is an Excel document
   */
  isExcel(): boolean {
    const type = this.getFileType();
    return type === 'xlsx' || type === 'xls';
  }

  /**
   * Check if file is an image
   */
  isImage(): boolean {
    const type = this.getFileType();
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(type);
  }

  /**
   * Handle viewer load error
   */
  onViewerError(error: string): void {
    if (this.selectedCitation) {
      this.selectedCitation = {
        ...this.selectedCitation,
        error,
      };
    }
  }
}
