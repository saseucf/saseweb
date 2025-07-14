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

    return (
        <html lang="en" className={geist.className}>

            <body>
                <ThemeProvider attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange>
                    <div className="flex flex-row p-2 items-center">
                        <Link href={"/"} className="grow">
                            <Image src={saselogo} alt="saselogo" height={150} width={150} className="flex-none"></Image>
                        </Link>
                        <div className="mr-5">
                            <NavigationMenu className="font-extrabold">
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <Link href={'/'}><NavigationMenuLink><p>
                                            <Home className="inline" size={16}></Home>    Home
                                        </p></NavigationMenuLink></Link>
                                    </NavigationMenuItem>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/about"}>
                                                <NavigationMenuTrigger className="font-extrabold"><p>
                                                    <Info className="inline" size={16}></Info>  About
                                                </p></NavigationMenuTrigger>

                                                <NavigationMenuContent>
                                                    <NavigationMenuLink>Info</NavigationMenuLink>
                                                </NavigationMenuContent>

                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/events"}>
                                                <NavigationMenuTrigger className="font-extrabold">
                                                    <p><Calendar className="inline" size={16}></Calendar>  Events</p>

                                                </NavigationMenuTrigger>
                                                <NavigationMenuContent>
                                                    <NavigationMenuLink>Link</NavigationMenuLink>
                                                </NavigationMenuContent>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/programs"}>
                                                <NavigationMenuTrigger className="font-extrabold">
                                                    <p><File className="inline" size={16}></File>  Programs</p>

                                                </NavigationMenuTrigger>
                                                <NavigationMenuContent>
                                                    <NavigationMenuLink>Link</NavigationMenuLink>
                                                </NavigationMenuContent>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/resources"}>
                                                <NavigationMenuLink>
                                                    <p><Book className="inline"></Book>  Resources</p></NavigationMenuLink>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu >
                                        <NavigationMenuItem>
                                            {isLoggedIn ? <Link href={`/profile`}>
                                                <Avatar><AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                                    <AvatarFallback>CN</AvatarFallback></Avatar>
                                            </Link> : <Link href={"/login"}>
                                                <Button variant="outline" className="font-extrabold gap-x-100">
                                                    <p>Login</p>
                                                </Button>
                                            </Link>}
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>

                        <div >
                            <ModeToggle></ModeToggle>
                        </div>

                    </div>
                    {children}
                </ThemeProvider>
            </body >
        </html >
    );
}
