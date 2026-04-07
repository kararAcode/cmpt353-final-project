import { Hash } from "lucide-react";

import { ChannelDetail, formatChannelDate } from "@/components/channels/channel-detail-types";
import { Card, CardContent } from "@/components/ui/card";
import { pickChannelThumbnail } from "@/lib/channel-branding";

type ChannelHeroCardProps = {
    channel: ChannelDetail;
};

export function ChannelHeroCard({ channel }: ChannelHeroCardProps) {
    const thumbnail = pickChannelThumbnail(channel.id + channel.name);

    return (
        <Card className="overflow-hidden border-border/80">
            <CardContent className="grid gap-6 px-6 py-6 md:grid-cols-[auto,1fr] md:items-center">
                <div
                    className={`flex h-20 w-20 items-center justify-center rounded-3xl text-4xl ${thumbnail.bgClass}`}
                >
                    <span aria-hidden="true">{thumbnail.emoji}</span>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground">
                            <Hash className="h-3.5 w-3.5" />
                            {channel.name}
                        </span>
                        <span>{channel.postCount} posts</span>
                        <span>Created by {channel.createdBy.displayName}</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                            {channel.name}
                        </h1>
                        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                            {channel.description ||
                                "A place for this community to share updates, ask questions, and keep the conversation going."}
                        </p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Opened {formatChannelDate(channel.createdAt)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
