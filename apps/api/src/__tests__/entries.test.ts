import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Mock db module
vi.mock("../db.js", () => ({
  query: vi.fn(),
  default: {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  },
}));

// Mock cache module
vi.mock("../cache.js", () => ({
  getCache: vi.fn(async () => null),
  setCache: vi.fn(async () => {}),
  getRedisClient: vi.fn(),
}));

// Mock dictionary API
vi.mock("../utils/dictionary-api.js", () => ({
  fetchWordFromApi: vi.fn(async (word: string) => {
    if (word === "hello") {
      return [{ word: "hello", meanings: [] }];
    }
    return null;
  }),
}));

// Mock queue
vi.mock("../queue.js", () => ({
  publishFavoriteEvent: vi.fn(async () => {}),
}));

// Mock auth middleware to always authenticate
vi.mock("../middlewares/auth.middleware.js", () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = "user-123";
    req.userName = "Test User";
    next();
  },
  generateToken: vi.fn(() => "mock.token"),
  AuthRequest: {},
}));

import { query } from "../db.js";
import { getCache } from "../cache.js";
import { publishFavoriteEvent } from "../queue.js";
import entriesRoutes from "../routes/entries.routes.js";
import { errorHandlerMiddleware } from "../middlewares/error-handler.middleware.js";

const mockedQuery = vi.mocked(query);
const mockedGetCache = vi.mocked(getCache);
const mockedPublishFavorite = vi.mocked(publishFavoriteEvent);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/entries/en", entriesRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe("Entries Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe("GET /entries/en", () => {
    it("should return paginated words", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ count: "100" }], rowCount: 1 } as any) // count
        .mockResolvedValueOnce({
          rows: [
            { id: 1, word: "fire" },
            { id: 2, word: "firefly" },
          ],
          rowCount: 2,
        } as any); // data

      const res = await request(app).get("/entries/en?limit=5");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("results");
      expect(res.body).toHaveProperty("totalDocs", 100);
      expect(res.body).toHaveProperty("hasNext");
      expect(res.body).toHaveProperty("hasPrev", false);
    });

    it("should support search filter", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ count: "3" }], rowCount: 1 } as any)
        .mockResolvedValueOnce({
          rows: [
            { id: 10, word: "fire" },
            { id: 11, word: "firefly" },
          ],
          rowCount: 2,
        } as any);

      const res = await request(app).get("/entries/en?search=fire&limit=4");

      expect(res.status).toBe(200);
      expect(res.body.results).toEqual(["fire", "firefly"]);
    });
  });

  describe("GET /entries/en/:word", () => {
    it("should return word from API on cache MISS", async () => {
      mockedGetCache.mockResolvedValueOnce(null);
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // history insert

      const res = await request(app).get("/entries/en/hello");

      expect(res.status).toBe(200);
      expect(res.headers["x-cache"]).toBe("MISS");
    });

    it("should return word from cache on HIT", async () => {
      mockedGetCache.mockResolvedValueOnce({
        data: [{ word: "hello", meanings: [] }],
        hit: true,
      });
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // history insert

      const res = await request(app).get("/entries/en/hello");

      expect(res.status).toBe(200);
      expect(res.headers["x-cache"]).toBe("HIT");
    });

    it("should return 404 for unknown word", async () => {
      mockedGetCache.mockResolvedValueOnce(null);

      const res = await request(app).get("/entries/en/xyznotaword");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /entries/en/:word/favorite", () => {
    it("should publish favorite event and return 202", async () => {
      const res = await request(app).post("/entries/en/hello/favorite");

      expect(res.status).toBe(202);
      expect(mockedPublishFavorite).toHaveBeenCalledWith({
        userId: "user-123",
        word: "hello",
        action: "add",
      });
    });
  });

  describe("DELETE /entries/en/:word/unfavorite", () => {
    it("should publish unfavorite event and return 202", async () => {
      const res = await request(app).delete("/entries/en/hello/unfavorite");

      expect(res.status).toBe(202);
      expect(mockedPublishFavorite).toHaveBeenCalledWith({
        userId: "user-123",
        word: "hello",
        action: "remove",
      });
    });
  });
});
