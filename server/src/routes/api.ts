import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { getUsers } from '../controllers/userController';
import {
  getOwnedDocuments,
  getSharedDocuments,
  createDocument,
  getDocumentById,
  updateDocument,
  shareDocument,
  importDocument,
} from '../controllers/documentController';

const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const router = Router();

// Public / User Discovery
router.get('/users', getUsers);

// Authenticated Endpoints (requires X-User-Id header)
router.use(requireAuth);

router.get('/documents', getOwnedDocuments);
router.get('/documents/shared', getSharedDocuments);
router.post('/documents', createDocument);
router.get('/documents/:id', getDocumentById);
router.put('/documents/:id', updateDocument);
router.post('/documents/:id/share', shareDocument);
router.post('/documents/import', upload.single('file'), importDocument);

export default router;
