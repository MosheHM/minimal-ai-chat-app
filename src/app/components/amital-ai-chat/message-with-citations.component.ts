import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { Citation } from '../../types/ai-chat/ai-chat.types';

@Component({
  selector: 'message-with-citations',
  standalone: true,
  imports: [CommonModule, NbButtonModule, NbIconModule],
  template: `
    <div
      class="message-with-citations"
      [ngClass]="hasHebrew(content) ? 'rtl-text' : 'ltr-text'"
      [innerHTML]="formattedContent"
    ></div>
  `,
  styles: [`
    .message-with-citations {
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .rtl-text {
      direction: rtl;
      text-align: right;
    }

    .ltr-text {
      direction: ltr;
      text-align: left;
    }

    :host ::ng-deep .citation-btn {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 1px 6px;
      margin: 0 2px;
      font-size: 0.85em;
      font-weight: 600;
      color: #0095ff;
      background-color: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 4px;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.2s ease;
      vertical-align: baseline;
      position: relative;
      z-index: 1;
    }

    :host ::ng-deep .citation-btn:hover {
      background-color: #bbdefb;
      border-color: #64b5f6;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }

    :host ::ng-deep .citation-btn:active {
      transform: translateY(0);
    }
  `]
})
export class MessageWithCitationsComponent {
  @Input() content: string = '';
  @Input() citations?: Citation[];
  @Output() citationClick = new EventEmitter<Citation>();

  constructor(private sanitizer: DomSanitizer) {}

  get formattedContent(): SafeHtml {
    let formatted = this.content;

    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    formatted = formatted.replace(/\n/g, '<br>');


    if (this.citations && this.citations.length > 0) {
      const citationMap = new Map<string | number, Citation>();
      this.citations.forEach(c => {
        citationMap.set(c.citation_id, c);
        citationMap.set(String(c.citation_id), c);
      });

      formatted = formatted.replace(/\[(\d+)\]/g, (match, num) => {

        let citation = citationMap.get(num) || citationMap.get(Number(num));
        if (citation) {
          return `<span class="citation-btn" data-citation-id="${num}" title="${this.escapeHtml(citation.title)}">[${num}]</span>`;
        }
        return match;
      });
    }

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  hasHebrew(text: string): boolean {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  @HostListener('click', ['$event'])
  handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const citationBtn = target.closest('.citation-btn') as HTMLElement;

    if (citationBtn) {
      event.preventDefault();
      event.stopPropagation();

      const citationId = citationBtn.getAttribute('data-citation-id');

      if (citationId && this.citations) {

        const citation = this.citations.find(c =>
          c.citation_id === citationId ||
          c.citation_id === (Number(citationId) as unknown) ||
          String(c.citation_id) === citationId
        );

        if (citation) {
          this.citationClick.emit(citation);
        } else {
          console.warn('Citation not found for ID:', citationId);
        }
      }
    }
  }
}
