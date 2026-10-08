import { z } from "zod";

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(255, { message: "Name must not exceed 255 characters." }),
    email: z
      .string()
      .email({ message: "Please enter a valid email address." })
      .max(255, { message: "Email must not exceed 255 characters." }),
    phone: z
      .string()
      .max(20, { message: "Phone must not exceed 20 characters." })
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string()
      .min(8, { message: "Please confirm your password." }),
    role_id: z.string({
      required_error: "Please select a role.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
