import Image from "next/image";

import { AttachmentSummary } from "@/components/channels/channel-detail-types";

type AttachmentGalleryProps = {
    attachments: AttachmentSummary[];
};

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
    if (attachments.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {attachments.map((attachment, index) => (
                <a
                    key={attachment.id}
                    href={attachment.path}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-border/70 bg-muted/30 transition-colors hover:border-accent/50"
                >
                    <div className="relative aspect-[4/3] bg-muted">
                        <Image
                            src={attachment.path}
                            alt={`Uploaded screenshot ${index + 1}`}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                            sizes="(max-width: 640px) 100vw, 50vw"
                        />
                    </div>
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                        {(attachment.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </div>
                </a>
            ))}
        </div>
    );
}
