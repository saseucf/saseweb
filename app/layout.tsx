
import "./globals.css";
import { ModeToggle } from "@/components/modechanger";
import { Geist } from 'next/font/google'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { ThemeProvider } from "@/components/themeprovider";
import Link from "next/link";
import Image from "next/image";
import saselogo from "@/public/saselogo.png";


const geist = Geist({
    subsets: ['latin'],
    display: 'swap',
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={geist.className}>
            <body>
                <ThemeProvider attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange>
                    <div className="flex flex-row p-2 items-center">
                        <Link href={"/"} className="grow">
                            <Image src={saselogo} alt="saselogo" height={150} width={150} className="flex-none"></Image>
                        </Link>
                        <div className="mr-5">
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <Link href={'/'}><NavigationMenuLink>Home</NavigationMenuLink></Link>
                                    </NavigationMenuItem>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/about"}>
                                                <NavigationMenuTrigger>
                                                    About
                                                    <NavigationMenuContent>
                                                        <NavigationMenuLink>About</NavigationMenuLink>
                                                    </NavigationMenuContent>
                                                </NavigationMenuTrigger>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/events"}>
                                                <NavigationMenuTrigger>
                                                    Events
                                                    <NavigationMenuContent>
                                                        <NavigationMenuLink>Link</NavigationMenuLink>
                                                    </NavigationMenuContent>
                                                </NavigationMenuTrigger>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/programs"}>
                                                <NavigationMenuTrigger>
                                                    Programs
                                                    <NavigationMenuContent>
                                                        <NavigationMenuLink>Link</NavigationMenuLink>
                                                    </NavigationMenuContent>
                                                </NavigationMenuTrigger>
                                            </Link>
                                        </NavigationMenuItem>
                                    </NavigationMenu>
                                    <NavigationMenu>
                                        <NavigationMenuItem>
                                            <Link href={"/resources"}>
                                                <NavigationMenuLink>
                                                    Resources</NavigationMenuLink>
                                            </Link>
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
            </body>
        </html >
    );
}
