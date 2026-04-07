"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Trash2, Users } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type AdminUserRecord = {
    id: string;
    email: string;
    displayName: string;
    role: string;
    createdAt: string;
    counts: {
        channels: number;
        posts: number;
        replies: number;
    };
};

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export function AdminUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<AdminUserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

    useEffect(() => {
        async function loadUsers() {
            try {
                setIsLoading(true);
                setError("");

                const response = await fetch("/api/admin/users");
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result?.error?.message || "Failed to load users.");
                }

                setUsers(Array.isArray(result?.data) ? result.data : []);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Failed to load users.");
            } finally {
                setIsLoading(false);
            }
        }

        void loadUsers();
    }, []);

    const totalContentCount = useMemo(
        () =>
            users.reduce(
                (total, current) =>
                    total + current.counts.channels + current.counts.posts + current.counts.replies,
                0,
            ),
        [users],
    );

    async function handleConfirmDelete() {
        if (!selectedUser) {
            return;
        }

        try {
            setIsDeleting(true);
            setDeleteError("");

            const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to delete user.");
            }

            setUsers((current) => current.filter((entry) => entry.id !== selectedUser.id));
            setSelectedUser(null);
        } catch (deleteActionError) {
            setDeleteError(
                deleteActionError instanceof Error
                    ? deleteActionError.message
                    : "Failed to delete user.",
            );
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <Link
                            href="/channels"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to channels
                        </Link>
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                                <Shield className="h-3.5 w-3.5" />
                                Admin tools
                            </div>
                            <h1 className="text-3xl font-semibold text-foreground">
                                User management
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Review community members and remove accounts when moderation action
                                is required.
                            </p>
                        </div>
                    </div>

                    <Card className="min-w-64">
                        <CardContent className="flex items-center gap-4 px-6 py-5">
                            <div className="rounded-xl bg-accent/15 p-3 text-accent">
                                <Users className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Managed accounts</p>
                                <p className="text-2xl font-semibold text-foreground">
                                    {users.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {totalContentCount} contributed items tracked
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {error ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : null}

                <Card>
                    <CardHeader>
                        <CardTitle>All users</CardTitle>
                        <CardDescription>
                            Signed in as {user?.displayName} ({user?.email}).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-border p-4 animate-pulse"
                                >
                                    <div className="h-5 w-40 rounded bg-muted" />
                                    <div className="mt-3 h-4 w-56 rounded bg-muted" />
                                </div>
                            ))
                        ) : users.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                                No users found.
                            </div>
                        ) : (
                            users.map((managedUser) => {
                                const isCurrentUser = managedUser.id === user?.id;

                                return (
                                    <div
                                        key={managedUser.id}
                                        className="flex flex-col gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-lg font-semibold text-foreground">
                                                    {managedUser.displayName}
                                                </h2>
                                                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                                                    {managedUser.role}
                                                </span>
                                                {isCurrentUser ? (
                                                    <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                                                        You
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {managedUser.email}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Joined {formatDate(managedUser.createdAt)}
                                            </p>
                                            <p className="text-sm text-foreground">
                                                {managedUser.counts.channels} channel(s) •{" "}
                                                {managedUser.counts.posts} post(s) •{" "}
                                                {managedUser.counts.replies} repl
                                                {managedUser.counts.replies === 1 ? "y" : "ies"}
                                            </p>
                                        </div>

                                        <Button
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={isCurrentUser}
                                            onClick={() => {
                                                setSelectedUser(managedUser);
                                                setDeleteError("");
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete user
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </section>

            <Dialog
                open={Boolean(selectedUser)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedUser(null);
                        setDeleteError("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm user deletion</DialogTitle>
                        <DialogDescription>
                            {selectedUser
                                ? `Delete ${selectedUser.displayName} and all related channels, posts, replies, votes, and attachments? This action cannot be undone.`
                                : "Confirm this deletion."}
                        </DialogDescription>
                    </DialogHeader>

                    {deleteError ? (
                        <div className="mx-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {deleteError}
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSelectedUser(null);
                                setDeleteError("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                        >
                            {isDeleting ? "Deleting..." : "Confirm delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
