"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import supabase from "@/lib/auth"
import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"



export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const router = useRouter()
    const [email, setEmail] = useState("")

    const [password, setPassword] = useState("")
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        try {
            const res = await fetch("/api/auth/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            const result = await res.json();
            if (!res.ok) {
                console.error("Login error:", result);
                return;
            }
            // If the server returned a session object, configure the client-side Supabase session
            // so supabase.auth.getUser() will immediately return the authenticated user.
            if (result?.data?.session) {
                try {
                    await supabase.auth.setSession({
                        access_token: result.data.session.access_token,
                        refresh_token: result.data.session.refresh_token,
                    });
                    // Ensure the Supabase client has recognized the session before navigating.
                    // This reduces the chance the navbar will render the unauthenticated UI briefly.
                    try {
                        await supabase.auth.getUser();
                    } catch {
                        // ignore; we'll still optimistically update below
                    }
                    // Optimistically notify other components that a user signed in so UI can update without flicker.
                    try {
                        const user = result.data.session?.user;
                        if (typeof window !== "undefined" && user) {
                            try {
                                localStorage.setItem("sase:auth", JSON.stringify(user));
                            } catch {
                                // ignore localStorage errors
                            }
                            window.dispatchEvent(new CustomEvent("sase:auth", { detail: { user } }));
                        }
                    } catch (e) {
                        console.error("Error dispatching auth event:", e);
                    }
                } catch (e) {
                    console.error("Error setting client session:", e);
                }
                // Navigate client-side (avoid full reload) so navbar can update without flicker.
                router.replace("/");
            } else {
                // fallback to full reload to let server-side cookies take effect
                window.location.href = "/";
            }
        } catch (err) {
            console.error("Unexpected error:", err);
        }
    }
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    onChange={(e) => { setEmail(e.target.value) }}
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <a
                                        href="#"
                                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                    >
                                        Forgot your password?
                                    </a>
                                </div>
                                <Input id="password" type="password" onChange={(e) => { setPassword(e.target.value) }} required />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button variant="outline" className="w-full">
                                    Login
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            <Link href={"/register"}>
                                Don&apos;t have an account?{" "}
                                <a href="#" className="underline underline-offset-4">
                                    Sign up
                                </a>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
