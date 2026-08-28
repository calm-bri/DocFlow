# DocFlow Submission

## Included

- Source code (Frontend & Backend)
- README.md
- ARCHITECTURE.md
- AI_WORKFLOW.md
- SUBMISSION.md
- walkthrough-url.txt
- Automated access-control tests
- SQLite test seeds and Prisma migrations

## Live Product

**Frontend (Vercel)**: [ADD URL]  
**Backend (Render)**: [ADD URL]  

## Demo Users

Switch between these via the sidebar dropdown:
- **Alice Johnson** (alice@docflow.demo) - Primary document creator
- **Bob Smith** (bob@docflow.demo) - Frequently an Editor
- **Carol Davis** (carol@docflow.demo) - Independent collaborator

## Core Functionality

- Document creation, editing, and renaming.
- Rich-text formatting (Bold, Italic, Headings, Lists).
- Markdown & Text file import.
- Debounced autosave with real-time UI indicators.
- Document ownership logic.
- Role-based document sharing (VIEWER vs EDITOR).
- Dashboard filtering (My Documents vs Shared With Me).

## Stretch Features

**Real-Time Collaboration**
- Live document updates via Socket.IO.
- Active Collaborator Presence avatars and connection badges.
- Permission-aware room connections (preventing unauthorized users from snooping traffic).
- Graceful client degradation (instant lock-out if a user's permissions are revoked mid-edit).

## Known Limitations

- **Last-Write-Wins**: Resolving conflicting edits between two simultaneous users relies on the final network request rather than operational transformation.
- **Mock Authentication**: Real JWT/OAuth flows were swapped for an easy-to-use persona switcher to facilitate rapid permission testing.

## What I Would Build Next With 2–4 Hours

- **Yjs/CRDT Synchronization**: Swapping the manual Socket.IO broadcasts for TipTap's native Yjs extension to support flawless offline-capable, conflict-free resolution.
- **Collaborative Cursors**: Showing exactly where other users are typing in the document in real-time.
- **Version History**: Saving document snapshots to restore previous iterations.
- **DOCX Import/Export**: Using `mammoth.js` to process MS Word documents natively.
- **Comments & Mentions**: Allowing inline annotations without modifying the core document content.
