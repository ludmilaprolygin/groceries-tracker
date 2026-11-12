import { UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/shared/Avatar"
import type { GroceryItem, User } from "@/lib/types"

interface MemberListProps {
  users: User[]
  items: GroceryItem[]
  currentUserId: string
  onRemove: (user: User) => void
}

export function MemberList({ users, items, currentUserId, onRemove }: MemberListProps) {
  return (
    <ul className="glass divide-y divide-border/70 overflow-hidden rounded-lg">
      {users.map((user) => {
        const itemCount = items.filter((item) => item.allowedUsers.includes(user.id)).length
        const isMe = user.id === currentUserId
        return (
          <li key={user.id} className="flex items-center gap-3 px-4 py-3.5 md:px-5">
            <Avatar name={user.name} color={user.color} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-[15px] font-medium">
                {user.name}
                {isMe && (
                  <span className="rounded-[4px] bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Vos
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
                {user.email && !isMe ? ` · ${user.email}` : ""}
              </p>
            </div>
            {!isMe && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(user)}
                aria-label={`Quitar a ${user.name}`}
                className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <UserMinus className="!size-4" />
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
