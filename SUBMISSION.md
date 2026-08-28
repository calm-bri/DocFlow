# DocFlow Submission

## 🚀 Live Product

- **Frontend Application**: [https://client-brijesh22.vercel.app](https://client-brijesh22.vercel.app)
- **Backend API**: [https://docflow-b4fh.onrender.com](https://docflow-b4fh.onrender.com)

> **Note on Free-Tier Hosting**: The backend is hosted on Render's free tier. If the service is waking from idle sleep, please allow ~30–50 seconds on the initial request.

---

## 💻 Source Code

- **GitHub Repository**: [https://github.com/calm-bri/DocFlow](https://github.com/calm-bri/DocFlow)

---

## 📦 Included Materials

- **Full Application Source Code** (Client & Server)
- **[README.md](file:///README.md)** (Project overview, quick start, local setup, testing guide)
- **[ARCHITECTURE.md](file:///ARCHITECTURE.md)** (System architecture, diagrams, technology choices, trade-offs)
- **[AI_WORKFLOW.md](file:///AI_WORKFLOW.md)** (AI pairing workflow, modifications, testing methodology)
- **Automated Integration & Access-Control Tests** (`tests/`)
- **Prisma Schema & Database Seed Data** (`prisma/`)
- **Render Deployment Configuration** (`render.yaml`)
- **Vercel Deployment Configuration** (`client/vercel.json`)
- **[walkthrough-url.txt](file:///walkthrough-url.txt)** (Walkthrough video link reference)

---

## 👥 Demo Users

The application provides a seeded demo persona switcher in the sidebar to make evaluating sharing permissions, document ownership, and real-time collaboration instant and seamless without requiring email verification:

- **Alice Johnson** — `alice@docflow.demo` (Primary document creator and owner)
- **Bob Smith** — `bob@docflow.demo` (Collaborator / Editor)
- **Carol Davis** — `carol@docflow.demo` (Collaborator / Viewer)

---

## ✅ What Works (Completed Features)

- **Document Creation & Renaming**:
  - Instant blank document creation.
  - Inline title renaming with debounced autosave.
  - Separate dashboard views for owned documents vs documents shared with the user.
- **Rich-Text TipTap Editor**:
  - Bold, Italic, Underline formatting.
  - Heading 1 and Heading 2 structure.
  - Bulleted and numbered lists.
  - Paragraph formatting.
- **Persistence & Debounced Autosave**:
  - Structured TipTap JSON tree persistence in PostgreSQL.
  - Debounced autosave (~800ms) with visual status indicator (Saved, Saving, Unsaved, Error).
  - Resilient save queue preventing dropped keystrokes during network latency.
- **File Import**:
  - Importing `.txt` (plain text) and `.md` (Markdown) files into structured TipTap documents.
- **Granular Role-Based Access Control**:
  - **OWNER**: Full document privileges, document sharing management, inline renaming.
  - **EDITOR**: Real-time content editing with autosave and live broadcasting.
  - **VIEWER**: Read-only access; editing controls are disabled, and mutation attempts return 403 Forbidden.
  - Server-side access enforcement across both REST APIs and Socket.IO connections.
- **Real-Time Collaboration via Socket.IO**:
  - Bi-directional live sync of document content across connected clients.
  - Real-time collaborator presence indicators and active connection status badges.
  - Automatic loop-prevention to prevent duplicate broadcast loops.

---

## ⚠️ Known Limitations / Intentional Scope Cuts

- **Concurrency Model (Last-Write-Wins)**: Collaboration uses an event-based last-write-wins model. DocFlow intentionally does not implement Operational Transformation (OT) or CRDT algorithms; concurrent edits to the same content block resolve to the latest received update.
- **Demo Persona Authentication**: A lightweight persona switcher is used in place of production OAuth2/JWT authentication to streamline evaluation.
- **Render Free-Tier Wakeup**: Cold starts on Render may cause a brief initial delay before the backend services are warm.
- **Collaborative Cursors**: In-editor caret tracking for remote users is not included in this release.

---

## 🔮 What I Would Build Next With Another 2–4 Hours

1. **CRDT-Based Conflict Resolution**: Implement Yjs (`y-prosemirror` / `y-webrtc` / `y-websocket`) for true character-level, conflict-free collaborative editing and offline sync.
2. **Production Authentication**: Add OAuth2 (Google / GitHub) or secure JWT auth with email verification and session management.
3. **Document Version History**: Track document snapshots over time with the ability to view diffs and restore previous revisions.
4. **Granular Sharing Management**: Add link-based sharing with tokenized access, expirations, and transfer of ownership.
5. **Comments & Suggestion Mode**: Support inline commenting threads, user mentions (@username), and non-destructive suggestion markups.
