import { Router, Request, Response } from "express";
import type { Router as RouterType } from "express";
import bcrypt from "bcryptjs";
import { signupSchema, signinSchema } from "../schemas/auth.schema.js";
import { generateToken } from "../middlewares/auth.middleware.js";
import { query } from "../db.js";

const router: RouterType = Router();

// POST /auth/signup
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const parsed = signupSchema.parse(req.body);

  // Check if email already exists
  const existing = await query("SELECT id FROM users WHERE email = $1", [parsed.email]);

  if (existing.rows.length > 0) {
    res.status(400).json({ message: "Email já cadastrado" });
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(parsed.password, 10);

  // Insert user
  const result = await query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name",
    [parsed.name, parsed.email, passwordHash]
  );

  const user = result.rows[0];
  const token = generateToken(user.id, user.name);

  res.status(200).json({
    id: user.id,
    name: user.name,
    token: `Bearer ${token}`,
  });
});

// POST /auth/signin
router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  const parsed = signinSchema.parse(req.body);

  // Find user
  const result = await query(
    "SELECT id, name, password_hash FROM users WHERE email = $1",
    [parsed.email]
  );

  if (result.rows.length === 0) {
    res.status(400).json({ message: "Email ou senha inválidos" });
    return;
  }

  const user = result.rows[0];

  // Compare password
  const isValid = await bcrypt.compare(parsed.password, user.password_hash);

  if (!isValid) {
    res.status(400).json({ message: "Email ou senha inválidos" });
    return;
  }

  const token = generateToken(user.id, user.name);

  res.status(200).json({
    id: user.id,
    name: user.name,
    token: `Bearer ${token}`,
  });
});

export default router;
