import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { Citation } from '../../../types/ai-chat/ai-chat.types';

@Component({
  selector: 'message-with-citations',
  standalone: true,
  imports: [CommonModule, NbButtonModule, NbIconModule],
  templateUrl: './message-with-citations.component.html',
  styleUrls: ['./message-with-citations.component.scss']
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
