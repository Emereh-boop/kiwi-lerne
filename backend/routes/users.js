import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Get user profile with gamification data
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const profileResult = await pool.query(
      `SELECT p.*, u.email, u.name, u.created_at as user_created_at
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      // Create default profile if it doesn't exist
      await pool.query(
        `INSERT INTO profiles (user_id, xp, level, streak, learning_style, preferences)
         VALUES ($1, 0, 1, 0, 'gamified', $2::jsonb)`,
        [req.user.id, JSON.stringify({ soundEffects: true, animations: true, difficulty: 'medium' })]
      );

      const newProfile = await pool.query(
        `SELECT p.*, u.email, u.name, u.created_at as user_created_at
         FROM profiles p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1`,
        [req.user.id]
      );

      return res.json({ profile: newProfile.rows[0] });
    }

    res.json({ profile: profileResult.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { xp, level, streak, learningStyle, preferences, lastActiveDate } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (xp !== undefined) {
      updates.push(`xp = $${paramCount++}`);
      values.push(xp);
    }
    if (level !== undefined) {
      updates.push(`level = $${paramCount++}`);
      values.push(level);
    }
    if (streak !== undefined) {
      updates.push(`streak = $${paramCount++}`);
      values.push(streak);
    }
    if (learningStyle !== undefined) {
      updates.push(`learning_style = $${paramCount++}`);
      values.push(learningStyle);
    }
    if (preferences !== undefined) {
      updates.push(`preferences = $${paramCount++}::jsonb`);
      values.push(JSON.stringify(preferences));
    }
    if (lastActiveDate !== undefined) {
      updates.push(`last_active_date = $${paramCount++}`);
      values.push(lastActiveDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);

    const result = await pool.query(
      `UPDATE profiles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramCount}
       RETURNING *`,
      values
    );

    res.json({ profile: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM achievements WHERE user_id = $1 ORDER BY earned_at DESC',
      [req.user.id]
    );

    res.json({ achievements: result.rows });
  } catch (error) {
    next(error);
  }
});

// Add achievement
router.post('/achievements', authenticateToken, async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO achievements (user_id, title, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, title) DO UPDATE SET earned_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, title, description]
    );

    res.status(201).json({ achievement: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Add XP (with automatic level calculation)
router.post('/xp', authenticateToken, async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid XP amount required' });
    }

    // Get current profile
    const profileResult = await pool.query(
      'SELECT xp, level FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const currentXP = profileResult.rows[0].xp;
    const currentLevel = profileResult.rows[0].level;
    const newXP = currentXP + amount;
    const newLevel = Math.floor(newXP / 100) + 1;

    const result = await pool.query(
      `UPDATE profiles 
       SET xp = $1, level = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3
       RETURNING *`,
      [newXP, newLevel, req.user.id]
    );

    res.json({ 
      profile: result.rows[0],
      xpAdded: amount,
      levelUp: newLevel > currentLevel
    });
  } catch (error) {
    next(error);
  }
});

export default router;
