# AI Development Workflow

This document provides a transparent, practical overview of how Artificial Intelligence tools were utilized during the development, debugging, and deployment of DocFlow.

---

## AI Tools Utilized

- **ChatGPT** (OpenAI)
- **Antigravity** (Google DeepMind)

---

## Where AI Materially Accelerated Development

AI tools served as an intelligent pairing assistant across several phases of the project:

1. **Project Planning & Architecture Brainstorming**:
   - Brainstorming data models and schema relationships for document ownership and permissions.
   - Outlining the interaction pattern between HTTP REST persistence and Socket.IO real-time broadcast.
2. **Scaffolding & Boilerplate Generation**:
   - Generating initial React component layouts, Tailwind UI shells, and Express route scaffolding.
   - Creating initial TipTap extension setups and helper utilities.
3. **TypeScript & Logic Debugging**:
   - Diagnosing asynchronous timing issues in React ref lifecycles and debounced state updates.
   - Assisting with the loop-prevention flag (`isRemoteUpdateRef`) to prevent infinite Socket.IO broadcast loops.
4. **Prisma & Database Configuration**:
   - Drafting initial Prisma schema definitions and seed scripts for mock user personas.
   - Optimizing composite indexes and cascade relations.
5. **Deployment & Environment Configuration**:
   - Reviewing build scripts and cross-origin resource sharing (CORS) configurations for split Vercel/Render deployments.
6. **Documentation Drafting & Refinement**:
   - Drafting structured architecture overviews and clear quick-start guides for reviewers.

---

## What AI-Generated Output Was Changed or Rejected

AI suggestions were evaluated critically rather than accepted blindly. Several modifications and rejections were made:

- **Timer Type Corrections**: AI initially generated Node.js-specific timer types (`NodeJS.Timeout`) in client-side React code, which caused TypeScript compiler errors during Vite builds. These were manually corrected to use `ReturnType<typeof setTimeout>`.
- **Monorepo Build & Deployment Adjustments**: Initial AI-suggested deployment configs assumed a flat project directory. The root scripts and build commands were manually refactored to properly handle root, client, and server dependency installation and build pipelines on Render and Vercel.
- **Simplification of Collaboration Complexity**: AI initially proposed complex CRDT/Yjs integration schemes that introduced unnecessary overhead for the target scope. This was intentionally rejected in favor of a clean, robust Socket.IO room broadcast with a last-write-wins model.
- **Autosave Race-Condition Guarding**: AI-generated autosave boilerplate did not adequately handle rapid typing while a save was in flight. A custom `isSavingRef` and `pendingSaveRef` state machine was designed and implemented to prevent dropped saves.
- **Manual Permission Hardening**: Server-side access control checks in `accessControl.ts` were manually refined and verified to ensure that `VIEWER` and unauthorized users cannot bypass permission checks via direct Socket emissions or REST mutations.

---

## Verification & Quality Assurance

All AI-assisted code was thoroughly validated through both automated and manual testing pipelines:

1. **Type Checking & Build Validation**:
   - `npm run build` executed across root, client, and server workspaces to guarantee zero TypeScript or bundler errors.
2. **Automated Integration Tests**:
   - `npm run test` executed to validate backend access-control logic, permission rules, and document endpoints.
3. **Manual End-to-End Testing**:
   - Comprehensive multi-user testing using the seeded personas (**Alice**, **Bob**, and **Carol**).
   - Real-time collaboration validation across separate browser windows and incognito sessions.
   - Dynamic permission changes (e.g. downgrading an active Editor to Viewer) to verify immediate UI locking and 403 Forbidden handling.
4. **Persistence & Refresh Testing**:
   - Typing in active documents, waiting for the debounced save indicator, and refreshing to verify data persistence in PostgreSQL.
5. **Production Verification**:
   - Verifying live Vercel frontend communication with the live Render backend, including WebSocket connection establishment, CORS headers, and database persistence.
