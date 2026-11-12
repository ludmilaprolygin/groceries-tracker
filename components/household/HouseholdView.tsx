"use client"

import { useAuth } from "@/components/auth/AuthGuard"
import { AccessKeyCard } from "@/components/household/AccessKeyCard"
import { CurrentUserCard } from "@/components/household/CurrentUserCard"
import { MemberList } from "@/components/household/MemberList"
import { useData } from "@/components/providers/DataProvider"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { toast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

export function HouseholdView() {
  const { user: currentUser } = useAuth()
  const { users, items, deleteUser, accessKey, regenerateAccessKey } = useData()

  const removeUser = async (user: User) => {
    if (user.id === currentUser.id) {
      toast({
        title: "No se puede eliminar el usuario actual",
        description: "No podés eliminarte a vos mismo del grupo familiar.",
        variant: "destructive",
      })
      return
    }
    await deleteUser(user.id)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <SectionHeader eyebrow="Grupo familiar" title="Miembros" />

      <div className="grid gap-4 md:grid-cols-5 md:gap-6">
        <div className="space-y-4 md:col-span-2 md:space-y-6">
          <CurrentUserCard user={currentUser} />
          <AccessKeyCard accessKey={accessKey} onRegenerate={regenerateAccessKey} />
        </div>

        <div className="md:col-span-3">
          <MemberList users={users} items={items} currentUserId={currentUser.id} onRemove={removeUser} />
        </div>
      </div>
    </div>
  )
}
