"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Image as ImageIcon, MessageSquare, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
    const router = useRouter();

    return (
        <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                        </span>
                        Now in public beta
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
                        Where developers <span className="text-accent">connect</span>{" "}
                        and <span className="text-accent">grow</span>
                    </h1>

                    <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                        A channel-based platform for programming questions and
                        threaded discussions. Ask questions, share knowledge, and
                        build together with a community that gets it.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Button
                            size="lg"
                            className="gap-2"
                            onClick={() => router.push("/signin?mode=signup")}
                        >
                            Start Free <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => router.push("/signin")}>
                            Watch Demo
                        </Button>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>
                            <span className="font-semibold text-foreground">50K+</span>{" "}
                            developers
                        </span>
                        <span>
                            <span className="font-semibold text-foreground">1M+</span>{" "}
                            discussions
                        </span>
                    </div>
                </div>

                <div className="relative lg:pl-8">
                    <div className="relative rounded-xl border border-border bg-card p-4 shadow-2xl">
                        <div className="flex items-center gap-2 border-b border-border pb-4">
                            <div className="h-3 w-3 rounded-full bg-destructive/50" />
                            <div className="h-3 w-3 rounded-full bg-chart-4/50" />
                            <div className="h-3 w-3 rounded-full bg-accent/50" />
                            <span className="ml-2 text-xs text-muted-foreground">
                                #react-help
                            </span>
                        </div>

                        <div className="space-y-4 pt-4">
                            <MockMessage
                                avatar="S"
                                name="sarah_dev"
                                time="2m ago"
                                message="Anyone know why my useEffect runs twice in React 18?"
                                votes={12}
                            />
                            <div className="ml-8 space-y-3 border-l-2 border-accent/30 pl-4">
                                <MockReply
                                    avatar="M"
                                    name="mike_js"
                                    message="It's StrictMode! It intentionally double-invokes effects in development to help find bugs."
                                    votes={8}
                                    hasImage
                                />
                                <MockReply
                                    avatar="A"
                                    name="alex_react"
                                    message="Quick fix: wrap your effect logic in a cleanup function or use a ref flag."
                                    votes={5}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-xl bg-accent/20 blur-2xl" />
                </div>
            </div>
        </section>
    );
}

function MockMessage({
    avatar,
    name,
    time,
    message,
    votes,
}: {
    avatar: string;
    name: string;
    time: string;
    message: string;
    votes: number;
}) {
    return (
        <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-accent">
                {avatar}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <span className="text-xs text-muted-foreground">{time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{message}</p>
                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-accent"
                    >
                        <ThumbsUp className="h-3 w-3" /> {votes}
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <MessageSquare className="h-3 w-3" /> Reply
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ImageIcon className="h-3 w-3" /> Attach
                    </button>
                </div>
            </div>
        </div>
    );
}

function MockReply({
    avatar,
    name,
    message,
    votes,
    hasImage = false,
}: {
    avatar: string;
    name: string;
    message: string;
    votes: number;
    hasImage?: boolean;
}) {
    return (
        <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                {avatar}
            </div>
            <div className="flex-1 space-y-1">
                <span className="text-xs font-medium text-foreground">{name}</span>
                <p className="text-xs text-muted-foreground">{message}</p>
                {hasImage && (
                    <div className="mt-2 rounded-md border border-border bg-secondary/50 p-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            <span>screenshot.png</span>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-accent"
                    >
                        <ThumbsUp className="h-3 w-3" /> {votes}
                    </button>
                </div>
            </div>
        </div>
    );
}
