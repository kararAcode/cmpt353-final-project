"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";

import { SearchItem } from "@/components/search/search-types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

type SearchResultsProps = {
    results: SearchItem[];
    isLoading: boolean;
    isLoadingMore: boolean;
    nextCursor: string | null;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
};

export function SearchResults({
    results,
    isLoading,
    isLoadingMore,
    nextCursor,
    loadMoreRef,
}: SearchResultsProps) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-2xl font-semibold text-foreground">Results</h2>
                <p className="text-sm text-muted-foreground">
                    {results.length} loaded result{results.length === 1 ? "" : "s"}.
                </p>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Searching discussions...
                    </CardContent>
                </Card>
            ) : results.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                        No matching posts or replies were found.
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {results.map((result) => (
                        <Card
                            key={`${result.itemType}-${result.id}`}
                            className="transition-shadow hover:shadow-md"
                        >
                            <CardHeader className="space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base">
                                            {result.itemType === "post"
                                                ? result.post.title
                                                : `Reply in ${result.post.title}`}
                                        </CardTitle>
                                        <CardDescription>
                                            {result.context} by {result.author.displayName}
                                        </CardDescription>
                                    </div>
                                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                        {result.itemType}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                    {result.excerpt}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span>#{result.channel.name}</span>
                                    <span>{formatDate(result.createdAt)}</span>
                                </div>
                                <Link
                                    href={result.href}
                                    className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    Open content
                                </Link>
                            </CardContent>
                        </Card>
                    ))}

                    <div ref={loadMoreRef} className="flex min-h-12 items-center justify-center">
                        {isLoadingMore ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                Loading more results...
                            </div>
                        ) : nextCursor ? (
                            <p className="text-xs text-muted-foreground">
                                Scroll to load more results.
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                You&apos;ve reached the end of the results.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
