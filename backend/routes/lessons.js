import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

const STOPWORDS = new Set([
  'the','and','to','of','a','in','that','is','it','for','on','as','with','are','be','by','this','an','or','from','at','was','which','but','have','has','not','can','will','its','their','more','one','we','you'
]);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function buildClozeItems(sentences, keywords) {
  const items = [];
  for (const sentence of sentences) {
    if (items.length >= 8) break;
    const word = keywords.find((keyword) => new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(sentence));
    if (!word) continue;
    const blank = sentence.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i'), '_____');
    if (blank === sentence) continue;
    items.push({ sentence: blank, answer: word });
  }
  return items;
}

function generateComprehensionQuestions(sentences, keywords) {
  return sentences.slice(0, 6).map((sentence, index) => {
    const answer = keywords[index] || keywords[0] || 'answer';
    const options = [answer, 'A supporting detail', 'An unrelated idea', 'A minor fact'];
    return {
      question: `What is the key idea in this sentence? ${sentence}`,
      options,
      answer
    };
  });
}

function summarizeText(sentences) {
  if (sentences.length === 0) {
    return '';
  }
  return sentences.slice(0, 3).join(' ');
}

function generateLessonsFromText(content, documentId) {
  const cleaned = normalizeText(content);
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20);
  const words = cleaned.toLowerCase().match(/[a-z0-9]+/g) || [];
  const frequency = new Map();

  for (const word of words) {
    if (word.length < 4 || STOPWORDS.has(word)) continue;
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  const keywords = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  const lessons = [];

  if (keywords.length > 0) {
    lessons.push({
      id: `${documentId}-vocabulary`,
      documentId,
      type: 'vocabulary',
      title: 'Key Vocabulary',
      description: 'Learn important terms extracted from your document',
      difficulty: 'easy',
      xp: 60,
      words: keywords.slice(0, 12),
      payload: { words: keywords.slice(0, 12) }
    });
  }

  const clozeItems = buildClozeItems(sentences, keywords);
  if (clozeItems.length > 0) {
    lessons.push({
      id: `${documentId}-cloze`,
      documentId,
      type: 'cloze',
      title: 'Fill in the Blanks',
      description: 'Test recall by completing sentences with key terms',
      difficulty: 'medium',
      xp: 90,
      items: clozeItems.slice(0, 8),
      payload: { items: clozeItems.slice(0, 8) }
    });
  }

  if (sentences.length > 0) {
    lessons.push({
      id: `${documentId}-comprehension`,
      documentId,
      type: 'comprehension',
      title: 'Reading Comprehension',
      description: 'Multiple-choice questions generated from the document',
      difficulty: 'medium',
      xp: 120,
      questions: generateComprehensionQuestions(sentences, keywords),
      payload: { questions: generateComprehensionQuestions(sentences, keywords) }
    });
  }

  const summary = summarizeText(sentences);
  lessons.push({
    id: `${documentId}-summary`,
    documentId,
    type: 'summary',
    title: 'Document Summary',
    description: 'Review the main points of this document',
    difficulty: 'easy',
    xp: 40,
    summary: summary || cleaned.substring(0, 500),
    payload: { summary: summary || cleaned.substring(0, 500) }
  });

  return lessons;
}

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

// Delete lesson
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const deleteResult = await pool.query(
      `DELETE FROM lessons l
       USING documents d
       WHERE l.id = $1 AND l.document_id = d.id AND d.owner_id = $2
       RETURNING l.id`,
      [req.params.id, req.user.id]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found or not owned by user' });
    }

    res.status(204).end();
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

// Generate lessons for a document on the server
router.post('/generate/:documentId', authenticateToken, async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const docResult = await pool.query(
      'SELECT id, full_text, content_excerpt FROM documents WHERE id = $1 AND owner_id = $2',
      [documentId, req.user.id]
    );

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = docResult.rows[0];
    const textContent = document.full_text || document.content_excerpt || '';

    if (!textContent.trim()) {
      return res.status(400).json({ error: 'Document has no text available for lesson generation' });
    }

    const lessons = generateLessonsFromText(textContent, documentId);
    const insertedLessons = [];

    for (const lesson of lessons) {
      const result = await pool.query(
        `INSERT INTO lessons (document_id, type, title, description, difficulty, xp, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING *`,
        [
          documentId,
          lesson.type,
          lesson.title,
          lesson.description,
          lesson.difficulty,
          lesson.xp,
          JSON.stringify(lesson.payload)
        ]
      );
      insertedLessons.push(result.rows[0]);
    }

    await pool.query('UPDATE documents SET processed = TRUE WHERE id = $1', [documentId]);

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
