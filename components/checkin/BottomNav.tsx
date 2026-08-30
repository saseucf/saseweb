"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, QrCode, User } from 'lucide-react'

interface BottomNavProps {
  isAdmin?: boolean;
}

export default function BottomNav({ isAdmin = false }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Home',
      href: '/checkin',
      icon: <Home className="w-5 h-5" />
    },
    {
      name: isAdmin ? 'Scanner' : 'My QR',
      href: isAdmin ? '/checkin/admin' : '/membership',
      icon: <QrCode className="w-5 h-5" />
    },
    {
      name: 'Profile',
      href: isAdmin ? '/checkin/admin' : '/membership/profile',
      icon: <User className="w-5 h-5" />
    },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe z-40 max-w-md mx-auto">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.href + item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              pathname === item.href ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-5 h-5">{item.icon}</span>
            <span className="text-[10px] font-medium mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
