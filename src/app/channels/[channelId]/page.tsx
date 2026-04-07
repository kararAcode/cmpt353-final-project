"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, LogOut } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import {
    AttachmentSummary,
    ChannelDetail,
    PostSummary,
} from "@/components/channels/channel-detail-types";
import { ChannelHeroCard } from "@/components/channels/channel-hero-card";
import { ChannelPostsSection } from "@/components/channels/channel-posts-section";
import { CreatePostCard } from "@/components/channels/create-post-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChannelDetailPage() {
    const router = useRouter();
    const params = useParams<{ channelId: string }>();
    const { user: authUser, isAuthenticated } = useAuth();
    const [channel, setChannel] = useState<ChannelDetail | null>(null);
    const [posts, setPosts] = useState<PostSummary[]>([]);
    const [error, setError] = useState("");
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const channelId = params.channelId;
    const authLabel = authUser?.displayName || "Account";

    useEffect(() => {
        if (!channelId) {
            return;
        }

        async function loadChannel() {
            try {
                setError("");

                const [channelResponse, postsResponse] = await Promise.all([
                    fetch(`/api/channels/${channelId}`),
                    fetch(`/api/channels/${channelId}/posts`),
                ]);
                const [channelResult, postsResult] = await Promise.all([
                    channelResponse.json(),
                    postsResponse.json(),
                ]);

                if (!channelResponse.ok) {
                    throw new Error(channelResult?.error?.message || "Failed to load channel.");
                }

                if (!postsResponse.ok) {
                    throw new Error(postsResult?.error?.message || "Failed to load posts.");
                }

                setChannel(channelResult.data ?? null);
                setPosts(Array.isArray(postsResult.data) ? postsResult.data : []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load channel.");
            }
        }

        void loadChannel();
    }, [channelId]);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
    }

    async function handleCreatePost(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!authUser || !channel) {
            setSubmitError("You must be signed in to create a post.");
            return;
        }

        const trimmedTitle = title.trim();
        const trimmedBody = body.trim();

        if (!trimmedTitle || !trimmedBody) {
            setSubmitError("Post title and body are required.");
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError("");

            const formData = new FormData();
            formData.set("title", trimmedTitle);
            formData.set("body", trimmedBody);
            for (const file of selectedFiles) {
                formData.append("attachments", file);
            }

            const response = await fetch(`/api/channels/${channel.id}/posts`, {
                method: "POST",
                body: formData,
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to create post.");
            }

            const createdPost = result?.data?.post as
                | {
                      id?: string;
                      title?: string;
                      body?: string;
                      createdAt?: string;
                  }
                | undefined;
            if (!createdPost?.id || !createdPost.title || !createdPost.body || !createdPost.createdAt) {
                throw new Error("Post created but no data was returned.");
            }

            const createdAttachments: AttachmentSummary[] = Array.isArray(result?.data?.attachments)
                ? (result.data.attachments as AttachmentSummary[])
                : [];

            const postToInsert: PostSummary = {
                id: createdPost.id,
                title: createdPost.title,
                body: createdPost.body,
                createdAt: createdPost.createdAt,
                author: {
                    id: authUser.id,
                    displayName: authUser.displayName,
                },
                attachments: createdAttachments,
                topLevelReplyCount: 0,
                voteSummary: {
                    upvotes: 0,
                    downvotes: 0,
                    score: 0,
                },
            };

            setPosts((current) => [
                postToInsert,
                ...current,
            ]);
            setChannel((current) =>
                current
                    ? {
                          ...current,
                          postCount: current.postCount + 1,
                      }
                    : current,
            );
            setTitle("");
            setBody("");
            setSelectedFiles([]);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Failed to create post.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <Link
                        href="/channels"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to channels
                    </Link>

                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
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
                        ) : (
                            <Link
                                href="/signin"
                                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Sign in
                            </Link>
                        )}
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
                {error ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : null}

                {channel ? (
                    <>
                        <ChannelHeroCard channel={channel} />

                        {isAuthenticated ? (
                            <CreatePostCard
                                title={title}
                                body={body}
                                selectedFiles={selectedFiles}
                                submitError={submitError}
                                isSubmitting={isSubmitting}
                                onTitleChange={setTitle}
                                onBodyChange={setBody}
                                onFilesChange={setSelectedFiles}
                                onSubmit={handleCreatePost}
                            />
                        ) : (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-lg font-semibold text-foreground">
                                            Want to join the discussion?
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Sign in to create a post and take part in the conversation.
                                        </p>
                                    </div>
                                    <Link
                                        href="/signin"
                                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        Sign in to post
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        <ChannelPostsSection
                            posts={posts}
                            onPostReplyCountChange={(postId, topLevelReplyCount) => {
                                setPosts((current) =>
                                    current.map((post) =>
                                        post.id === postId
                                            ? { ...post, topLevelReplyCount }
                                            : post,
                                    ),
                                );
                            }}
                        />
                    </>
                ) : null}
            </section>
        </main>
    );
}
