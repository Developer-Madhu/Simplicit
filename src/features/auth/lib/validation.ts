import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid work email address."),
  password: z.string().min(1, "Password is required."),
  keepSignedIn: z.boolean().optional(),
});

export type SignInSchema = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Please enter a valid work email address."),
  password: z.string().min(12, "Password must be at least 12 characters."),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid work email address."),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
