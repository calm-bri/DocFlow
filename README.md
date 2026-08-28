# DocFlow

A lightweight, full-stack collaborative document workspace designed for high reliability, role-based sharing, and real-time collaboration.

## Live Demo

**Frontend**: [ADD AFTER DEPLOYMENT]  
**Backend**: [ADD AFTER DEPLOYMENT]  

## Features

- **Rich Text Editing**: TipTap editor supporting formatting, headings, and lists.
- **Structured JSON Storage**: Document contents are stored strictly as structured JSON trees in PostgreSQL.
- **Debounced Autosave**: Automatic background saving triggered ~800ms after typing stops.
- **Role-Based Sharing (VIEWER / EDITOR)**: Granular permission enforcement calculated at REST API, Socket.IO, and UI layers.
- **Real-Time Collaboration**: Live synchronisation via Socket.IO, live connection badge, and collaborator presence avatars.
- **Document Import**: Supports importing `.txt` and `.md` files.
- **Demo Persona Switcher**: Instantly switch between Alice, Bob, and Carol to test authorization logic.

## Real-Time Collaboration

- Multiple users can open the same shared document.
- Live updates are delivered using Socket.IO.
- Active collaborator presence is displayed in the header.
- OWNER and EDITOR can edit content and broadcast changes.
- VIEWER can receive live updates but cannot edit.
- Document access is strictly authorized server-side.

**Limitation**: The collaboration model uses a deliberately scoped **last-write-wins** strategy rather than CRDT or operational transformation. Simultaneous conflicting edits may overwrite one another.

## Supported File Types

- `.txt`
- `.md`

## Local Setup

```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Set up environment variables
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env

# Setup database (Requires PostgreSQL locally)
npm run db:push
npm run db:seed

# Start development servers
npm run dev
```

## Environment Variables

### Root (`.env`)
- `DATABASE_URL`: Connection string for PostgreSQL (e.g. `postgresql://user:password@localhost:5432/docflow`).
- `PORT`: Express server port (default `4000`).
- `CLIENT_URL`: Allowed CORS origin for the frontend (default `http://localhost:3000`).

### Client (`client/.env`)
- `VITE_API_URL`: URL to backend REST API.
- `VITE_SOCKET_URL`: URL to Socket.IO backend.

### Server (`server/.env`)
- `PORT`: Explicit server port definition.
- `CLIENT_URL`: Exact client domain for CORS.

## Database Setup

```bash
npm run db:push
npm run db:seed
```

## Demo Users

- **Alice Johnson** (alice@docflow.demo)
- **Bob Smith** (bob@docflow.demo)
- **Carol Davis** (carol@docflow.demo)

## Testing

```bash
npm run test
```

## Real-Time Collaboration Testing

1. Open two browser windows (e.g., standard and incognito).
2. Login as **Alice** in Window A.
3. Open a document and share it with **Bob** as an `EDITOR`.
4. Login as **Bob** in Window B and open the same document.
5. Verify that Bob sees Alice's avatar and connection badge in the header.
6. Edit from Alice's window.
7. Verify Bob receives updates immediately.
8. Edit from Bob's window.
9. Verify Alice receives updates immediately.
10. Change Bob's permission to `VIEWER` and verify Bob's editor locks and he can only view updates.

## Deployment

Frontend (Vercel): [ADD AFTER DEPLOYMENT]  
Backend (Render): [ADD AFTER DEPLOYMENT]
