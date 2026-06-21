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
import userRoutes from "../routes/user.routes.js";
import { errorHandlerMiddleware } from "../middlewares/error-handler.middleware.js";

const mockedQuery = vi.mocked(query);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/user", userRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe("User Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe("GET /user/me", () => {
    it("should return user profile", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "user-123",
            name: "Test User",
            email: "test@email.com",
            created_at: "2024-01-01T00:00:00.000Z",
          },
        ],
        rowCount: 1,
      } as any);

      const res = await request(app).get("/user/me");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: "user-123",
        name: "Test User",
        email: "test@email.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should return 404 when user not found", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app).get("/user/me");

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Usuário não encontrado");
    });
  });

  describe("GET /user/me/history", () => {
    it("should return paginated history", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ count: "2" }], rowCount: 1 } as any) // count
        .mockResolvedValueOnce({
          rows: [
            { id: 1, word: "fire", added_at: "2024-05-05T19:28:13.531Z" },
            { id: 2, word: "hello", added_at: "2024-05-05T19:29:00.000Z" },
          ],
          rowCount: 2,
        } as any); // data

      const res = await request(app).get("/user/me/history?limit=10");

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0]).toHaveProperty("word", "fire");
      expect(res.body.results[0]).toHaveProperty("added");
      expect(res.body.totalDocs).toBe(2);
    });
  });

  describe("GET /user/me/favorites", () => {
    it("should return paginated favorites", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ count: "1" }], rowCount: 1 } as any)
        .mockResolvedValueOnce({
          rows: [
            { word: "fire", added_at: "2024-05-05T19:30:23.928Z" },
          ],
          rowCount: 1,
        } as any);

      const res = await request(app).get("/user/me/favorites?limit=10");

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).toEqual({
        word: "fire",
        added: "2024-05-05T19:30:23.928Z",
      });
    });

    it("should return empty results when no favorites", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app).get("/user/me/favorites");

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(0);
      expect(res.body.totalDocs).toBe(0);
    });
  });
});
