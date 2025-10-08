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
            // on successful sign in the server will set cookies; refresh client routing
            router.push("/");
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
                    <form onSubmit={(e) => handleSubmit(e)}>
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
