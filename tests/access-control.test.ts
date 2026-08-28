if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/app';
import { prisma } from '../server/src/db';

describe('DocFlow Document Authorization & Sharing Logic Suite', () => {
  let aliceId: string;
  let bobId: string;
  let carolId: string;
  let testDocId: string;

  beforeAll(async () => {
    // Clean database to ensure isolated test environment
    await prisma.documentAccess.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.user.deleteMany({});

    // Create fresh isolated test users: Alice, Bob, and Carol
    const alice = await prisma.user.create({
      data: { name: 'Alice Johnson', email: 'alice@docflow.demo' },
    });
    const bob = await prisma.user.create({
      data: { name: 'Bob Smith', email: 'bob@docflow.demo' },
    });
    const carol = await prisma.user.create({
      data: { name: 'Carol Davis', email: 'carol@docflow.demo' },
    });

    aliceId = alice.id;
    bobId = bob.id;
    carolId = carol.id;
  });

  afterAll(async () => {
    // Clean up test records
    await prisma.documentAccess.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  // TEST 1: Alice owns a document and can access it
  it('Test 1: Alice owns a document and can access it', async () => {
    const createRes = await request(app)
      .post('/api/documents')
      .set('X-User-Id', aliceId)
      .send({
        title: 'Alice Confidential Strategy',
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Top Secret Plan' }] }] },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.title).toBe('Alice Confidential Strategy');
    expect(createRes.body.ownerId).toBe(aliceId);

    testDocId = createRes.body.id;

    // Alice accesses her document
    const accessRes = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', aliceId);

    expect(accessRes.status).toBe(200);
    expect(accessRes.body.id).toBe(testDocId);
    expect(accessRes.body.userPermission).toBe('OWNER');
  });

  // TEST 2: Bob initially cannot access Alice's document (returns 403 Forbidden)
  it("Test 2: Bob initially cannot access Alice's document", async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', bobId);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  // TEST 3: Alice shares the document with Bob and Bob can now access it
  it('Test 3: Alice shares document with Bob, Bob can now access it', async () => {
    // Alice shares with Bob as EDITOR
    const shareRes = await request(app)
      .post(`/api/documents/${testDocId}/share`)
      .set('X-User-Id', aliceId)
      .send({
        userId: bobId,
        permission: 'EDITOR',
      });

    expect(shareRes.status).toBe(200);
    expect(shareRes.body.message).toContain('successfully shared');

    // Bob accesses shared document
    const bobAccessRes = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', bobId);

    expect(bobAccessRes.status).toBe(200);
    expect(bobAccessRes.body.id).toBe(testDocId);
    expect(bobAccessRes.body.userPermission).toBe('EDITOR');
  });

  // TEST 4: Bob receives EDITOR permission and can update the document
  it('Test 4: Bob (EDITOR) can update document content', async () => {
    const updateRes = await request(app)
      .put(`/api/documents/${testDocId}`)
      .set('X-User-Id', bobId)
      .send({
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated by Bob' }] }] },
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.id).toBe(testDocId);

    // Verify content updated
    const getRes = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', aliceId);

    expect(getRes.body.content).toContain('Updated by Bob');
  });

  // TEST 5: Carol is unrelated and receives a 403 authorization failure
  it('Test 5: Carol is unrelated and receives 403 Forbidden on access attempt', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', carolId);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  // TEST 6: Bob (EDITOR, non-owner) cannot share the document with Carol
  it('Test 6: Non-owner Bob cannot share the document (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/documents/${testDocId}/share`)
      .set('X-User-Id', bobId)
      .send({
        userId: carolId,
        permission: 'VIEWER',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Only the document owner can share');
  });

  // TEST 7: Demoted VIEWER cannot edit document content
  it('Test 7: VIEWER permission blocks content updates (403 Forbidden)', async () => {
    // Alice updates Bob's permission to VIEWER
    await request(app)
      .post(`/api/documents/${testDocId}/share`)
      .set('X-User-Id', aliceId)
      .send({
        userId: bobId,
        permission: 'VIEWER',
      });

    // Bob attempts edit
    const editRes = await request(app)
      .put(`/api/documents/${testDocId}`)
      .set('X-User-Id', bobId)
      .send({
        content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Illegal Edit' }] }] },
      });

    expect(editRes.status).toBe(403);
    expect(editRes.body.error).toContain('Permission denied');
  });

  // TEST 8: Non-owner Bob (VIEWER) or Carol cannot delete Alice's document (403 Forbidden)
  it('Test 8: Non-owner cannot delete document (403 Forbidden)', async () => {
    // Bob attempts to delete
    const bobDeleteRes = await request(app)
      .delete(`/api/documents/${testDocId}`)
      .set('X-User-Id', bobId);

    expect(bobDeleteRes.status).toBe(403);
    expect(bobDeleteRes.body.error).toContain('Only the document owner can delete');

    // Unrelated user Carol attempts to delete
    const carolDeleteRes = await request(app)
      .delete(`/api/documents/${testDocId}`)
      .set('X-User-Id', carolId);

    expect(carolDeleteRes.status).toBe(403);
    expect(carolDeleteRes.body.error).toContain('Only the document owner can delete');
  });

  // TEST 9: Owner Alice can successfully delete her document
  it('Test 9: Owner Alice can delete her document (200 OK)', async () => {
    const deleteRes = await request(app)
      .delete(`/api/documents/${testDocId}`)
      .set('X-User-Id', aliceId);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toContain('successfully deleted');
    expect(deleteRes.body.id).toBe(testDocId);
  });

  // TEST 10: Accessing deleted document returns 404 Not Found
  it('Test 10: Accessing deleted document returns 404 Not Found', async () => {
    const getRes = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', aliceId);

    expect(getRes.status).toBe(404);
    expect(getRes.body.error).toContain('Document not found');
  });
});
