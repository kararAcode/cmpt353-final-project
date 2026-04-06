import {
    GitBranch,
    Hash,
    Image,
    MessageSquare,
    Search,
    ThumbsUp,
} from "lucide-react";

const features = [
    {
        icon: Hash,
        title: "Organized Channels",
        description:
            "Browse and create channels for every topic. From #react to #rust, find your community.",
    },
    {
        icon: MessageSquare,
        title: "Post Questions",
        description:
            "Share your coding challenges with context. Get help from developers who have been there.",
    },
    {
        icon: GitBranch,
        title: "Threaded Discussions",
        description:
            "Keep conversations organized with nested replies. No more losing track of solutions.",
    },
    {
        icon: Image,
        title: "Screenshot Attachments",
        description:
            "Show, don't just tell. Attach screenshots and code snippets to any post or reply.",
    },
    {
        icon: ThumbsUp,
        title: "Community Voting",
        description:
            "Surface the best answers. Upvote helpful responses and downvote noise.",
    },
    {
        icon: Search,
        title: "Powerful Search",
        description:
            "Find solutions fast. Search across all content, users, and code snippets.",
    },
];

export function Features() {
    return (
        <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <h2 className="text-3xl font-bold text-foreground text-balance sm:text-4xl">
                        Everything you need to collaborate
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Built by developers, for developers. Every feature is
                        designed to help you find answers faster.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/50"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent/20">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-foreground">
                                {feature.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
