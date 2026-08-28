"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, QrCode, User } from 'lucide-react'

interface TopNavProps {
  isAdmin?: boolean;
}

export default function TopNav({ isAdmin = false }: TopNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Home',
      href: '/checkin',
      icon: <Home className="w-4 h-4 mr-2" />
    },
    {
      name: isAdmin ? 'Scanner' : 'My QR',
      href: isAdmin ? '/checkin/admin' : '/membership',
      icon: <QrCode className="w-4 h-4 mr-2" />
    },
    {
      name: 'Profile',
      href: isAdmin ? '/checkin/admin' : '/membership/profile',
      icon: <User className="w-4 h-4 mr-2" />
    },
  ]

  return (
    <nav className="hidden md:flex w-full bg-background border-b border-border z-40 fixed top-0 left-0 right-0 h-16 items-center px-8 justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-primary">SASE Check-In</span>
      </div>
      <div className="flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.href + item.name}
            href={item.href}
            className={`flex items-center text-sm font-medium transition-colors ${
              pathname === item.href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  )
}
