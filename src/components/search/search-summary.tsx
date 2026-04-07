"use client";

import { UserRound } from "lucide-react";

import { SearchSummaryUser } from "@/components/search/search-types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

function SummaryCard({
    title,
    description,
    user,
}: {
    title: string;
    description: string;
    user: SearchSummaryUser | null;
}) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>{description}</CardDescription>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {user ? (
                    <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                            {user.displayName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {user.postCount} {user.postCount === 1 ? "post" : "posts"}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No posts yet for this scope.</p>
                )}
            </CardContent>
        </Card>
    );
}

type SearchSummaryProps = {
    mostPosts: SearchSummaryUser | null;
    leastPosts: SearchSummaryUser | null;
};

export function SearchSummary({ mostPosts, leastPosts }: SearchSummaryProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <SummaryCard
                title="Most posts"
                description="Top poster"
                user={mostPosts}
            />
            <SummaryCard
                title="Least posts"
                description="Lowest post count"
                user={leastPosts}
            />
        </div>
    );
}
