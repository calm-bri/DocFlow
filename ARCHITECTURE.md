# Architecture Overview

## System Overview
DocFlow is a monolithic full-stack SPA split into a React frontend and an Express/Node backend, communicating via REST for persistence and Socket.IO for real-time collaboration.

### Frontend
- **Framework**: React + TypeScript (Vite)
- **Routing**: React Router
- **Editor**: TipTap (ProseMirror based)
- **Styling**: Tailwind CSS
- **Network**: Axios for REST APIs, Socket.IO client for live updates

### Backend
- **Framework**: Node.js + Express
- **Database**: PostgreSQL (Prisma ORM)
- **Live Sync**: Socket.IO server bound to the HTTP server
- **Validation**: TypeScript and strict logic boundaries

## Core Subsystems

### Rich Text Storage
Documents are stored strictly as structured TipTap JSON trees within the PostgreSQL database (`content` column). This prevents malformed HTML strings from breaking the editor and ensures a strict data model.

### Autosave
A React `useCallback` debounced by ~800ms tracks keystrokes and automatically issues `PUT` requests to the REST API, avoiding overwhelming the database while maintaining high durability.

### File Import
Server-side parsing converts standard `.txt` and `.md` files into valid TipTap JSON structures before creating the document record.

### Authorization
- Handled at the REST API boundary via strict ownership and sharing lookups (`server/src/services/accessControl.ts`).
- Handled at the Socket.IO layer during room connection and before broadcasting updates.
- Dynamic permissions (demotion to VIEWER) are gracefully handled when autosave fails with a 403 Forbidden, forcing the frontend to lock immediately.

### Real-Time Collaboration
- **Socket.IO Rooms**: Every document has a unique room (`document:<id>`).
- **Authorization**: Clients request to join a room, and the server validates read permissions against the database before adding the socket.
- **Sync**: Clients emit `document:update` containing `content` and/or `title`. The server relays this to the room after verifying `canEdit` and `isOwner` properties.
- **Presence**: The server aggregates connected sockets into a list of active `CollaboratorUser` objects, emitting `document:presence` dynamically.

### What I Prioritized
- Core document editing experience (clean UI, standard formatting).
- Reliable persistence (debounced autosave).
- Clear sharing behavior and strict permission enforcement.
- Practical real-time collaboration that guarantees immediate visual updates.

### What I Intentionally Deprioritized (Last-Write-Wins Tradeoff)
To keep the scope realistic while meeting deployment constraints, the collaboration model utilizes a deliberately scoped **last-write-wins** strategy.
- **CRDT (Conflict-free Replicated Data Types)**
- **Operational Transformation**
- **Collaborative cursors**
- **Full version history**
- **Comments**
- **DOCX import/export**
- **Production authentication (OAuth/JWT)** — A mock persona switcher was used for demonstration.
