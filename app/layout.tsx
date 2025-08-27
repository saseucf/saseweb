"use client";
import "./globals.css";
import { ModeToggle } from "@/components/modechanger";
import { Geist } from 'next/font/google'
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuContent
} from "@/components/ui/navigation-menu"
import { ThemeProvider } from "@/components/themeprovider";
import Link from "next/link";
import Image from "next/image";
import saselogo from "@/public/saselogo.png";
import { Home, Info, Calendar, Share2, File, Trophy, ArrowDown } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaInstagram } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { FaChessKnight } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
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
    const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
    const [socialsubmenuOpen, setSocialSubmenuOpen] = useState(false);

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
                                                <NavigationMenuContent>
                                                    <NavigationMenuLink asChild><Link href="/about/board">Board</Link></NavigationMenuLink>
                                                    <NavigationMenuLink asChild><Link href="/about/sponsors">Sponsors</Link></NavigationMenuLink>
                                                </NavigationMenuContent>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/events"}>
                                                <NavigationMenuLink className="font-extrabold">
                                                    <p>
                                                        <Calendar className="inline" size={16} /> Events
                                                    </p>
                                                </NavigationMenuLink>
                                                {/* <NavigationMenuContent>
                                                    <NavigationMenuLink>Link</NavigationMenuLink>
                                                </NavigationMenuContent> */}
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/programs"}>
                                                <NavigationMenuLink className="font-extrabold">
                                                    <p>
                                                        <File className="inline" size={16} /> Programs
                                                    </p>
                                                </NavigationMenuLink>
                                                {/* <NavigationMenuContent>
                                                    <NavigationMenuLink>Link</NavigationMenuLink>
                                                </NavigationMenuContent> */}
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <NavigationMenuTrigger className="font-extrabold">
                                                <p>
                                                    <Share2 className="inline" /> Socials
                                                </p>
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent>
                                                <NavigationMenuLink asChild><Link href="https://www.instagram.com/saseucf/"><p>
                                                    <FaInstagram className="inline"></FaInstagram>  Instagram
                                                </p></Link></NavigationMenuLink>
                                                <NavigationMenuLink asChild><Link href="https://www.linkedin.com/company/ucf-sase/"><p>
                                                    <FaLinkedin className="inline"></FaLinkedin>  Linkedin
                                                </p></Link></NavigationMenuLink>
                                                <NavigationMenuLink asChild><Link href="https://discord.gg/PK8e6KwAQS"><p>
                                                    <FaDiscord className="inline"></FaDiscord>  Discord
                                                </p></Link></NavigationMenuLink>
                                                <NavigationMenuLink asChild><Link href="https://knightconnect.campuslabs.com/engage/organization/saseucf"><p>
                                                    <FaChessKnight className="inline"></FaChessKnight>  KnightConnect
                                                </p></Link></NavigationMenuLink>
                                            </NavigationMenuContent>

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
                                                        <AvatarImage src="avatar.png" alt="@shadcn" />
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
                                    <div className="flex items-center gap-2 py-2 font-extrabold">
                                        <Home className="inline" size={16} /> Home
                                    </div>
                                </Link>

                                <div className="flex items-center gap-2 py-2 font-extrabold">
                                    <Link href={'/about'} onClick={() => setMobileMenuOpen(false)}><Info className="inline" size={16} /> About</Link>
                                    <ArrowDown className="inline" size={12} onClick={() => setAboutMenuOpen(!aboutMenuOpen)} />
                                </div>
                                {aboutMenuOpen && (
                                    <div className="">
                                        <Link href={'/about/board'} onClick={() => setMobileMenuOpen(false)}>
                                            <div className="flex items-center gap-2 py-2">
                                                Board
                                            </div>

                                        </Link>
                                        <Link href={'/about/sponsors'} onClick={() => setMobileMenuOpen(false)}>
                                            <div className="flex items-center gap-2 py-2">
                                                Sponsors
                                            </div>
                                        </Link>
                                    </div>
                                )}

                                <Link href={'/events'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2 font-extrabold">
                                        <Calendar className="inline" size={16} /> Events
                                    </div>
                                </Link>

                                <Link href={'/programs'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2 font-extrabold">
                                        <File className="inline" size={16} /> Programs
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2 py-2 font-extrabold">
                                    <Share2 className="inline" size={16} /> Socials
                                    <ArrowDown className="inline" size={12} onClick={() => setSocialSubmenuOpen(!socialsubmenuOpen)} />
                                </div>
                                {socialsubmenuOpen && (
                                    <div className="">
                                        <div className="flex flex-col gap-2 py-2">
                                            <p>
                                                <FaInstagram className="inline" size={24} />
                                                <Link href="https://www.instagram.com/saseucf/">  Instagram</Link>
                                            </p>
                                            <p>
                                                <FaLinkedin className="inline" size={24} />
                                                <Link href="https://www.linkedin.com/company/ucf-sase/">    Linkedin</Link>
                                            </p>
                                            <p>
                                                <FaDiscord className="inline" size={24} />
                                                <Link href="https://discord.gg/PK8e6KwAQS">   Discord</Link>
                                            </p>
                                            <p>
                                                <FaChessKnight className="inline" size={24} />
                                                <Link href="https://knightconnect.campuslabs.com/engage/organization/saseucf">KnightConnect</Link>
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <Link href={'/leaderboard'} onClick={() => setMobileMenuOpen(false)}>
                                    <div className="flex items-center gap-2 py-2 font-extrabold">
                                        <Trophy className="inline" size={16} /> Leaderboard
                                    </div>
                                </Link>

                                {isLoggedIn ? (
                                    <Link href={`/profile`} onClick={() => setMobileMenuOpen(false)}>
                                        <div className="flex items-center gap-2 py-2">
                                            <Avatar>
                                                <AvatarImage src="avatar.png" alt="@shadcn" />
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
