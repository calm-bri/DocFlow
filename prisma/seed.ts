import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TipTap JSON Document 1: Roadmap
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

// TipTap JSON Document 2: Architecture
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

// TipTap JSON Document 3: Design Specs
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

async function main() {
  // Idempotency guard: skip seeding if demo users already exist.
  // This prevents data loss on redeployment — user-created documents are preserved.
  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0) {
    console.log(`Seed skipped: database already has ${existingUserCount} user(s). Existing data preserved.`);
    return;
  }

  console.log('Seeding demo users...');

  // Seed Users
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

  console.log('Demo Users:', { alice: alice.name, bob: bob.name, carol: carol.name });

  // Seed demo documents (only reached on first deploy)
  const doc1 = await prisma.document.create({
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

  // Document 2: Owned by Bob, Shared with Alice (VIEWER)
  const doc2 = await prisma.document.create({
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

  // Document 3: Owned by Carol, Shared with Alice (EDITOR)
  const doc3 = await prisma.document.create({
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

  console.log('Database successfully seeded with 3 example documents:');
  console.log(' -', doc1.title, `(Owner: ${alice.name})`);
  console.log(' -', doc2.title, `(Owner: ${bob.name})`);
  console.log(' -', doc3.title, `(Owner: ${carol.name})`);
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

