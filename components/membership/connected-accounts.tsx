"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import supabase from "@/lib/auth";

type Provider = "google" | "discord";

export default function ConnectedAccounts() {
    const [googleConnected, setGoogleConnected] = useState(false);
    const [discordConnected, setDiscordConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState<Provider | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadIdentities() {
        const { data, error: identityError } =
            await supabase.auth.getUserIdentities();

        if (identityError) {
            setError("Connected accounts could not be loaded.");
            setLoading(false);
            return;
        }

        const identities = data?.identities ?? [];

        setGoogleConnected(
            identities.some((identity) => identity.provider === "google")
        );

        setDiscordConnected(
            identities.some((identity) => identity.provider === "discord")
        );

        setLoading(false);
        }

        loadIdentities();
    }, []);

    async function connectAccount(provider: Provider) {
        setError("");
        setConnecting(provider);

        const { error: linkError } = await supabase.auth.linkIdentity({
        provider,
        options: {
            redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
            "/membership/profile"
            )}&flow=link`,
        },
        });

        if (linkError) {
        setError(linkError.message);
        setConnecting(null);
        }
    }

    if (loading) {
        return (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading connected accounts...
        </div>
        );
    }

    return (
        <div className="mt-6 space-y-4">
        {error ? (
            <p
            className="border border-destructive/35 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
            >
            {error}
            </p>
        ) : null}

        <div className="flex items-center justify-between gap-4 border border-border p-4">
            <div className="flex items-center gap-3">
            <FcGoogle className="size-6" />

            <div>
                <p className="font-bold">Google</p>
                <p className="text-sm text-muted-foreground">
                {googleConnected ? "Connected" : "Not connected"}
                </p>
            </div>
            </div>

            {googleConnected ? (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Connected
            </div>
            ) : (
            <button
                type="button"
                className="sase-secondary-button !inline-flex min-h-10 items-center justify-center px-4"
                onClick={() => connectAccount("google")}
                disabled={connecting !== null}
            >
                {connecting === "google" ? "Connecting..." : "Connect Google"}
            </button>
            )}
        </div>

        <div className="flex items-center justify-between gap-4 border border-border p-4">
            <div className="flex items-center gap-3">
            <FaDiscord className="size-6" />

            <div>
                <p className="font-bold">Discord</p>
                <p className="text-sm text-muted-foreground">
                {discordConnected ? "Connected" : "Not connected"}
                </p>
            </div>
            </div>

            {discordConnected ? (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Connected
            </div>
            ) : (
            <button
                type="button"
                className="sase-secondary-button !inline-flex min-h-10 items-center justify-center px-4"
                onClick={() => connectAccount("discord")}
                disabled={connecting !== null}
            >
                {connecting === "discord" ? "Connecting..." : "Connect Discord"}
            </button>
            )}
        </div>
        </div>
    );
}