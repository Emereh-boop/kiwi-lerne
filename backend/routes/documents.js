import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../config/upload.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all documents for current user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, mime_type, size_bytes, content_excerpt, processed, uploaded_at, created_at
       FROM documents
       WHERE owner_id = $1
       ORDER BY uploaded_at DESC`,
      [req.user.id]
    );

    res.json({ documents: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get single document
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, mime_type, file_path, content_excerpt, full_text, processed, uploaded_at
       FROM documents
       WHERE id = $1 AND owner_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Upload document
router.post('/', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, path: filePath } = req.file;
    const fullText = req.body.content || '';

    const isTextFile = mimetype.startsWith('text/') || /\.(txt|md|csv|json|xml)$/i.test(originalname);

    // Read file content excerpt (first 1000 chars for preview)
    let contentExcerpt = '';
    if (fullText) {
      contentExcerpt = fullText.substring(0, 1000);
    } else if (isTextFile) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        contentExcerpt = content.substring(0, 1000);
      } catch (err) {
        contentExcerpt = '';
      }
    }

    const result = await pool.query(
      `INSERT INTO documents (owner_id, name, mime_type, size_bytes, file_path, content_excerpt, full_text, processed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING *`,
      [req.user.id, originalname, mimetype, size, filePath, contentExcerpt, fullText]
    );

    res.status(201).json({ document: result.rows[0] });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete file:', unlinkError);
      }
    }
    next(error);
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Get file path before deleting
    const docResult = await pool.query(
      'SELECT file_path FROM documents WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = docResult.rows[0].file_path;

    // Delete from database (cascade will delete lessons)
    await pool.query(
      'DELETE FROM documents WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );

    // Delete file from filesystem
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Failed to delete file:', unlinkError);
        // Don't fail the request if file deletion fails
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Update document (mark as processed, etc.)
router.patch('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { processed, contentExcerpt } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (processed !== undefined) {
      updates.push(`processed = $${paramCount++}`);
      values.push(processed);
    }
    if (contentExcerpt !== undefined) {
      updates.push(`content_excerpt = $${paramCount++}`);
      values.push(contentExcerpt);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id, req.user.id);

    const result = await pool.query(
      `UPDATE documents SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount++} AND owner_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
