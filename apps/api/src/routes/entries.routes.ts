import { Router, Response } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware.js";
import { paginationSchema } from "../schemas/pagination.schema.js";
import { query } from "../db.js";
import { getCache, setCache } from "../cache.js";
import { fetchWordFromApi } from "../utils/dictionary-api.js";
import { publishFavoriteEvent } from "../queue.js";
import {
  decodeCursor,
  buildPaginatedResponse,
  type CursorData,
} from "../utils/pagination.js";

const router: RouterType = Router();

// All entries routes require authentication
router.use(authMiddleware);

// GET /entries/en - List words with cursor pagination and search
router.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { cursor, limit, search } = paginationSchema.parse(req.query);

  // Build WHERE clause
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(`word LIKE $${paramIdx}`);
    params.push(`${search}%`);
    paramIdx++;
  }

  // Decode cursor for pagination
  if (cursor) {
    const cursorData = decodeCursor(cursor);
    if (cursorData && cursorData.id) {
      conditions.push(`id > $${paramIdx}`);
      params.push(cursorData.id);
      paramIdx++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Count total docs (with search filter but without cursor)
  const countConditions: string[] = [];
  const countParams: unknown[] = [];

  if (search) {
    countConditions.push(`word LIKE $1`);
    countParams.push(`${search}%`);
  }

  const countWhere = countConditions.length > 0 ? `WHERE ${countConditions.join(" AND ")}` : "";
  const countResult = await query(`SELECT COUNT(*) FROM words ${countWhere}`, countParams);
  const totalDocs = parseInt(countResult.rows[0].count, 10);

  // Fetch limit+1 to check hasNext
  params.push(limit + 1);
  const dataResult = await query(
    `SELECT id, word FROM words ${whereClause} ORDER BY id ASC LIMIT $${paramIdx}`,
    params
  );

  const hasPrev = !!cursor;

  const response = buildPaginatedResponse(
    dataResult.rows.map((r: { word: string }) => r.word),
    totalDocs,
    limit,
    (_word: string) => {
      const row = dataResult.rows.find((r: { word: string }) => r.word === _word);
      return { id: row?.id ?? 0 } as CursorData;
    },
    hasPrev
  );

  res.status(200).json(response);
});

// GET /entries/en/:word - Get word details (proxy to Dictionary API)
router.get("/:word", async (req: AuthRequest, res: Response): Promise<void> => {
  const word = req.params.word as string;
  const userId = req.userId!;
  const cacheKey = `word:${word.toLowerCase()}`;

  // Check cache
  const cached = await getCache(cacheKey);

  if (cached) {
    res.setHeader("x-cache", "HIT");

    // Still record in history
    await query(
      "INSERT INTO history (user_id, word) VALUES ($1, $2)",
      [userId, word.toLowerCase()]
    );

    res.status(200).json(cached.data);
    return;
  }

  // Fetch from external API
  const data = await fetchWordFromApi(word);

  if (!data) {
    res.status(404).json({ message: `Palavra "${word}" não encontrada no dicionário` });
    return;
  }

  // Cache the result
  await setCache(cacheKey, data);

  // Record in history
  await query(
    "INSERT INTO history (user_id, word) VALUES ($1, $2)",
    [userId, word.toLowerCase()]
  );

  res.setHeader("x-cache", "MISS");
  res.status(200).json(data);
});

// POST /entries/en/:word/favorite - Add word to favorites (async via Redis Pub/Sub)
router.post("/:word/favorite", async (req: AuthRequest, res: Response): Promise<void> => {
  const word = req.params.word as string;
  const userId = req.userId!;

  await publishFavoriteEvent({
    userId,
    word: word.toLowerCase(),
    action: "add",
  });

  res.status(202).json({ message: "Solicitação de favorito recebida" });
});

// DELETE /entries/en/:word/unfavorite - Remove word from favorites (async via Redis Pub/Sub)
router.delete("/:word/unfavorite", async (req: AuthRequest, res: Response): Promise<void> => {
  const word = req.params.word as string;
  const userId = req.userId!;

  await publishFavoriteEvent({
    userId,
    word: word.toLowerCase(),
    action: "remove",
  });

  res.status(202).json({ message: "Solicitação de remoção recebida" });
});

export default router;
