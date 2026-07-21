import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePortal, type Role } from '@/lib/portal-store'

export const Route = createFileRoute('/')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const portal = usePortal()
  const [email, setEmail] = useState('admin@portal.io')
  const [password, setPassword] = useState('••••••••')
  const [role, setRole] = useState<Role>('admin')

  useEffect(() => {
    if (portal.role === 'admin') navigate({ to: '/admin' })
    else if (portal.role === 'client') navigate({ to: '/client' })
  }, [portal.role, navigate])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    portal.login(email, role)
    navigate({ to: role === 'admin' ? '/admin' : '/client' })
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(24,24,27,0.06),transparent_60%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center gap-2 justify-center">
          <div className="h-8 w-8 rounded-md bg-zinc-900 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-zinc-50" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            Talent Portal
          </span>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Access your dashboard with your organization credentials.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-zinc-200 bg-zinc-50/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-zinc-200 bg-zinc-50/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Sign in as
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="h-11 border-zinc-200 bg-zinc-50/50 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Login as Admin</SelectItem>
                  <SelectItem value="client">Login as Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
            <Lock className="h-3 w-3" /> Secured by role-based access
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-400">
          Demo credentials work with any values. Use the selector to switch
          roles.
        </p>
      </div>
    </div>
  )
}
