import { Component } from '@angular/core';
import { NbLayoutModule } from '@nebular/theme';
import { AmitalAiChatComponent } from './components/amital-ai-chat/amital-ai-chat.component';
import { AmitalChatConfig } from './types/ai-chat/ai-chat.types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NbLayoutModule, AmitalAiChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  chatConfig: AmitalChatConfig = {
    apiConfig: {
      baseUrl: 'http://localhost:8000', // Change this to your API URL
      useRagByDefault: false,
    },
    placeholder: 'Type a message...',
    showTimestamps: true,
    enableStreaming: false,
    enableRag: false,
    showCitations: true,
  };
}
