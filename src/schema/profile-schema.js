import { z } from "zod";

export const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Nama minimal 3 karakter")
      .max(100, "Nama maksimal 100 karakter"),

    email: z
      .string()
      .trim()
      .email("Email tidak valid")
      .max(150, "Email maksimal 150 karakter"),

    phone: z
      .string()
      .trim()
      .max(20, "Nomor telepon maksimal 20 karakter")
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length >= 6,
        "Password minimal 6 karakter jika diisi",
      )
      .refine(
        (val) => !val || /^[^\s]+$/.test(val),
        "Password tidak boleh mengandung spasi",
      ),

    currentPassword: z.string().optional(),

    avatar: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // Jika password baru diisi, currentPassword wajib diisi
      if (data.password && data.password.length > 0) {
        return data.currentPassword && data.currentPassword.length > 0;
      }
      return true;
    },
    {
      message: "Password lama wajib diisi jika ingin mengubah password",
      path: ["currentPassword"],
    },
  );
