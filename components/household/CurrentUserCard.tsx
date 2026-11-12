import { Avatar } from "@/components/shared/Avatar"
import type { User } from "@/lib/types"

export function CurrentUserCard({ user }: { user: User }) {
  return (
    <div className="glass flex items-center gap-4 rounded-lg p-5">
      <Avatar name={user.name} color={user.color} size="lg" />
      <div className="min-w-0">
        <p className="truncate font-display text-2xl leading-tight">{user.name}</p>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
    </div>
  )
}
