"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/auth";
import { Activity, ShieldAlert, User as UserIcon, Calendar, FileText, Clock } from "lucide-react";

type LogEntry = {
    id: string;
    actor_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: Record<string, unknown>;
    created_at: string;
    actor_first_name?: string;
    actor_last_name?: string;
    actor_email?: string;
};

export default function AdminLogsPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("Loading audit logs...");

    useEffect(() => {
        async function fetchLogs() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            if (profile?.role?.trim().toLowerCase() !== "admin") {
                router.replace("/");
                return;
            }

            // Fetch logs and join with the actor's profile
            const { data: logData, error } = await supabase
                .from("admin_logs")
                .select(`
                    id, action, entity_type, entity_id, details, created_at, actor_id,
                    profiles:actor_id ( first_name, last_name, email )
                `)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) {
                console.error("Error fetching logs:", error);
                setMessage("Failed to load audit logs. Please ensure you have run the required SQL migration to create the admin_logs table.");
                setLoading(false);
                return;
            }

            // Format data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedLogs = (logData || []).map((log: any) => ({
                ...log,
                actor_first_name: Array.isArray(log.profiles) ? log.profiles[0]?.first_name : log.profiles?.first_name,
                actor_last_name: Array.isArray(log.profiles) ? log.profiles[0]?.last_name : log.profiles?.last_name,
                actor_email: Array.isArray(log.profiles) ? log.profiles[0]?.email : log.profiles?.email,
            }));

            setLogs(formattedLogs);
            setLoading(false);
        }

        fetchLogs();
    }, [router]);

    function getActionDetails(log: LogEntry) {
        const actorName = log.actor_first_name ? `${log.actor_first_name} ${log.actor_last_name}` : "Unknown User";
        const title = log.details?.title ? `"${String(log.details.title)}"` : "";

        if (log.action === "update_role" && log.entity_type === "profiles") {
            const subjectName = String(log.details?.user_name || "a user");
            const newRole = String(log.details?.new_role || "member");
            const actionText = newRole === "admin" ? "promoted" : "demoted";
            return {
                icon: <ShieldAlert className="text-purple-500" size={20} />,
                bg: "bg-purple-100",
                text: <span><span className="font-bold text-foreground">{actorName}</span> {actionText} <span className="font-bold">{subjectName}</span> to {newRole}</span>
            };
        }
        
        if (log.entity_type === "events") {
            const verb = log.action === "create" ? "created" : log.action === "update" ? "updated" : "deleted";
            return {
                icon: <Calendar className="text-blue-500" size={20} />,
                bg: "bg-blue-100",
                text: <span><span className="font-bold text-foreground">{actorName}</span> {verb} the event <span className="font-bold">{title}</span></span>
            };
        }

        if (log.entity_type === "forms") {
            const verb = log.action === "create" ? "created" : log.action === "update" ? "updated" : "deleted";
            return {
                icon: <FileText className="text-green-500" size={20} />,
                bg: "bg-green-100",
                text: <span><span className="font-bold text-foreground">{actorName}</span> {verb} the form <span className="font-bold">{title}</span></span>
            };
        }

        // Fallback
        return {
            icon: <Activity className="text-gray-500" size={20} />,
            bg: "bg-gray-100",
            text: <span><span className="font-bold text-foreground">{actorName}</span> performed {log.action} on {log.entity_type}</span>
        };
    }

    if (loading) {
        return <main className="sase-page pt-[120px]"><div className="p-8 font-medium text-muted-foreground">{message}</div></main>;
    }

    return (
        <main className="sase-page pt-[120px]">
            <div className="sase-page-header">
                <p className="sase-eyebrow">UCF SASE / Admin workspace</p>
                <h1>Master Audit Logs</h1>
                <p className="mt-2 text-muted-foreground">A complete, immutable record of administrative actions.</p>
            </div>

            <div className="max-w-4xl mx-auto mt-8 relative">
                {logs.length === 0 ? (
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-12 text-center">
                        <Activity className="w-12 h-12 text-muted mx-auto mb-4" />
                        <h3 className="font-bold text-xl text-foreground mb-2">No logs found</h3>
                        <p className="text-muted-foreground">Administrative actions will appear here once they occur.</p>
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="divide-y divide-border">
                            {logs.map((log) => {
                                const { icon, bg, text } = getActionDetails(log);
                                return (
                                    <div key={log.id} className="p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                                            {icon}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-[15px] text-muted-foreground mb-1 leading-relaxed">
                                                {text}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs font-bold text-[#ACA39A] uppercase tracking-wider">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {new Date(log.created_at).toLocaleString('en-US', {
                                                        dateStyle: "medium",
                                                        timeStyle: "short"
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <UserIcon size={12} />
                                                    {log.actor_email || "Unknown Email"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
