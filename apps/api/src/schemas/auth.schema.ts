import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z
    .string({ required_error: "Email é obrigatório" })
    .email("Email inválido"),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(4, "Senha deve ter pelo menos 4 caracteres"),
});

export const signinSchema = z.object({
  email: z
    .string({ required_error: "Email é obrigatório" })
    .email("Email inválido"),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(1, "Senha é obrigatória"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
