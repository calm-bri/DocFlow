# DocFlow

A lightweight full-stack collaborative document workspace with rich-text editing, persistence, file import, role-based sharing, and real-time collaboration.

## 🚀 Live Demo

- **Frontend**: [https://client-brijesh22.vercel.app](https://client-brijesh22.vercel.app)
- **Backend API**: [https://docflow-b4fh.onrender.com](https://docflow-b4fh.onrender.com)

> **Note on Render Free Tier**: The backend service is hosted on Render's free tier. If the service has spun down due to inactivity, the initial request or wake-up may take ~30–50 seconds. Subsequent operations are immediate.

---

## ⚡ Quick Start for Reviewers

Follow these steps to evaluate the end-to-end functionality and real-time features in minutes:

1. **Open the live frontend**: Navigate to [https://client-brijesh22.vercel.app](https://client-brijesh22.vercel.app).
2. **Switch between demo users**: Use the user switcher in the sidebar to toggle between seeded personas (**Alice**, **Bob**, and **Carol**).
3. **Open or create a document**: Create a new document or open an existing one from the dashboard.
4. **Share it with another demo user**: Click **Share** (top right) and grant `EDITOR` or `VIEWER` permission to another persona (e.g., share Alice's document with Bob).
5. **Open the same document in another session**: Open a second browser window (e.g., Incognito) and switch to the shared user (Bob).
6. **Test real-time collaboration and permissions**:
   - Type in one window and watch changes appear instantly across both sessions.
   - Observe live collaborator presence badges in the document header.
   - Test changing permission to `VIEWER` to confirm real-time editor lockdown.

---

## 👥 Seeded Demo Accounts

The application uses pre-seeded demo personas with a lightweight persona switcher in the UI for rapid testing of authorization boundaries and role-based sharing:

- **Alice Johnson** — `alice@docflow.demo` (Document creator / primary owner)
- **Bob Smith** — `bob@docflow.demo` (Collaborator / Editor)
- **Carol Davis** — `carol@docflow.demo` (Collaborator / Viewer)

> Authentication is intentionally lightweight with persona switching enabled for evaluation and demonstration purposes.

---

## ✨ Features

- **Document Management**:
  - Create new blank documents with default naming.
  - Rename documents inline with instant debounced persistence.
  - Clear dashboard distinction between **My Documents** (owned) and **Shared with Me** (collaborator access).
- **Rich-Text Editing (TipTap)**:
  - Bold, Italic, and Underline formatting
  - Heading 1 and Heading 2 structure
  - Bulleted lists and numbered lists
  - Normal paragraph styling and placeholder prompts
- **Debounced Autosave & Persistence**:
  - Automatic background persistence to PostgreSQL debounced at ~800ms.
  - Real-time visual status indicator (**Saved**, **Saving...**, **Unsaved**, **Error**).
  - Stored strictly as structured TipTap JSON trees to prevent malformed markup.
- **File Import**:
  - Upload and parse `.txt` and `.md` (Markdown) files directly into TipTap document structures.
- **Role-Based Sharing & Access Control**:
  - **OWNER**: Full control over document content, renaming, sharing, and collaborator permissions.
  - **EDITOR**: Can view and edit content with real-time updates and autosave.
  - **VIEWER**: Read-only access with active real-time viewing; editing controls and typing are strictly disabled.
  - Server-side access enforcement across both REST APIs and Socket.IO connections.
- **Real-Time Collaboration**:
  - Live bi-directional document synchronization using Socket.IO.
  - Real-time collaborator presence indicators and connection status badges.
  - Permission-aware room joins preventing unauthorized listening or emitting.

---

## 🔄 Real-Time Collaboration Model

- Multiple users can view and edit the same shared document simultaneously.
- Real-time events (`document:update` and `document:presence`) are broadcast through Socket.IO rooms.
- **OWNER** and **EDITOR** permissions allow broadcasting updates.
- **VIEWER** connections receive live broadcasts but cannot push modifications.
- **Concurrency Model**: Collaboration uses a deliberately scoped **last-write-wins** strategy. DocFlow intentionally does not implement complex OT (Operational Transformation) or CRDT algorithms; concurrent edits to the same content block will resolve to the most recent update received.

---

## 💻 Local Setup & Development

### Prerequisites
- Node.js (v18+)
- PostgreSQL local instance or hosted connection string

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/calm-bri/DocFlow.git
cd DocFlow

# Install root, client, and server dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 2. Environment Variables

Create environment configuration files from the provided examples:

```bash
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

#### Root (`.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/docflow"
PORT=4000
CLIENT_URL=http://localhost:3000
```

#### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

#### Server (`server/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/docflow"
PORT=4000
CLIENT_URL=http://localhost:3000
```

### 3. Database Setup & Seeding

```bash
# Push Prisma schema to PostgreSQL
npm run db:push

# Seed demo users (Alice, Bob, Carol) and sample documents
npm run db:seed
```

### 4. Run Locally

```bash
# Start both client and server concurrently
npm run dev
```

- Client: `http://localhost:3000`
- Server API: `http://localhost:4000`

---

## 🧪 Testing

### Automated Access-Control & Integration Tests
```bash
npm run test
```

### Manual Real-Time Testing Flow
1. Open two browser windows side by side (e.g. Standard and Incognito).
2. Log in as **Alice** in Window A.
3. Open a document and share it with **Bob** as an `EDITOR`.
4. Log in as **Bob** in Window B and open the shared document from the dashboard.
5. Notice Bob's avatar appear in Alice's header and vice versa.
6. Type in Window A; verify changes sync to Window B in real time.
7. Switch Bob's role to `VIEWER` in Alice's share modal; verify Bob's editor switches immediately to read-only mode.

---

## 🌐 Deployment Details

- **Frontend**: [Vercel](https://client-brijesh22.vercel.app) (`https://client-brijesh22.vercel.app`)
- **Backend**: [Render](https://docflow-b4fh.onrender.com) (`https://docflow-b4fh.onrender.com`)
- **Database**: PostgreSQL
