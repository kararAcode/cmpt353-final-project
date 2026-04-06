const stats = [
    { value: "50K+", label: "Active Developers", description: "Growing daily" },
    { value: "1M+", label: "Questions Answered", description: "And counting" },
    { value: "98%", label: "Resolution Rate", description: "Within 24 hours" },
    { value: "500+", label: "Active Channels", description: "Every language" },
];

export function Stats() {
    return (
        <section className="border-y border-border bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-3xl font-bold text-foreground sm:text-4xl">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-sm font-medium text-foreground">
                                {stat.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {stat.description}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
