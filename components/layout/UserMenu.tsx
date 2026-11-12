"use client"

import Link from "next/link"
import { LogOut, Settings2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/AuthGuard"
import { Avatar } from "@/components/shared/Avatar"

export function UserMenu() {
  const { user, logout } = useAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 md:pl-3"
          aria-label="Menú de la cuenta"
        >
          <span className="hidden max-w-[10rem] truncate text-sm font-medium lg:inline">{user.name}</span>
          <Avatar name={user.name} color={user.color} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass w-60 rounded-lg p-1.5">
        <DropdownMenuLabel className="px-2.5 py-2 font-normal">
          <p className="truncate text-sm font-medium">{user.name}</p>
          {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-md px-2.5 py-2">
          <Link href="/grupo">
            <Settings2 className="mr-2 h-4 w-4" /> Ajustes del grupo familiar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md px-2.5 py-2 text-destructive focus:text-destructive" onSelect={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
