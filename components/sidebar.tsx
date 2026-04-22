'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Shield,
  LayoutDashboard,
  FileText,
  LogOut,
  Users,
  Upload,
  Search,
} from 'lucide-react'

const patientLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/certificates', label: 'My Certificates', icon: FileText },
]

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Registered Users', icon: Users },
  { href: '/admin/upload', label: 'Upload Certificate', icon: Upload },
  { href: '/admin/certificates', label: 'All Certificates', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isAdmin = user?.role === 'admin'
  const links = isAdmin ? adminLinks : patientLinks

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-sidebar-primary/20 rounded-lg">
            <Shield className="h-6 w-6 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">HealthCert</h1>
            <p className="text-xs text-sidebar-foreground/70">
              {isAdmin ? 'Admin Panel' : 'Patient Portal'}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
        
        <Link
          href="/verify"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <Search className="h-5 w-5" />
          Public Verify
        </Link>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-4 px-4">
          <p className="font-medium text-sm truncate">{user?.name}</p>
          <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
          onClick={logout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
