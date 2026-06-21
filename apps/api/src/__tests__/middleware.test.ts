import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mock.jwt.token"),
    verify: vi.fn((token: string) => {
      if (token === "valid-token") {
        return { userId: "user-123", name: "Test User" };
      }
      throw new Error("invalid token");
    }),
  },
}));

import { authMiddleware, generateToken } from "../middlewares/auth.middleware.js";
import { errorHandlerMiddleware } from "../middlewares/error-handler.middleware.js";
import { ZodError, ZodIssue } from "zod";

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function createMockReq(headers: Record<string, string> = {}): Request {
  return {
    headers,
  } as unknown as Request;
}

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when no Authorization header", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token não fornecido" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when Authorization header is malformed", () => {
    const req = createMockReq({ authorization: "InvalidFormat" });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token mal formatado" });
  });

  it("should return 401 when token is invalid", () => {
    const req = createMockReq({ authorization: "Bearer bad-token" });
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token inválido ou expirado" });
  });

  it("should call next() and set userId for valid token", () => {
    const req = createMockReq({ authorization: "Bearer valid-token" }) as any;
    const res = createMockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe("user-123");
    expect(req.userName).toBe("Test User");
  });
});

describe("generateToken", () => {
  it("should return a string token", () => {
    const token = generateToken("user-123", "Test");
    expect(typeof token).toBe("string");
  });
});

describe("Error Handler Middleware", () => {
  it("should handle ZodError with 400 and joined messages", () => {
    const zodIssues: ZodIssue[] = [
      { code: "too_small", minimum: 2, type: "string", inclusive: true, exact: false, message: "Nome muito curto", path: ["name"] },
      { code: "invalid_type", expected: "string", received: "undefined", message: "Email é obrigatório", path: ["email"] },
    ];
    const err = new ZodError(zodIssues);
    const req = {} as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Nome muito curto, Email é obrigatório",
    });
  });

  it("should handle NOT_FOUND errors with 404", () => {
    const err = new Error("NOT_FOUND");
    const req = {} as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should handle CONFLICT errors with 409", () => {
    const err = new Error("CONFLICT");
    const req = {} as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("should handle generic errors with 400 and humanized message", () => {
    const err = new Error("Some internal error stack trace");
    const req = {} as Request;
    const res = createMockRes();
    const next = vi.fn() as NextFunction;

    errorHandlerMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Ocorreu um erro ao processar sua requisição",
    });
  });
});
