import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Get all lessons for current user (from their documents)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT l.*, d.name as document_name
       FROM lessons l
       JOIN documents d ON l.document_id = d.id
       WHERE d.owner_id = $1
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );

    res.json({ lessons: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get lessons for a specific document
router.get('/document/:documentId', authenticateToken, async (req, res, next) => {
  try {
    // Verify document ownership
    const docCheck = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND owner_id = $2',
      [req.params.documentId, req.user.id]
    );

    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const result = await pool.query(
      `SELECT l.*, d.name as document_name
       FROM lessons l
       JOIN documents d ON l.document_id = d.id
       WHERE l.document_id = $1 AND d.owner_id = $2
       ORDER BY l.created_at ASC`,
      [req.params.documentId, req.user.id]
    );

    res.json({ lessons: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get single lesson
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT l.*, d.name as document_name, d.owner_id
       FROM lessons l
       JOIN documents d ON l.document_id = d.id
       WHERE l.id = $1 AND d.owner_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ lesson: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Create lessons (bulk insert)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { documentId, lessons } = req.body;

    if (!documentId || !Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({ error: 'documentId and lessons array required' });
    }

    // Verify document ownership
    const docCheck = await pool.query(
      'SELECT id FROM documents WHERE id = $1 AND owner_id = $2',
      [documentId, req.user.id]
    );

    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Insert lessons
    const insertedLessons = [];
    for (const lesson of lessons) {
      const { type, title, description, difficulty, xp, payload } = lesson;

      const result = await pool.query(
        `INSERT INTO lessons (document_id, type, title, description, difficulty, xp, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING *`,
        [documentId, type, title, description, difficulty || 'medium', xp || 0, JSON.stringify(payload)]
      );

      insertedLessons.push(result.rows[0]);
    }

    // Mark document as processed
    await pool.query(
      'UPDATE documents SET processed = TRUE WHERE id = $1',
      [documentId]
    );

    res.status(201).json({ lessons: insertedLessons });
  } catch (error) {
    next(error);
  }
});

// Get lesson progress
router.get('/:id/progress', authenticateToken, async (req, res, next) => {
  try {
    // Verify lesson ownership
    const lessonCheck = await pool.query(
      `SELECT l.id FROM lessons l
       JOIN documents d ON l.document_id = d.id
       WHERE l.id = $1 AND d.owner_id = $2`,
      [req.params.id, req.user.id]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const result = await pool.query(
      'SELECT * FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2',
      [req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.json({ progress: null });
    }

    res.json({ progress: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update lesson progress
router.post('/:id/progress', authenticateToken, async (req, res, next) => {
  try {
    const { progress, completed, score } = req.body;

    // Verify lesson ownership
    const lessonCheck = await pool.query(
      `SELECT l.id FROM lessons l
       JOIN documents d ON l.document_id = d.id
       WHERE l.id = $1 AND d.owner_id = $2`,
      [req.params.id, req.user.id]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const progressValue = Math.max(0, Math.min(100, progress || 0));
    const completedValue = completed === true;
    const scoreValue = score || 0;

    const result = await pool.query(
      `INSERT INTO lesson_progress (user_id, lesson_id, progress, completed, score, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET
         progress = EXCLUDED.progress,
         completed = EXCLUDED.completed,
         score = EXCLUDED.score,
         completed_at = CASE WHEN EXCLUDED.completed THEN EXCLUDED.completed_at ELSE lesson_progress.completed_at END,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        req.user.id,
        req.params.id,
        progressValue,
        completedValue,
        scoreValue,
        completedValue ? new Date() : null
      ]
    );

    res.json({ progress: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
