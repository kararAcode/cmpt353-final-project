const THUMBNAILS = [
    { emoji: "💬", bgClass: "bg-primary/15 text-primary" },
    { emoji: "🧠", bgClass: "bg-accent/15 text-accent" },
    { emoji: "⚙️", bgClass: "bg-secondary text-secondary-foreground" },
    { emoji: "🚀", bgClass: "bg-primary/10 text-primary" },
    { emoji: "🛠️", bgClass: "bg-accent/10 text-accent" },
    { emoji: "📦", bgClass: "bg-secondary/80 text-secondary-foreground" },
];

export function pickChannelThumbnail(seed: string) {
    const value = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return THUMBNAILS[value % THUMBNAILS.length] ?? THUMBNAILS[0];
}
