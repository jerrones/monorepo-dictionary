import { Router, Response } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware.js";
import { paginationSchema } from "../schemas/pagination.schema.js";
import { query } from "../db.js";
import {
  decodeCursor,
  buildPaginatedResponse,
  type CursorData,
} from "../utils/pagination.js";

const router: RouterType = Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /user/me - Get user profile
router.get("/me", async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  const result = await query(
    "SELECT id, name, email, created_at FROM users WHERE id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ message: "Usuário não encontrado" });
    return;
  }

  const user = result.rows[0];

  res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  });
});

// GET /user/me/history - Get visited words history (cursor pagination)
router.get("/me/history", async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { cursor, limit } = paginationSchema.parse(req.query);

  // Count total history entries for this user
  const countResult = await query(
    "SELECT COUNT(*) FROM history WHERE user_id = $1",
    [userId]
  );
  const totalDocs = parseInt(countResult.rows[0].count, 10);

  // Build query with cursor
  const params: unknown[] = [userId];
  let cursorClause = "";

  if (cursor) {
    const cursorData = decodeCursor(cursor);
    if (cursorData && cursorData.id) {
      cursorClause = "AND id < $2";
      params.push(cursorData.id);
    }
  }

  params.push(limit + 1);
  const limitParam = `$${params.length}`;

  const result = await query(
    `SELECT id, word, added_at FROM history 
     WHERE user_id = $1 ${cursorClause}
     ORDER BY added_at DESC, id DESC 
     LIMIT ${limitParam}`,
    params
  );

  const hasPrev = !!cursor;

  interface HistoryRow {
    id: number;
    word: string;
    added_at: string;
  }

  const response = buildPaginatedResponse(
    result.rows.map((r: HistoryRow) => ({
      word: r.word,
      added: r.added_at,
    })),
    totalDocs,
    limit,
    (item: { word: string; added: string }) => {
      const row = result.rows.find((r: HistoryRow) => r.word === item.word && r.added_at === item.added);
      return { id: row?.id ?? 0 } as CursorData;
    },
    hasPrev
  );

  res.status(200).json(response);
});

// GET /user/me/favorites - Get favorite words (cursor pagination)
router.get("/me/favorites", async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { cursor, limit } = paginationSchema.parse(req.query);

  // Count total favorites for this user
  const countResult = await query(
    "SELECT COUNT(*) FROM favorites WHERE user_id = $1",
    [userId]
  );
  const totalDocs = parseInt(countResult.rows[0].count, 10);

  // Build query with cursor
  const params: unknown[] = [userId];
  let cursorClause = "";

  if (cursor) {
    const cursorData = decodeCursor(cursor);
    if (cursorData && cursorData.added_at && cursorData.word) {
      cursorClause = "AND (added_at, word) < ($2, $3)";
      params.push(cursorData.added_at, cursorData.word);
    }
  }

  params.push(limit + 1);
  const limitParam = `$${params.length}`;

  const result = await query(
    `SELECT word, added_at FROM favorites 
     WHERE user_id = $1 ${cursorClause}
     ORDER BY added_at DESC, word DESC 
     LIMIT ${limitParam}`,
    params
  );

  const hasPrev = !!cursor;

  interface FavoriteRow {
    word: string;
    added_at: string;
  }

  const response = buildPaginatedResponse(
    result.rows.map((r: FavoriteRow) => ({
      word: r.word,
      added: r.added_at,
    })),
    totalDocs,
    limit,
    (item: { word: string; added: string }) => {
      return { added_at: item.added, word: item.word } as CursorData;
    },
    hasPrev
  );

  res.status(200).json(response);
});

export default router;
