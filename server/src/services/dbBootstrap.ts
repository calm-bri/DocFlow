import { prisma } from '../db';

const roadmapDocContent = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'DocFlow Product Roadmap & Vision' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Welcome to DocFlow! This document outlines our product vision for a lightweight collaborative workspace with ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'debounced autosave' },
        { type: 'text', text: ' and ' },
        { type: 'text', marks: [{ type: 'italic' }], text: 'granular role-based sharing' },
        { type: 'text', text: '.' },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Core Milestones' }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Structured JSON storage using TipTap rich text engine' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Granular permissions: VIEWER vs EDITOR vs OWNER' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'File upload import (.txt and .md formats supported)' }],
            },
          ],
        },
      ],
    },
  ],
});

const architectureDocContent = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Backend Architecture & API Specs' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Technical specification for Express REST API, Prisma ORM data layer, and Supertest authorization matrix.' },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Access Control Rules' }],
    },
    {
      type: 'orderedList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Owner can read, edit, rename title, and manage sharing permissions.' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Editor can read and edit document content.' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Viewer can read document content in read-only mode.' }],
            },
          ],
        },
      ],
    },
  ],
});

const designDocContent = JSON.stringify({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'UX & Accessibility Guidelines' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Design tokens, Tailwind CSS utility classes, and glassmorphism UI components.' },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Clean empty and loading states throughout all views' }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Instant demo user switching without login friction' }],
            },
          ],
        },
      ],
    },
  ],
});

export async function bootstrapDatabase(): Promise<void> {
  try {
    console.log('🔄 Initializing database schema...');

    // 1. Ensure tables exist in PostgreSQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Document" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocumentAccess" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "permission" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DocumentAccess_documentId_userId_key" UNIQUE ("documentId", "userId")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Document_ownerId_idx" ON "Document"("ownerId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DocumentAccess_userId_idx" ON "DocumentAccess"("userId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DocumentAccess_documentId_idx" ON "DocumentAccess"("documentId");
    `);

    console.log('✅ Database tables verified.');

    // 2. Check if seed data is needed
    const count = await prisma.user.count();
    if (count > 0) {
      console.log(`ℹ️ Database already has ${count} user(s). Seeding skipped.`);
      return;
    }

    console.log('🌱 Seeding initial demo users and documents...');

    const alice = await prisma.user.upsert({
      where: { email: 'alice@docflow.demo' },
      update: { name: 'Alice Johnson' },
      create: {
        id: 'demo-user-alice-1111',
        name: 'Alice Johnson',
        email: 'alice@docflow.demo',
      },
    });

    const bob = await prisma.user.upsert({
      where: { email: 'bob@docflow.demo' },
      update: { name: 'Bob Smith' },
      create: {
        id: 'demo-user-bob-2222',
        name: 'Bob Smith',
        email: 'bob@docflow.demo',
      },
    });

    const carol = await prisma.user.upsert({
      where: { email: 'carol@docflow.demo' },
      update: { name: 'Carol Davis' },
      create: {
        id: 'demo-user-carol-3333',
        name: 'Carol Davis',
        email: 'carol@docflow.demo',
      },
    });

    // Create 3 demo documents
    await prisma.document.create({
      data: {
        id: 'doc-roadmap-alice-100',
        title: 'DocFlow Product Roadmap & Vision',
        content: roadmapDocContent,
        ownerId: alice.id,
        accesses: {
          create: [
            { userId: bob.id, permission: 'EDITOR' },
            { userId: carol.id, permission: 'VIEWER' },
          ],
        },
      },
    });

    await prisma.document.create({
      data: {
        id: 'doc-arch-bob-200',
        title: 'Backend Architecture & API Specs',
        content: architectureDocContent,
        ownerId: bob.id,
        accesses: {
          create: [{ userId: alice.id, permission: 'VIEWER' }],
        },
      },
    });

    await prisma.document.create({
      data: {
        id: 'doc-design-carol-300',
        title: 'UX & Accessibility Guidelines',
        content: designDocContent,
        ownerId: carol.id,
        accesses: {
          create: [{ userId: alice.id, permission: 'EDITOR' }],
        },
      },
    });

    console.log('🎉 Database successfully seeded with demo users and documents!');
  } catch (error) {
    console.error('❌ Database bootstrap error:', error);
  }
}
