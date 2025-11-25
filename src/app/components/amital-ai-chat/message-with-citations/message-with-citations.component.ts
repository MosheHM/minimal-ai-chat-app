import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  get formattedContent(): string {
    let formatted = this.content;
    
    // Apply bold formatting with **text** syntax
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Replace inline citation references [1], [2] with clickable buttons
    // Only for citations that are actually in the message
    if (this.citations && this.citations.length > 0) {
      const citationMap = new Map<string, Citation>();
      this.citations.forEach(c => citationMap.set(c.citation_id, c));
      
      formatted = formatted.replace(/\[(\d+)\]/g, (match, num) => {
        const citation = citationMap.get(num);
        if (citation) {
          return `<span class="citation-btn" data-citation-id="${num}" title="${this.escapeHtml(citation.title)}">[${num}]</span>`;
        }
        return match;
      });
    }
    
    return formatted;
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

  handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('citation-btn')) {
      const citationId = target.getAttribute('data-citation-id');
      if (citationId && this.citations) {
        const citation = this.citations.find(c => c.citation_id === citationId);
        if (citation) {
          this.citationClick.emit(citation);
        }
      }
    }
  }
}
