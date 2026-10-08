"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function Nav({
  items,
  title = " ",
  className = "",
  defaultOpen = true,
  collapsible = true,
}) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState([]);
  const [isGroupOpen, setIsGroupOpen] = useState(defaultOpen);

  const toggleItem = (itemKey) => {
    setOpenItems((prev) =>
      prev.includes(itemKey)
        ? prev.filter((item) => item !== itemKey)
        : [...prev, itemKey]
    );
  };

  // Helper function untuk menentukan apakah item aktif
  // Hanya item yang paling spesifik yang akan aktif
  const getIsActive = (itemUrl, allItems, subItems = null) => {
    if (!pathname || !itemUrl || itemUrl === "#") return false;

    // Dashboard hanya aktif jika exact match - tidak pernah aktif untuk sub-paths
    if (itemUrl === "/dashboard") {
      return pathname === itemUrl;
    }

    // Exact match - selalu aktif kecuali ada sub-item yang aktif
    if (pathname === itemUrl) {
      // Jika item ini punya sub-items, cek apakah ada sub-item yang aktif
      if (subItems && Array.isArray(subItems) && subItems.length > 0) {
        const hasActiveSubItem = subItems.some(
          (subItem) =>
            pathname === subItem.url || pathname.startsWith(subItem.url + "/")
        );
        if (hasActiveSubItem) return false;
      }
      return true;
    }

    // Untuk path lain, cek apakah pathname dimulai dengan itemUrl + "/"
    if (pathname.startsWith(itemUrl + "/")) {
      // Jika item ini punya sub-items, cek apakah ada sub-item yang cocok
      if (subItems && Array.isArray(subItems) && subItems.length > 0) {
        const hasMatchingSubItem = subItems.some(
          (subItem) =>
            pathname.startsWith(subItem.url + "/") || pathname === subItem.url
        );
        if (hasMatchingSubItem) return false;
      }

      // Cek apakah ada item lain yang lebih spesifik (lebih panjang URL-nya)
      const hasMoreSpecificMatch = allItems.some(
        (otherItem) =>
          otherItem.url !== itemUrl &&
          otherItem.url !== "#" &&
          pathname.startsWith(otherItem.url + "/") &&
          otherItem.url.length > itemUrl.length
      );

      // Jika tidak ada yang lebih spesifik, item ini aktif
      return !hasMoreSpecificMatch;
    }

    return false;
  };

  // Jika tidak collapsible, render tanpa Collapsible wrapper
  if (!collapsible) {
    return (
      <SidebarGroup
        className={cn("group-data-[collapsible=icon]:px-0", className)}
      >
        {title && title.trim() !== " " && (
          <SidebarGroupLabel>{title}</SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const hasSubItems =
                item.items &&
                Array.isArray(item.items) &&
                item.items.length > 0;
              const itemKey = item.name || item.title || "";
              const isOpen = openItems.includes(itemKey);
              const isActive = getIsActive(
                item.url,
                items,
                hasSubItems ? item.items : null
              );

              if (hasSubItems) {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={itemKey}>
                    <SidebarMenuButton
                      onClick={() => toggleItem(itemKey)}
                      isActive={isActive}
                      tooltip={
                        state === "collapsed"
                          ? item.name || item.title
                          : undefined
                      }
                    >
                      {IconComponent && <IconComponent />}
                      <span>{item.name || item.title}</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto transition-transform duration-200",
                          isOpen && "rotate-90"
                        )}
                      />
                    </SidebarMenuButton>
                    {isOpen && (
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubActive = getIsActive(
                            subItem.url,
                            item.items
                          );
                          return (
                            <SidebarMenuSubItem
                              key={subItem.title || subItem.name}
                            >
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title || subItem.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              }

              const IconComponent = item.icon;
              return (
                <SidebarMenuItem key={itemKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={state === "collapsed" ? item.name : undefined}
                  >
                    <Link href={item.url}>
                      {IconComponent && <IconComponent />}
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Jika collapsible, render dengan Collapsible wrapper
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      open={isGroupOpen}
      onOpenChange={setIsGroupOpen}
      className="group/collapsible"
    >
      <SidebarGroup
        className={cn("group-data-[collapsible=icon]:px-0", className)}
      >
        {title && title.trim() !== " " && (
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="w-full cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors">
              <span className="flex-1 text-left">{title}</span>
              <ChevronRight
                className={cn(
                  "ml-auto size-4 transition-transform duration-200 text-sidebar-foreground/50",
                  "group-data-[state=open]/collapsible:rotate-90"
                )}
              />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
        )}
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const hasSubItems =
                  item.items &&
                  Array.isArray(item.items) &&
                  item.items.length > 0;
                const itemKey = item.name || item.title || "";
                const isOpen = openItems.includes(itemKey);
                const isActive = getIsActive(
                  item.url,
                  items,
                  hasSubItems ? item.items : null
                );

                if (hasSubItems) {
                  const IconComponent = item.icon;
                  return (
                    <SidebarMenuItem key={itemKey}>
                      <SidebarMenuButton
                        onClick={() => toggleItem(itemKey)}
                        isActive={isActive}
                        tooltip={
                          state === "collapsed"
                            ? item.name || item.title
                            : undefined
                        }
                      >
                        {IconComponent && <IconComponent />}
                        <span>{item.name || item.title}</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto transition-transform duration-200",
                            isOpen && "rotate-90"
                          )}
                        />
                      </SidebarMenuButton>
                      {isOpen && (
                        <SidebarMenuSub>
                          {item.items.map((subItem) => {
                            const isSubActive = getIsActive(
                              subItem.url,
                              item.items
                            );
                            return (
                              <SidebarMenuSubItem
                                key={subItem.title || subItem.name}
                              >
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubActive}
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title || subItem.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={itemKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={state === "collapsed" ? item.name : undefined}
                    >
                      <Link href={item.url}>
                        {IconComponent && <IconComponent />}
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
