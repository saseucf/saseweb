"use client";
import "./globals.css";
import { ModeToggle } from "@/components/modechanger";
import { Geist } from 'next/font/google'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { ThemeProvider } from "@/components/themeprovider";
import Link from "next/link";
import Image from "next/image";
import saselogo from "@/public/saselogo.png";
import { Home } from "lucide-react";
import { Calendar } from "lucide-react";
import { Info } from "lucide-react";
import { Book } from "lucide-react";
import { File } from "lucide-react";
import { Trophy } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import supabase from "@/lib/auth";

const geist = Geist({
    subsets: ['latin'],
    display: 'swap',
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // call unsubscribe to remove the callback

    useEffect(() => {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log(event, session)
            if (event === 'INITIAL_SESSION') {
                // handle initial session
            } else if (event === 'SIGNED_IN') {
                setIsLoggedIn(true);
            } else if (event === 'SIGNED_OUT') {
                // handle sign out event
                setIsLoggedIn(false);
            }
        })
        AOS.init({
        });
    }, []);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <html lang="en" className={geist.className}>
            <body>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <div className="p-2 flex items-center">
                        <Link href={"/"} className="flex-shrink-0">
                            <Image
                                src={saselogo}
                                alt="saselogo"
                                height={100}
                                width={100}
                                className="flex-none"
                            />
                        </Link>
                        {/* Desktop Navbar */}
                        <div className="hidden md:flex items-center gap-4 ml-auto">
                            <NavigationMenu className="font-extrabold">
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <Link href={'/'}>
                                            <NavigationMenuLink>
                                                <p>
                                                    <Home className="inline" size={16} /> Home
                                                </p>
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/about"}>
                                                <NavigationMenuTrigger className="font-extrabold">
                                                    <p>
                                                        <Info className="inline" size={16} /> About
                                                    </p>
                                                </NavigationMenuTrigger>
                                                {/* <NavigationMenuContent>
                                                    <NavigationMenuLink>Info</NavigationMenuLink>
                                                </NavigationMenuContent> */}
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/events"}>
                                                <NavigationMenuTrigger className="font-extrabold">
                                                    <p>
                                                        <Calendar className="inline" size={16} /> Events
                                                    </p>
                                                </NavigationMenuTrigger>
                                                {/* <NavigationMenuContent>
                                                    <NavigationMenuLink>Link</NavigationMenuLink>
                                                </NavigationMenuContent> */}
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/programs"}>
                                                <NavigationMenuTrigger className="font-extrabold">
                                                    <p>
                                                        <File className="inline" size={16} /> Programs
                                                    </p>
                                                </NavigationMenuTrigger>
                                                {/* <NavigationMenuContent>
                                                    <NavigationMenuLink>Link</NavigationMenuLink>
                                                </NavigationMenuContent> */}
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/resources"}>
                                                <NavigationMenuLink>
                                                    <p>
                                                        <Book className="inline" /> Resources
                                                    </p>
                                                </NavigationMenuLink>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/leaderboard"}>
                                                <NavigationMenuLink>
                                                    <p>
                                                        <Trophy className="inline" /> Leaderboard
                                                    </p>
                                                </NavigationMenuLink>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            {isLoggedIn ? (
                                                <Link href={`/profile`}>
                                                    <Avatar>
                                                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                                        <AvatarFallback>CN</AvatarFallback>
                                                    </Avatar>
                                                </Link>
                                            ) : (
                                                <Link href={"/login"}>
                                                    <Button variant="outline" className="font-extrabold gap-x-100">
                                                        <p>Login</p>
                                                    </Button>
                                                </Link>
                                            )}
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                        {/* Mobile Hamburger */}
                        <div className="md:hidden flex items-center ml-auto">
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Open menu"
                                onClick={() => setMobileMenuOpen((open) => !open)}
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </Button>
                            <div className="ml-2">
                                <ModeToggle />
                            </div>
                        </div>
                        {/* Desktop ModeToggle */}
                        <div className="hidden md:block ml-2">
                            <ModeToggle />
                        </div>
                    </div>
                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden bg-background border-b border-border px-4 py-2 z-50 w-full">
                            <nav className="flex flex-col gap-2">
                                <Link href={'/'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2">
                                        <Home className="inline" size={16} /> Home
                                    </div>
                                </Link>
                                <Link href={'/about'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2">
                                        <Info className="inline" size={16} /> About
                                    </div>
                                </Link>
                                <Link href={'/events'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2">
                                        <Calendar className="inline" size={16} /> Events
                                    </div>
                                </Link>
                                <Link href={'/programs'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2">
                                        <File className="inline" size={16} /> Programs
                                    </div>
                                </Link>
                                <Link href={'/resources'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2">
                                        <Book className="inline" size={16} /> Resources
                                    </div>
                                </Link>
                                <Link href={'/leaderboard'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2">
                                        <Trophy className="inline" size={16} /> Leaderboard
                                    </div>
                                </Link>
                                {isLoggedIn ? (
                                    <Link href={`/profile`} onClick={() => setMobileMenuOpen(false)}>
                                        <div className="flex items-center gap-2 py-2">
                                            <Avatar>
                                                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                                <AvatarFallback>CN</AvatarFallback>
                                            </Avatar>
                                            Profile
                                        </div>
                                    </Link>
                                ) : (
                                    <Link href={"/login"} onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="outline" className="font-extrabold w-full">
                                            Login
                                        </Button>
                                    </Link>
                                )}
                            </nav>
                        </div>
                    )}
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
