"use client";

import { useEffect, useId, useRef } from "react";
import type { ChangeEvent } from "react";

import { ImagePlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScreenshotPickerProps = {
    files: File[];
    onFilesChange: (files: File[]) => void;
    label?: string;
    buttonText?: string;
};

export function ScreenshotPicker({
    files,
    onFilesChange,
    label = "Screenshots",
    buttonText = "Add screenshots",
}: ScreenshotPickerProps) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (files.length === 0 && inputRef.current) {
            inputRef.current.value = "";
        }
    }, [files]);

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        onFilesChange(Array.from(event.target.files ?? []));
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={inputId}>{label}</Label>
            <label
                htmlFor={inputId}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
            >
                <ImagePlus className="h-4 w-4" />
                <span>{buttonText}</span>
            </label>
            <Input
                id={inputId}
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
            />
            {files.length > 0 ? (
                <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {files.map((file) => file.name).join(", ")}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">
                    PNG, JPEG/JPG, and WebP screenshots up to 5 MB each.
                </p>
            )}
        </div>
    );
}
