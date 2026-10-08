"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/hooks/auth-store";
import { profileSchema } from "@/schema/profile-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import {
  IconEdit,
  IconUser,
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconPhone,
  IconBriefcase,
  IconActivity,
  IconShield,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loadFromStorage, isHydrated, setAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarLink, setAvatarLink] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: uploadAvatar } = usePost("/me/avatar");
  const { mutateAsync: updateProfile } = usePut("/me");

  // Helper untuk mendapatkan avatar URL yang benar
  const getAvatarUrl = () => {
    if (isEditing && avatarLink) return resolveImageUrl(avatarLink);
    if (user?.avatar) return resolveImageUrl(user.avatar);
    return "https://i.pinimg.com/736x/4e/46/c2/4e46c274fec161fe63a5dadc3430ef8d.jpg";
  };

  // Setup Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      currentPassword: "",
      avatar: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Load User Data from localStorage
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Sync User Data to Form
  useEffect(() => {
    if (user && !isEditing) {
      reset({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        password: "",
        currentPassword: "",
        avatar: user?.avatar || "",
      });
      setAvatarLink(user?.avatar || "");
    }
  }, [user, isEditing, reset]);

  if (!isHydrated) return null;

  if (!user) {
    router.push("/login");
    return null;
  }

  // --- Handlers ---

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar_file", avatarFile);
        await toast.promise(uploadAvatar(fd), {
          loading: "Mengunggah avatar...",
          success: "Avatar diperbarui!",
          error: (err) =>
            err?.response?.data?.message || "Gagal mengunggah avatar",
        });
      }

      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone || "",
      };
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
        payload.current_password = data.currentPassword;
      }
      if (data.avatar && data.avatar.trim() !== "") {
        payload.avatar = data.avatar.trim();
      }

      const res = await toast.promise(updateProfile(payload), {
        loading: "Menyimpan perubahan...",
        success: "Profil berhasil diperbarui!",
        error: (err) =>
          err?.response?.data?.message || "Gagal memperbarui profil",
      });

      const updatedUser =
        res?.data?.user?.data || res?.user?.data || res?.data || null;

      if (updatedUser && typeof updatedUser === "object") {
        const token = localStorage.getItem("token");
        setAuth(updatedUser, token);
      } else {
        loadFromStorage();
      }

      setIsEditing(false);
      setAvatarLink("");
      setAvatarFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error.message !== "User ID tidak ditemukan") {
        // toast already handled by promise, tapi fallback di sini jika perlu
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRoleLabel = user?.role?.name || "Member";
  const userStatus = (user?.status || "active").toLowerCase();
  const avatarUrl = getAvatarUrl();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background text-foreground relative w-full">
        {/* Subtle decorative background */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-muted/50 to-transparent pointer-events-none" />

        <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Profile Settings
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage your personal information and account security.
              </p>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="gap-2 shadow-sm"
              >
                <IconEdit size={16} />
                Edit Profile
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Profile Card (Informative & Visual) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-muted" />

                <div className="px-6 pb-6 text-center relative">
                  {/* Avatar Container */}
                  <div className="relative -mt-16 mb-4 inline-block group">
                    <div className="w-32 h-32 rounded-full p-1 bg-card shadow-lg mx-auto">
                      <div className="w-full h-full rounded-full bg-muted overflow-hidden relative">
                        <Image
                          src={resolveImageUrl(avatarUrl)}
                          alt={user?.name || "User"}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* Role Badge overlapping avatar slightly or just below */}
                    <div className="absolute bottom-1 right-2">
                      {/* Status Indicator */}
                      <span
                        className={`flex h-4 w-4 rounded-full border-2 border-card ${userStatus === "active" ? "bg-emerald-500" : "bg-rose-500"}`}
                        title={`Status: ${userStatus}`}
                      ></span>
                    </div>
                  </div>

                  {/* Name & Identity */}
                  <h2 className="text-xl font-bold text-foreground truncate">
                    {user?.name}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-2 mb-4">
                    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2">
                      {userRoleLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {userStatus}
                    </span>
                  </div>

                  {/* Quick Stats / Info List */}
                  <div className="mt-6 pt-6 border-t border-border/50 text-left space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <IconMail className="mr-3 text-primary/70" size={16} />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <IconPhone className="mr-3 text-primary/70" size={16} />
                      <span className="truncate">{user?.phone || "-"}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <IconBriefcase
                        className="mr-3 text-primary/70"
                        size={16}
                      />
                      <span className="truncate">
                        {userRoleLabel} at Langit Langit
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <IconActivity
                        className="mr-3 text-primary/70"
                        size={16}
                      />
                      <span className="truncate">Last active recently</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Edit Form */}
            <div className="lg:col-span-8">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-full"
              >
                {/* Form Sections */}
                <div className="p-6 md:p-8 space-y-8 flex-1">
                  {/* Section 1: Personal Information */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <IconUser size={18} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Personal Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 md:pl-2">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="name">Username</Label>
                        <Input
                          id="name"
                          disabled={!isEditing || isSubmitting}
                          placeholder="Ex: John Doe"
                          {...register("name")}
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && (
                          <p className="text-xs text-destructive">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      {isEditing && (
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="avatar">
                            Link Avatar (Pinterest)
                          </Label>
                          <Input
                            id="avatar"
                            disabled={isSubmitting}
                            placeholder="https://i.pinimg.com/..."
                            {...register("avatar")}
                            onChange={(e) => {
                              register("avatar").onChange(e);
                              setAvatarLink(e.target.value);
                              setAvatarFile(null);
                            }}
                            className={
                              errors.avatar ? "border-destructive" : ""
                            }
                          />
                          {errors.avatar && (
                            <p className="text-xs text-destructive">
                              {errors.avatar.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Masukkan link gambar dari Pinterest (contoh:
                            https://i.pinimg.com/...)
                          </p>
                        </div>
                      )}
                      {isEditing && (
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="avatar_file">Upload Avatar</Label>
                          <Input
                            id="avatar_file"
                            type="file"
                            accept="image/*"
                            disabled={isSubmitting}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                setAvatarFile(null);
                                setAvatarLink(user?.avatar || "");
                                return;
                              }
                              setAvatarFile(file);
                              const previewUrl = URL.createObjectURL(file);
                              setAvatarLink(previewUrl);
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Pilih file gambar dari komputer untuk avatar profil.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  <div className="h-px bg-border/50" />

                  {/* Section 2: Contact Details */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                        <IconMail size={18} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        Contact Details
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 md:pl-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          disabled={!isEditing || isSubmitting}
                          placeholder="you@example.com"
                          {...register("email")}
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                          <p className="text-xs text-destructive">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          disabled={!isEditing || isSubmitting}
                          placeholder="+62 812 3456 7890"
                          {...register("phone")}
                        />
                        {errors.phone && (
                          <p className="text-xs text-destructive">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Section 3: Security (Only in Edit Mode) */}
                  {isEditing && (
                    <>
                      <div className="h-px bg-border/50" />
                      <section className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-500">
                            <IconShield size={18} />
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">
                            Security
                          </h3>
                        </div>

                        <div className="bg-muted/30 border border-border/50 rounded-xl p-5 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">
                              Current Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showCurrentPassword ? "text" : "password"}
                                disabled={isSubmitting}
                                placeholder="Enter current password to change"
                                {...register("currentPassword")}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showCurrentPassword ?
                                  <IconEyeOff size={16} />
                                : <IconEye size={16} />}
                              </button>
                            </div>
                            {errors.currentPassword && (
                              <p className="text-xs text-destructive">
                                {errors.currentPassword.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                disabled={isSubmitting}
                                placeholder="Min. 8 characters"
                                {...register("password")}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showPassword ?
                                  <IconEyeOff size={16} />
                                : <IconEye size={16} />}
                              </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Leave blank if you don&apos;t want to change the
                              password.
                            </p>
                            {errors.password && (
                              <p className="text-xs text-destructive">
                                {errors.password.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </section>
                    </>
                  )}
                </div>

                {/* Footer / Actions */}
                {isEditing && (
                  <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3 sticky bottom-0 z-10">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => {
                        setIsEditing(false);
                        reset();
                        setAvatarLink("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ?
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      : <>
                          <IconDeviceFloppy size={18} className="mr-2" />
                          Save Changes
                        </>
                      }
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
