"use client";

import type { FormEvent } from "react";

import { PenSquare } from "lucide-react";

import { ScreenshotPicker } from "@/components/channels/screenshot-picker";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreatePostCardProps = {
    title: string;
    body: string;
    selectedFiles: File[];
    submitError: string;
    isSubmitting: boolean;
    onTitleChange: (value: string) => void;
    onBodyChange: (value: string) => void;
    onFilesChange: (files: File[]) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function CreatePostCard({
    title,
    body,
    selectedFiles,
    submitError,
    isSubmitting,
    onTitleChange,
    onBodyChange,
    onFilesChange,
    onSubmit,
}: CreatePostCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PenSquare className="h-5 w-5 text-accent" />
                    Create a post
                </CardTitle>
                <CardDescription>
                    Share an update, question, or idea with everyone in this channel.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="post-title">Title</Label>
                        <Input
                            id="post-title"
                            value={title}
                            onChange={(event) => onTitleChange(event.target.value)}
                            placeholder="What do you want to talk about?"
                            maxLength={120}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="post-body">Body</Label>
                        <textarea
                            id="post-body"
                            value={body}
                            onChange={(event) => onBodyChange(event.target.value)}
                            placeholder="Add the details for your post."
                            rows={6}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <ScreenshotPicker
                        files={selectedFiles}
                        onFilesChange={onFilesChange}
                        buttonText="Add one or more screenshots"
                    />

                    {submitError ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {submitError}
                        </div>
                    ) : null}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Posting..." : "Publish post"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
