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




export default function Page({
}) {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    async function getUser() {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        return user
    }
    getUser().then((e) => {
        setUsername(e?.user_metadata.username)
        setEmail(e?.user_metadata.email)
    })
    async function fetchStars() {
        const { data, error } = await supabase
            .from('profiles')
            .select('stars')
            .eq('username', username)
        if (error) {
            console.error("Error fetching stars:", error)
            return 0 // Return a default value in case of error
        }
        return data.length > 0 ? data[0].stars : 0 // Return the stars or 0 if not found
    }
    const [edit, setEdit] = useState(false)
    const [stars, setStars] = useState(0)
    fetchStars().then(fetchedStars => setStars(fetchedStars))

    async function handleSignOut() {
        // Call server endpoint to clear server-side auth cookies first so server-rendered session is cleared.
        await fetch('/api/auth/signout', { method: 'POST' }).catch((e) => console.error(e))
        // Also clear client session
        try {
            await supabase.auth.signOut()
        } catch (err) {
            console.error("Error signing out (client):", err)
        }
        // Force a full reload so RootLayout (which reads session server-side) updates immediately.
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen w-full overflow-x-clip flex items-center justify-center">
            <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg p-4 sm:p-6 md:p-10">
                <CardHeader>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-center">Account Settings</CardTitle>
                    <div className="mt-1 font-medium" onClick={() => { setEdit(!edit) }}>Edit  <Pencil className="inline" size={16}></Pencil></div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="font-bold">Username: </label>
                            <input value={username} disabled />
                        </div>
                        <div>
                            <label className="font-bold">Email: </label>
                            {edit ? <input /> : <input value={email} disabled />}
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
                <div className="mt-6 flex justify-center">
                    <button
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
                        onClick={() => handleSignOut()}
                    >
                        Log out
                    </button>
                </div>
            </Card>
        </div>
    )
}
