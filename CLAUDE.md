# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Angular 19 AI chat application with document citation and retrieval capabilities. Uses Nebular UI framework with standalone components pattern.

## Commands

```bash
# Development server (http://localhost:4200)
npm start

# Production build (outputs to dist/ai-chat-app/)
npm run build

# Development build with watch mode
npm run watch

# Run tests
npm test

# Angular CLI commands
npm run ng -- <command>
```

## Architecture

### Component Structure
- **amital-ai-chat** - Main chat interface with citation sidebar, handles streaming/non-streaming modes
- **amital-pdf-viewer** - PDF document viewer with zoom/rotation
- **amital-word-viewer** - DOCX rendering via docx-preview
- **amital-excel-viewer** - Spreadsheet display via xlsx
- **amital-image-viewer** - Native image rendering

### Service Layer
- **ai-chat.service.ts** - Chat API communication, supports standard HTTP and SSE streaming, blob downloads

### Key Types (src/app/types/ai-chat/)
- `AmitalChatConfig` - Component configuration (API settings, UI options)
- `ChatMessage` - Message with role, content, citations, timestamp
- `Citation` - Document source metadata

### API Configuration
Backend expected at `http://localhost:8000` with endpoints:
- POST `/chat` - Standard chat request
- POST `/chat/stream` - SSE streaming
- GET `/download/:blobName` - Document download

## Code Patterns

- All components use `standalone: true` with Angular 16+ signal-based `input()`/`output()` functions
- RxJS `takeUntil()` pattern for subscription cleanup
- `DomSanitizer.bypassSecurityTrustHtml()` for citation link rendering
- `URL.revokeObjectURL()` cleanup for blob URLs
- RTL text detection via Hebrew character regex
- Component prefix: `app`
- Strict TypeScript with strict templates enabled

## Styling

SCSS with Nebular theme integration. Key CSS variables:
- `--card-background-color`, `--border-basic-color-3`
- `--color-primary-default`, `--text-basic-color`
- `--color-danger-600`
