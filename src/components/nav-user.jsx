"use client";

import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/hooks/auth-store";
import { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { useRemove } from "@/hooks/use-api-mutation";
import { ModeToggle } from "./toogle-theme";
import { toast } from "sonner";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, loadFromStorage, isHydrated, logout } = useAuthStore();
  const router = useRouter();
  const { mutate } = useRemove("/logout");

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  if (!isHydrated) return null;

  if (!user) {
    redirect("/login");
    return null;
  }

  const handleLogout = (e) => {
    if (e?.preventDefault) e.preventDefault();

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(
          {},
          {
            onSuccess: () => {
              logout();
              resolve("Logout berhasil");
              redirect("/login");
            },
            onError: (error) => {
              reject(error?.response?.data?.message || "Logout gagal");
            },
          },
        );
      }),
      {
        loading: "Sedang keluar...",
        success: (msg) => msg,
        error: (err) => err,
      },
    );
  };

  const getAvatarUrl = () => {
    if (user?.avatar) {
      if (
        user.avatar.startsWith("http://") ||
        user.avatar.startsWith("https://")
      ) {
        return user.avatar;
      }
      const rawBase =
        process.env.NEXT_PUBLIC_STORAGE_BASE_URL || "http://localhost:8000";
      const baseUrl = String(rawBase).trim().replace(/\/+$/, "");
      const avatarPath = String(user.avatar).replace(/^\/+/, "");
      return `${baseUrl}/storage/${avatarPath}`;
    }
    return "https://i.pinimg.com/736x/4e/46/c2/4e46c274fec161fe63a5dadc3430ef8d.jpg";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              aria-label="Open profile menu"
            >
              <Avatar className="h-8 w-8 rounded-lg ">
                <AvatarImage
                  src={
                    resolveImageUrl(getAvatarUrl()) ||
                    "https://i.pinimg.com/736x/4e/46/c2/4e46c274fec161fe63a5dadc3430ef8d.jpg"
                  }
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user?.email}
                </span>
              </div>

              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={
                      resolveImageUrl(getAvatarUrl()) ||
                      "https://i.pinimg.com/736x/4e/46/c2/4e46c274fec161fe63a5dadc3430ef8d.jpg"
                    }
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email}
                  </span>
                </div>
                <ModeToggle />
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                href="/dashboard/profile"
                className="w-full text-left flex items-center gap-2 cursor-pointer"
              >
                <IconUserCircle />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full text-left flex items-center gap-2"
                onClick={handleLogout}
              >
                <IconLogout />
                Log out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
