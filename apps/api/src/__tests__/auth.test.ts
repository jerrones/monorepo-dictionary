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

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "hashed_password"),
    compare: vi.fn(async (password: string) => password === "test"),
  },
}));

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mock.jwt.token"),
    verify: vi.fn(),
  },
}));

import { query } from "../db.js";
import authRoutes from "../routes/auth.routes.js";
import { errorHandlerMiddleware } from "../middlewares/error-handler.middleware.js";

const mockedQuery = vi.mocked(query);

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/auth", authRoutes);
  app.use(errorHandlerMiddleware);
  return app;
}

describe("Auth Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe("POST /auth/signup", () => {
    it("should create a user and return token", async () => {
      mockedQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // email check
        .mockResolvedValueOnce({
          rows: [{ id: "uuid-123", name: "User 1" }],
          rowCount: 1,
        } as any); // insert user

      const res = await request(app)
        .post("/auth/signup")
        .send({ name: "User 1", email: "test@email.com", password: "test" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", "uuid-123");
      expect(res.body).toHaveProperty("name", "User 1");
      expect(res.body).toHaveProperty("token");
      expect(res.body.token).toContain("Bearer");
    });

    it("should return 400 when email already exists", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: "existing" }],
        rowCount: 1,
      } as any);

      const res = await request(app)
        .post("/auth/signup")
        .send({ name: "User 1", email: "existing@email.com", password: "test" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email já cadastrado");
    });

    it("should return 400 for invalid input (missing name)", async () => {
      const res = await request(app)
        .post("/auth/signup")
        .send({ email: "test@email.com", password: "test" });

      expect(res.status).toBe(400);
    });

    it("should return 400 for invalid email format", async () => {
      const res = await request(app)
        .post("/auth/signup")
        .send({ name: "User", email: "not-an-email", password: "test" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/signin", () => {
    it("should login and return token", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: "uuid-123", name: "User 1", password_hash: "hashed" }],
        rowCount: 1,
      } as any);

      const res = await request(app)
        .post("/auth/signin")
        .send({ email: "test@email.com", password: "test" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", "uuid-123");
      expect(res.body).toHaveProperty("token");
    });

    it("should return 400 for non-existing email", async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const res = await request(app)
        .post("/auth/signin")
        .send({ email: "nobody@email.com", password: "test" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email ou senha inválidos");
    });

    it("should return 400 for wrong password", async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [{ id: "uuid-123", name: "User 1", password_hash: "hashed" }],
        rowCount: 1,
      } as any);

      const res = await request(app)
        .post("/auth/signin")
        .send({ email: "test@email.com", password: "wrong" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Email ou senha inválidos");
    });
  });
});
