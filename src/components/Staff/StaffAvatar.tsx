import type { StaffMember } from "@/services/api";
import { photoUrl } from "@/services/listing-photos";
import { initials } from "@/services/staff";
import { cn } from "@/lib/utils";

export default function StaffAvatar({ member, className }: { member: Pick<StaffMember, "name" | "photoUrl">; className?: string }) {
  return <span title={member.name} className={cn("grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary", className)}>
    {member.photoUrl ? <img src={photoUrl(member.photoUrl)} alt="" className="size-full object-cover" /> : initials(member.name)}
  </span>;
}
