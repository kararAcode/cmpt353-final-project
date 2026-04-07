"use client";

import { Search as SearchIcon, X } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChannelOption } from "@/components/search/search-types";

type SearchFiltersProps = {
    queryInput: string;
    authorInput: string;
    channelInput: string;
    selectedChannel: ChannelOption | null;
    filteredChannels: ChannelOption[];
    showChannelOptions: boolean;
    onQueryChange: (value: string) => void;
    onAuthorChange: (value: string) => void;
    onChannelInputChange: (value: string) => void;
    onChannelFocus: () => void;
    onChannelBlur: () => void;
    onChannelSelect: (channel: ChannelOption) => void;
    onChannelClear: () => void;
};

export function SearchFilters({
    queryInput,
    authorInput,
    channelInput,
    selectedChannel,
    filteredChannels,
    showChannelOptions,
    onQueryChange,
    onAuthorChange,
    onChannelInputChange,
    onChannelFocus,
    onChannelBlur,
    onChannelSelect,
    onChannelClear,
}: SearchFiltersProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                    Channel statistics below are scoped to the selected channel when one is chosen.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="query">
                        Search text
                    </label>
                    <div className="relative">
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="query"
                            value={queryInput}
                            onChange={(event) => onQueryChange(event.target.value)}
                            className="pl-9"
                            placeholder="Search post titles, post bodies, and replies"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="author">
                        Author
                    </label>
                    <Input
                        id="author"
                        value={authorInput}
                        onChange={(event) => onAuthorChange(event.target.value)}
                        placeholder="Filter by author name"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="channel">
                        Channel
                    </label>
                    <div className="relative">
                        <Input
                            id="channel"
                            value={channelInput}
                            onChange={(event) => onChannelInputChange(event.target.value)}
                            onFocus={onChannelFocus}
                            onBlur={onChannelBlur}
                            placeholder="Type a channel name"
                        />
                        {selectedChannel ? (
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                onClick={onChannelClear}
                                aria-label="Clear selected channel"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        ) : null}
                        {showChannelOptions && filteredChannels.length > 0 ? (
                            <div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-popover p-1 shadow-lg">
                                {filteredChannels.map((channel) => (
                                    <button
                                        key={channel.id}
                                        type="button"
                                        className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => onChannelSelect(channel)}
                                    >
                                        #{channel.name}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    {selectedChannel ? (
                        <p className="text-xs text-muted-foreground">
                            Filtering results to #{selectedChannel.name}.
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Start typing to pick a matching channel.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
