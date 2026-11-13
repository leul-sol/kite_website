import {
  BadgeCheck, BarChart3, Boxes, LayoutDashboard, MessageSquare, Package, ScrollText, ShieldAlert,
  CalendarDays, ShoppingBag, Sparkles, Store, Users, Wallet, type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; description: string };
export type NavGroup = { label: string; items: NavItem[] };

/** Portal navigation, grouped the way providers think about their business. */
export const NAV: NavGroup[] = [
  { label: "Overview", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Today at a glance" },
    { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Bookings and earnings over time" },
  ] },
  { label: "Business", items: [
    { href: "/listings", label: "Listings", icon: Package, description: "Rentals and services you offer" },
    { href: "/inventory", label: "Inventory", icon: Boxes, description: "Stock, damage and repairs" },
    { href: "/setups", label: "Setups", icon: Sparkles, description: "Complete event packages" },
    { href: "/orders", label: "Orders", icon: ShoppingBag, description: "Bookings from customers" },
    { href: "/staff", label: "Schedule", icon: CalendarDays, description: "Who works each booking" },
    { href: "/team", label: "Team", icon: Users, description: "Your people and their sign-in" },
    { href: "/messages", label: "Messages", icon: MessageSquare, description: "Questions from customers" },
    { href: "/disputes", label: "Disputes", icon: ShieldAlert, description: "Reported issues" },
  ] },
  { label: "Money", items: [
    { href: "/wallet", label: "Wallet", icon: Wallet, description: "Balance, earnings and withdrawals" },
    { href: "/policies", label: "Policies", icon: ScrollText, description: "Cancellation and booking rules" },
  ] },
  { label: "Profile", items: [
    { href: "/storefront", label: "Storefront", icon: Store, description: "What customers see about you" },
    { href: "/verification", label: "Verification", icon: BadgeCheck, description: "Business documents and review" },
  ] },
];

export const ALL_NAV = NAV.flatMap(group => group.items);

export function navItemFor(pathname: string): NavItem | undefined {
  return ALL_NAV.find(item => pathname === item.href || pathname.startsWith(item.href + "/"));
}
