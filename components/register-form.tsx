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
import { FormEvent, useState } from "react"


import supabase from "@/lib/auth"




export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        // Handle form submission logic here
        // For example, you can call supabase.auth.signUp() to register a new user
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }

            }
        });
        if (error) {
            console.error("Error signing up:", error.message);
        } else {
            console.log("User signed up:", data.user);
        }
    }
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Register an account</CardTitle>
                    <CardDescription>
                        Enter your email below to create an account
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
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                    }
                                    }
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-3">
                            <div className="grid gap-3">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="username"
                                    placeholder="Username"
                                    onChange={(e) => {
                                        setUsername(e.target.value)
                                    }
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input id="password" type="password" onChange={(e) => {
                                    setPassword(e.target.value)
                                }} required />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button variant="outline" className="w-full">
                                    Register
                                </Button>
                            </div>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
