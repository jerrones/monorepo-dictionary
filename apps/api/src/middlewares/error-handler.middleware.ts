import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("❌ Error:", err.message);

  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => e.message).join(", ");
    res.status(400).json({ message: messages });
    return;
  }

  if (err.message === "NOT_FOUND") {
    res.status(404).json({ message: "Recurso não encontrado" });
    return;
  }

  if (err.message === "CONFLICT") {
    res.status(409).json({ message: "Recurso já existe" });
    return;
  }

  // Generic error — humanized message, no internal info
  res.status(400).json({ message: "Ocorreu um erro ao processar sua requisição" });
}
