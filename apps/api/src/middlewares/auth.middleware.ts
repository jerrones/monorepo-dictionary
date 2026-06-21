import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-dev-key";

export interface AuthRequest extends Request {
  userId?: string;
  userName?: string;
}

interface JwtPayload {
  userId: string;
  name: string;
}

export function generateToken(userId: string, name: string): string {
  return jwt.sign({ userId, name } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Token não fornecido" });
    return;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ message: "Token mal formatado" });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    req.userName = decoded.name;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido ou expirado" });
  }
}
