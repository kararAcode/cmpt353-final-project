"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Hash, LogOut, Plus } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { CreateChannelModal } from "@/components/channels/create-channel-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pickChannelThumbnail } from "@/lib/channel-branding";

type Channel = {
    id: string;
    name: string;
    description: string | null;
    postCount: number;
};

export default function ChannelsPage() {
    const router = useRouter();
    const authUser = useAuth();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [channelName, setChannelName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        async function loadChannels() {
            try {
                setIsLoading(true);
                setError("");

                const response = await fetch("/api/channels");
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result?.error?.message || "Failed to load channels.");
                }

                setChannels(Array.isArray(result?.data) ? result.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load channels.");
            } finally {
                setIsLoading(false);
            }
        }

        void loadChannels();
    }, []);

    const hasAuth = Boolean(authUser);
    const authLabel = authUser?.displayName || "Account";

    async function handleCreateChannel(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = channelName.trim();

        if (!trimmedName) {
            setSubmitError("Channel name is required.");
            return;
        }

        if (!authUser) {
            setSubmitError("You must be signed in to create a channel.");
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError("");

            const response = await fetch("/api/channels", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: trimmedName }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to create channel.");
            }

            const createdChannel = result?.data as
                | (Partial<Channel> & { id?: string; name?: string })
                | undefined;

            if (!createdChannel?.id || !createdChannel?.name) {
                throw new Error("Channel created but no data was returned.");
            }

            const createdChannelId = createdChannel.id;
            const createdChannelName = createdChannel.name;

            setChannels((current) => [
                ...current,
                {
                    id: createdChannelId,
                    name: createdChannelName,
                    description: createdChannel.description ?? null,
                    postCount: createdChannel.postCount ?? 0,
                },
            ]);
            setChannelName("");
            setIsCreateModalOpen(false);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Failed to create channel.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleLogout() {
        setIsCreateModalOpen(false);
        setSubmitError("");

        await fetch("/api/auth/logout", {
            method: "POST",
        });

        router.refresh();
    }

    return (
        <main className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                <Hash className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-foreground">Channels</h1>
                                <p className="text-sm text-muted-foreground">
                                    Browse public discussion spaces
                                </p>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasAuth ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <span className="max-w-32 truncate">{authLabel}</span>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{authLabel}</DropdownMenuLabel>
                                    {authUser ? (
                                        <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                                            {authUser.email}
                                        </DropdownMenuLabel>
                                    ) : null}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout}>
                                        <LogOut className="h-4 w-4" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold text-foreground">All channels</h2>
                        <p className="text-sm text-muted-foreground">
                            Explore public spaces and jump into discussions.
                        </p>
                    </div>

                    {hasAuth ? (
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Create Channel
                        </Button>
                    ) : null}
                </div>

                {error ? (
                    <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index} className="animate-pulse">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-xl bg-muted" />
                                    <div className="h-5 w-32 rounded bg-muted" />
                                    <div className="h-4 w-24 rounded bg-muted" />
                                </CardHeader>
                                <CardContent>
                                    <div className="h-4 w-full rounded bg-muted" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : channels.length === 0 ? (
                    <div className="py-12 text-center">
                        <h3 className="text-lg font-medium text-foreground">No channels yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {hasAuth
                                ? "Be the first to start a discussion space for your topic."
                                : "Sign in to create the first channel and start a discussion space."}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {channels.map((channel) => {
                            const thumbnail = pickChannelThumbnail(channel.id + channel.name);

                            return (
                                <Link key={channel.id} href={`/channels/${channel.id}`} className="block">
                                    <Card className="h-full transition-shadow hover:shadow-md">
                                        <CardHeader className="space-y-4">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${thumbnail.bgClass}`}
                                            >
                                                <span aria-hidden="true">{thumbnail.emoji}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <CardTitle className="capitalize">{channel.name}</CardTitle>
                                                <CardDescription>
                                                    {channel.postCount}{" "}
                                                    {channel.postCount === 1 ? "post" : "posts"}
                                                </CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                {channel.description || "No description yet."}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>

            <CreateChannelModal
                isOpen={isCreateModalOpen}
                channelName={channelName}
                submitError={submitError}
                isSubmitting={isSubmitting}
                onChannelNameChange={setChannelName}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setSubmitError("");
                }}
                onSubmit={handleCreateChannel}
            />
        </main>
    );
}
