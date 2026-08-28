"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/auth";
import { Search, ShieldCheck, User as UserIcon } from "lucide-react";

type Profile = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
};

export default function AdminUsersPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Loading users...");

    useEffect(() => {
        async function fetchUsers() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/login");
                return;
            }

            const { data: myProfile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (myProfile?.role?.trim().toLowerCase() !== "admin") {
                router.replace("/");
                return;
            }

            const { data: allProfiles, error } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, email, role")
                .order("first_name", { ascending: true });

            if (error) {
                console.error("Error fetching profiles:", error);
                setMessage("Failed to load users.");
                return;
            }

            setProfiles(allProfiles || []);
            setLoading(false);
        }

        fetchUsers();
    }, [router]);

    async function toggleRole(userId: string, currentRole: string) {
        const newRole = currentRole === "admin" ? "member" : "admin";
        
        // Optimistic update
        setProfiles(current => current.map(p => p.id === userId ? { ...p, role: newRole } : p));

        const { error } = await supabase
            .from("profiles")
            .update({ role: newRole })
            .eq("id", userId);

        if (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role. Please ensure you have run the required SQL migration to grant admins UPDATE permissions on profiles.");
            // Revert on error
            setProfiles(current => current.map(p => p.id === userId ? { ...p, role: currentRole } : p));
        }
    }

    const filteredProfiles = profiles.filter(p => {
        const query = searchQuery.toLowerCase();
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        return fullName.includes(query) || p.email.toLowerCase().includes(query);
    });

    if (loading) {
        return <main className="sase-page pt-[120px]"><div className="p-8 font-medium text-muted-foreground">{message}</div></main>;
    }

    return (
        <main className="sase-page pt-[120px]">
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
                <h1>Manage Users</h1>
                <p className="mt-2 text-muted-foreground">Search for users and promote them to administrators.</p>
            </div>

            <div className="max-w-5xl mx-auto mt-8">
                {/* Search Bar */}
                <div className="relative w-full max-w-md mb-8">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl leading-5 bg-card placeholder-[#ACA39A] focus:outline-none focus:ring-2 focus:ring-[#e9eef8] focus:border-[#89abe3] transition-all sm:text-sm shadow-sm"
                    />
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    {filteredProfiles.length === 0 ? (
                        <p className="text-muted-foreground font-medium text-center py-12">No users found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/30 text-[#ACA39A]">
                                    <tr>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">User</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Email</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Role</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredProfiles.map((profile) => {
                                        const isAdmin = profile.role === "admin";
                                        return (
                                            <tr key={profile.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-foreground flex items-center gap-3 whitespace-nowrap">
                                                    <div className="w-8 h-8 rounded-full bg-[#e9eef8] flex items-center justify-center text-[#5579bd]">
                                                        <UserIcon size={16} />
                                                    </div>
                                                    {profile.first_name} {profile.last_name}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{profile.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isAdmin ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
                                                        {isAdmin ? <ShieldCheck size={14} /> : <UserIcon size={14} />}
                                                        {profile.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => toggleRole(profile.id, profile.role)}
                                                        className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg border transition-colors ${isAdmin 
                                                            ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white" 
                                                            : "border-[#89abe3] text-[#89abe3] hover:bg-[#89abe3] hover:text-white"
                                                        }`}
                                                    >
                                                        {isAdmin ? "Demote to Member" : "Promote to Admin"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
