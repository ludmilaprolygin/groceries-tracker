"use client"

import type { Session } from "@supabase/supabase-js"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleIcon } from "@/components/auth/GoogleIcon"
import { BrandMark } from "@/components/layout/BrandMark"
import { FieldLabel } from "@/components/shared/FieldLabel"

interface LoginScreenProps {
  /** Google session without a linked household member yet (first login), or null when signed out. */
  session: Session | null
  isSubmitting: boolean
  userName: string
  accessKey: string
  onUserNameChange: (value: string) => void
  onAccessKeyChange: (value: string) => void
  onGoogleLogin: () => void
  onJoin: () => void
  onSwitchAccount: () => void
}

export function LoginScreen({
  session,
  isSubmitting,
  userName,
  accessKey,
  onUserNameChange,
  onAccessKeyChange,
  onGoogleLogin,
  onJoin,
  onSwitchAccount,
}: LoginScreenProps) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      {/* Soft warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(ellipse_at_top,hsl(0_0%_100%/0.7),transparent_70%)] dark:opacity-20"
      />

      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12">
        <div className="glass rounded-lg p-6 sm:p-8">
          <div className="mb-8">
            <BrandMark className="mb-8" />
            <h1 className="font-display text-[2.25rem] leading-[1.05]">
              {session ? (
                <>
                  Ya casi <span className="text-muted-foreground">estás.</span>
                </>
              ) : (
                <>
                  Tu casa, <span className="text-muted-foreground">en orden</span> sin esfuerzo.
                </>
              )}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {session ? (
                <>
                  Iniciaste sesión como <span className="font-medium text-foreground">{session.user.email}</span>.
                  Ingresá la clave de acceso que te compartió alguien de tu grupo familiar para unirte.
                </>
              ) : (
                "Sabé qué tenés, dónde está guardado y qué falta comprar, compartido con tu grupo familiar."
              )}
            </p>
          </div>

          {!session ? (
            <Button
              onClick={onGoogleLogin}
              className="h-12 w-full gap-3 text-[15px]"
              variant="outline"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
              {isSubmitting ? "Redirigiendo…" : "Continuar con Google"}
            </Button>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-2">
                <FieldLabel htmlFor="new-user-name">Tu nombre</FieldLabel>
                <Input
                  id="new-user-name"
                  value={userName}
                  onChange={(e) => onUserNameChange(e.target.value)}
                  placeholder="¿Cómo te llamamos?"
                  className="h-12"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="access-key">Clave de acceso</FieldLabel>
                <Input
                  id="access-key"
                  type="password"
                  value={accessKey}
                  onChange={(e) => onAccessKeyChange(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 font-mono"
                />
              </div>

              <Button
                onClick={onJoin}
                className="h-12 w-full text-[15px]"
                disabled={isSubmitting || !userName.trim() || !accessKey.trim()}
              >
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? "Creando cuenta…" : "Unirme al grupo"}
              </Button>

              <Button
                onClick={onSwitchAccount}
                variant="ghost"
                className="w-full text-muted-foreground"
                disabled={isSubmitting}
              >
                Usar otra cuenta de Google
              </Button>
            </div>
          )}

          <p className="mt-8 border-t border-foreground/10 pt-5 text-xs leading-relaxed text-muted-foreground">
            ¿No tenés clave de acceso? Pedísela a alguien del grupo: la encuentra en la sección Grupo familiar.
          </p>
        </div>
      </main>
    </div>
  )
}
