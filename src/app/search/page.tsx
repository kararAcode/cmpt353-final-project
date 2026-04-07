"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchFilters } from "@/components/search/search-filters";
import { SearchHeader } from "@/components/search/search-header";
import { SearchResults } from "@/components/search/search-results";
import { SearchSummary } from "@/components/search/search-summary";
import {
    ChannelOption,
    SearchItem,
    SearchResponse,
} from "@/components/search/search-types";

import { useAuth } from "@/app/auth-provider";

export default function SearchPage() {
    const { user: authUser, isAuthenticated } = useAuth();
    const authLabel = authUser?.displayName || "Account";

    const [channels, setChannels] = useState<ChannelOption[]>([]);
    const [queryInput, setQueryInput] = useState("");
    const [authorInput, setAuthorInput] = useState("");
    const [channelInput, setChannelInput] = useState("");
    const [selectedChannel, setSelectedChannel] = useState<ChannelOption | null>(null);
    const [showChannelOptions, setShowChannelOptions] = useState(false);

    const [results, setResults] = useState<SearchItem[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [summary, setSummary] = useState<SearchResponse["summary"]>({
        mostPosts: null,
        leastPosts: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const activeRequestRef = useRef(0);

    const filteredChannels = useMemo(() => {
        const normalized = channelInput.trim().toLowerCase();

        if (!normalized) {
            return channels.slice(0, 8);
        }

        return channels
            .filter((channel) => channel.name.toLowerCase().includes(normalized))
            .slice(0, 8);
    }, [channelInput, channels]);

    useEffect(() => {
        async function loadChannels() {
            const response = await fetch("/api/channels");
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to load channels.");
            }

            setChannels(Array.isArray(result?.data) ? result.data : []);
        }

        void loadChannels().catch((loadError: unknown) => {
            setError(loadError instanceof Error ? loadError.message : "Failed to load channels.");
        });
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            const requestId = activeRequestRef.current + 1;
            activeRequestRef.current = requestId;

            async function runSearch() {
                try {
                    setIsLoading(true);
                    setError("");

                    const params = new URLSearchParams({
                        query: queryInput.trim(),
                        author: authorInput.trim(),
                        limit: "12",
                    });

                    if (selectedChannel?.id) {
                        params.set("channelId", selectedChannel.id);
                    }

                    const response = await fetch(`/api/search?${params.toString()}`);
                    const result = (await response.json()) as {
                        data?: SearchResponse;
                        error?: { message?: string };
                    };

                    if (!response.ok) {
                        throw new Error(result?.error?.message || "Failed to search content.");
                    }

                    if (activeRequestRef.current !== requestId) {
                        return;
                    }

                    setResults(result.data?.items ?? []);
                    setNextCursor(result.data?.nextCursor ?? null);
                    setSummary(
                        result.data?.summary ?? {
                            mostPosts: null,
                            leastPosts: null,
                        },
                    );
                } catch (searchError) {
                    if (activeRequestRef.current !== requestId) {
                        return;
                    }

                    setError(
                        searchError instanceof Error
                            ? searchError.message
                            : "Failed to search content.",
                    );
                    setResults([]);
                    setNextCursor(null);
                } finally {
                    if (activeRequestRef.current === requestId) {
                        setIsLoading(false);
                    }
                }
            }

            void runSearch();
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [authorInput, queryInput, selectedChannel]);

    useEffect(() => {
        if (!nextCursor || !loadMoreRef.current) {
            return;
        }

        const target = loadMoreRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (!entry?.isIntersecting || isLoading || isLoadingMore || !nextCursor) {
                    return;
                }

                async function loadMore() {
                    try {
                        setIsLoadingMore(true);

                        const params = new URLSearchParams({
                            query: queryInput.trim(),
                            author: authorInput.trim(),
                            limit: "12",
                        });

                        if (nextCursor) {
                            params.set("cursor", nextCursor);
                        }

                        if (selectedChannel?.id) {
                            params.set("channelId", selectedChannel.id);
                        }

                        const response = await fetch(`/api/search?${params.toString()}`);
                        const result = (await response.json()) as {
                            data?: SearchResponse;
                            error?: { message?: string };
                        };

                        if (!response.ok) {
                            throw new Error(result?.error?.message || "Failed to load more results.");
                        }

                        setResults((current) => [
                            ...current,
                            ...(result.data?.items ?? []),
                        ]);
                        setNextCursor(result.data?.nextCursor ?? null);
                    } catch (loadMoreError) {
                        setError(
                            loadMoreError instanceof Error
                                ? loadMoreError.message
                                : "Failed to load more results.",
                        );
                    } finally {
                        setIsLoadingMore(false);
                    }
                }

                void loadMore();
            },
            { rootMargin: "240px 0px" },
        );

        observer.observe(target);

        return () => observer.disconnect();
    }, [authorInput, isLoading, isLoadingMore, nextCursor, queryInput, selectedChannel]);

    return (
        <main className="min-h-screen bg-background">
            <SearchHeader
                isAuthenticated={isAuthenticated}
                authLabel={authLabel}
                email={authUser?.email}
                role={authUser?.role}
            />

            <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold text-foreground">Search discussions</h1>
                    <p className="text-sm text-muted-foreground">
                        Search across posts and replies, filter by author, and narrow to a specific channel.
                    </p>
                </div>

                <SearchFilters
                    queryInput={queryInput}
                    authorInput={authorInput}
                    channelInput={channelInput}
                    selectedChannel={selectedChannel}
                    filteredChannels={filteredChannels}
                    showChannelOptions={showChannelOptions}
                    onQueryChange={setQueryInput}
                    onAuthorChange={setAuthorInput}
                    onChannelInputChange={(value) => {
                        setChannelInput(value);
                        setShowChannelOptions(true);

                        if (
                            selectedChannel &&
                            value.trim().toLowerCase() !== selectedChannel.name.toLowerCase()
                        ) {
                            setSelectedChannel(null);
                        }
                    }}
                    onChannelFocus={() => setShowChannelOptions(true)}
                    onChannelBlur={() => {
                        window.setTimeout(() => setShowChannelOptions(false), 150);
                    }}
                    onChannelSelect={(channel) => {
                        setSelectedChannel(channel);
                        setChannelInput(channel.name);
                        setShowChannelOptions(false);
                    }}
                    onChannelClear={() => {
                        setSelectedChannel(null);
                        setChannelInput("");
                        setShowChannelOptions(false);
                    }}
                />

                <SearchSummary
                    mostPosts={summary.mostPosts}
                    leastPosts={summary.leastPosts}
                />

                {error ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : null}

                <SearchResults
                    results={results}
                    isLoading={isLoading}
                    isLoadingMore={isLoadingMore}
                    nextCursor={nextCursor}
                    loadMoreRef={loadMoreRef}
                />
            </section>
        </main>
    );
}
