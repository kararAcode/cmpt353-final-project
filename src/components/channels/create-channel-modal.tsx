"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateChannelModalProps = {
    isOpen: boolean;
    channelName: string;
    submitError: string;
    isSubmitting: boolean;
    onChannelNameChange: (value: string) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function CreateChannelModal({
    isOpen,
    channelName,
    submitError,
    isSubmitting,
    onChannelNameChange,
    onClose,
    onSubmit,
}: CreateChannelModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
            <DialogContent className="max-w-md p-0">
                <DialogHeader className="border-b border-border px-6 py-4">
                    <DialogTitle>Create channel</DialogTitle>
                    <DialogDescription>
                        Give your new channel a short, memorable name.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4 px-6 py-5">
                    <div className="space-y-2">
                        <Label htmlFor="channel-name">Channel name</Label>
                        <Input
                            id="channel-name"
                            value={channelName}
                            onChange={(event) => onChannelNameChange(event.target.value)}
                            placeholder="e.g. react-help"
                            autoFocus
                            maxLength={50}
                        />
                    </div>

                    {submitError ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {submitError}
                        </div>
                    ) : null}

                    <DialogFooter className="px-0 pb-0 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
