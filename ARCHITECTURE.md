# DocFlow Architecture

## System Overview

DocFlow is a full-stack collaborative workspace application built as a client-server architecture. The frontend is a React single-page application communicating with an Express/Node.js backend through REST APIs for data persistence and Socket.IO WebSockets for bi-directional real-time collaboration.

```
React/Vite Client
        |
        | REST API + Socket.IO
        v
Express + Socket.IO Server
        |
        v
Prisma ORM
        |
        v
PostgreSQL
```

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Rich-Text Editor**: TipTap (built on ProseMirror)
- **Real-Time Client**: Socket.IO Client
- **Styling**: Tailwind CSS & Lucide React icons
- **HTTP Client**: Axios

### Backend
- **Runtime & Framework**: Node.js & Express with TypeScript
- **Real-Time Engine**: Socket.IO Server
- **ORM & Data Layer**: Prisma ORM
- **Database**: PostgreSQL
- **Testing**: Jest & Supertest for access control and integration tests

### Persistence
- **Database Engine**: PostgreSQL
- **Storage Format**: TipTap JSON document structure (stored in structured format to prevent markup corruption and preserve rich-text hierarchy)

---

## Core Subsystems & Data Flow

### 1. Document Storage & TipTap JSON
Document bodies are stored strictly as structured TipTap JSON trees within PostgreSQL rather than raw HTML or unescaped markdown. This ensures:
- Safe rendering without XSS vulnerabilities.
- Format integrity across client reloads and updates.
- Predictable serialization during import and real-time broadcast.

### 2. Debounced Autosave Pipeline
1. As the user edits, a local React ref tracks document state and marks the status as `dirty`.
2. A debounced timer (~800ms) batches continuous keystrokes.
3. Upon timer expiry, an HTTP `PUT` request is dispatched to the backend REST API.
4. If a save is already in-flight, subsequent keystrokes queue a pending save to guarantee that the final state on disk matches the editor state.
5. In the event of a 403 Forbidden response (e.g. permission revoked while editing), the client immediately transitions to read-only mode.

### 3. File Import Engine
- Accepts `.txt` (plain text) and `.md` (Markdown) file uploads.
- The server-side and client parsers transform raw text/markdown into structured TipTap JSON nodes before creating the database record, maintaining heading levels, lists, and formatting.

### 4. Role-Based Access Control (RBAC)
DocFlow enforces three distinct permission levels calculated at both the REST API and Socket.IO layer:
- **OWNER**: Full administrative control (editing, renaming, sharing, deleting).
- **EDITOR**: Can edit document content and broadcast updates in real-time.
- **VIEWER**: Can join the real-time room to observe live updates, but is strictly prohibited from emitting changes or invoking mutation endpoints.

Access verification is centralized in server-side authorization middleware (`accessControl.ts`), validating permissions on every database lookup and socket room connection.

### 5. Real-Time Collaboration & Presence
- **Room Isolation**: Each document has an isolated Socket.IO room (`document:<id>`).
- **Authorization on Connect**: When a user connects to a room, the server verifies their database read permission before joining the socket to the room.
- **Live Event Synchronization**: When an editor modifies text, `document:update` events broadcast changes to all other active peers in the room. A loop-prevention mechanism ensures incoming remote changes are applied to the local TipTap instance without re-triggering outgoing socket emissions or autosave calls.
- **Presence Tracking**: The server maintains in-memory collaborator maps per room, emitting updated `document:presence` lists on connect, disconnect, or page departure.

---

## Key Prioritization Decisions

1. **Rich-Text Quality Over Feature Overload**: Focused on a polished, responsive TipTap editing experience (headings, lists, inline styling) over attempting to clone every secondary Google Docs feature.
2. **TipTap JSON Serialization**: Chose structured JSON over raw HTML strings to ensure data consistency and prevent serialization bugs.
3. **Strict Server-Side Enforcement**: Permissions are validated at the server boundary on every REST endpoint and WebSocket event rather than relying solely on UI-level hiding.
4. **Socket.IO for Real-Time Synchronization**: Implemented Socket.IO for low-latency bi-directional messaging with built-in room management and presence tracking.
5. **Last-Write-Wins Concurrency**: Selected an event-based last-write-wins model to deliver a reliable, robust real-time experience within a clean architectural footprint.

---

## Known Limitations & Scope Cuts

### Conflict Resolution Strategy (Last-Write-Wins)
DocFlow intentionally does not implement Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs) such as Yjs. If two collaborators rapidly modify the exact same sentence or block at the precise same millisecond, the most recently received update will overwrite competing changes. 

### Scope Boundaries
The goal of DocFlow was to build a reliable, high-integrity collaborative product slice within project constraints rather than an exhaustive Google Docs clone. Intentional scope cuts include:
- Collaborative cursors and character-by-character selection highlights.
- Document revision history and restore snapshots.
- Inline comment threads and suggestion mode.
- Enterprise multi-tenant authentication (OAuth2/SSO), opting instead for a pre-seeded persona switcher for fast evaluation.
