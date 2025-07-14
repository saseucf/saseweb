"use client"
import React, { useState } from "react"
import { Pencil } from "lucide-react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import supabase from "@/lib/auth"

interface UserCardProps {
    name: string
    email: string
    className?: string
}

export default function Page({
    name = "Eric George",
    email = "ericgeo324@gmail.com",
    className
}: UserCardProps) {
    async function fetchStars() {
        const { data, error } = await supabase
            .from('saseuserstats')
            .select('stars')
            .eq('id', '22b185cb-a3c6-4010-9cad-9b22b64f7b9f')
        if (error) {
            console.error("Error fetching stars:", error)
            return 0 // Return a default value in case of error
        }
        return data.length > 0 ? data[0].stars : 0 // Return the stars or 0 if not found
    }
    const [edit, setEdit] = useState(false)
    const [stars, setStars] = useState(0)
    stars === 0 && fetchStars().then(fetchedStars => setStars(fetchedStars))
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <div className="mt-1 font-medium" onClick={() => { setEdit(!edit) }}>Edit  <Pencil className="inline" size={16}></Pencil></div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-bold">Username: </label>
                            <input value="erido12" disabled />
                        </div>
                        <div>
                            <label className="font-bold">Email: </label>
                            {edit ? <input /> : <input value={email} disabled />}
                        </div>
                        <div>
                            <label className="font-bold">Password: </label>
                            {edit ? <input value="••••••••" type="password" /> : <input value="••••••••" type="password" disabled />}
                        </div>
                        <div>
                            <label className="font-bold">First Name: </label>
                            <input value="-" disabled />
                        </div>
                        <div>
                            <label className="font-bold">Last Name: </label>
                            <input value="-" disabled />
                        </div>
                        <div>
                            <label className="font-bold">Roles: </label>
                            <input value="user" disabled />
                        </div>
                        <div>
                            <label className="font-bold">Stars: </label>
                            <input value={stars} disabled />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
