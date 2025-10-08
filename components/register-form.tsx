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






export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [error, setError] = useState(false)
    const [message, setMessage] = useState("")
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, username }),
            });
            const result = await res.json();
            if (!res.ok) {
                setError(true);
                setMessage(result?.error?.message || "Registration failed");
                return;
            }
            setError(false);
            setMessage("Check your email for a confirmation link to complete your registration.");
            console.log("Registration result:", result);
        } catch (err: any) {
            setError(true);
            setMessage(String(err));
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
                                <Input id="password" type="password" placeholder="Password" onChange={(e) => {
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
            {error && <div className="text-red-500 text-center mt-4">{message}</div>}
            {!error && <div className="text-green-500 text-center mt-4">{message}</div>}
        </div>
    )
}
