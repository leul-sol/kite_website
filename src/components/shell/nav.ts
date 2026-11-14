import {
  BadgeCheck, BarChart3, Boxes, LayoutDashboard, MessageSquare, Package, ScrollText, ShieldAlert,
  CalendarDays, ShoppingBag, Sparkles, Store, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/i18n/translate";

/** `key` names the item's text: nav.<key> (label) and nav.<key>.desc (description). */
export type NavItem = { href: string; key: string; icon: LucideIcon };
export type NavGroup = { key: string; items: NavItem[] };

/** Portal navigation, grouped the way providers think about their business. */
export const NAV: NavGroup[] = [
  { key: "overview", items: [
    { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
    { href: "/analytics", key: "analytics", icon: BarChart3 },
  ] },
  { key: "business", items: [
    { href: "/listings", key: "listings", icon: Package },
    { href: "/inventory", key: "inventory", icon: Boxes },
    { href: "/setups", key: "setups", icon: Sparkles },
    { href: "/orders", key: "orders", icon: ShoppingBag },
    { href: "/staff", key: "staff", icon: CalendarDays },
    { href: "/team", key: "team", icon: Users },
    { href: "/messages", key: "messages", icon: MessageSquare },
    { href: "/disputes", key: "disputes", icon: ShieldAlert },
  ] },
  { key: "money", items: [
    { href: "/wallet", key: "wallet", icon: Wallet },
    { href: "/policies", key: "policies", icon: ScrollText },
  ] },
  { key: "profile", items: [
    { href: "/storefront", key: "storefront", icon: Store },
    { href: "/verification", key: "verification", icon: BadgeCheck },
  ] },
];

export const ALL_NAV = NAV.flatMap(group => group.items);

export const navLabel = (item: NavItem) => `nav.${item.key}` as MessageKey;
export const navDescription = (item: NavItem) => `nav.${item.key}.desc` as MessageKey;
export const groupLabel = (group: NavGroup) => `nav.group.${group.key}` as MessageKey;

export function navItemFor(pathname: string): NavItem | undefined {
  return ALL_NAV.find(item => pathname === item.href || pathname.startsWith(item.href + "/"));
}
