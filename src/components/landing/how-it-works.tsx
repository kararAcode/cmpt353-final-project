const steps = [
    {
        step: "01",
        title: "Join a Channel",
        description:
            "Find the topics you care about most, from frontend frameworks to systems programming.",
    },
    {
        step: "02",
        title: "Ask or Answer",
        description:
            "Post questions with context, screenshots, and code samples, or help others by sharing what you know.",
    },
    {
        step: "03",
        title: "Discuss and Learn",
        description:
            "Engage in threaded conversations, upvote the best solutions, and build your reputation.",
    },
];

export function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="bg-card/30 px-4 py-24 sm:px-6 lg:px-8"
        >
            <div className="mx-auto max-w-7xl">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <h2 className="text-3xl font-bold text-foreground text-balance sm:text-4xl">
                        Get started in minutes
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        No complicated setup. No learning curve. Just sign up and
                        start connecting.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {steps.map((item, index) => (
                        <div key={item.step} className="relative">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-background text-2xl font-bold text-accent">
                                    {item.step}
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-foreground">
                                    {item.title}
                                </h3>
                                <p className="leading-relaxed text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="absolute left-[calc(50%+3rem)] top-8 hidden h-[2px] w-[calc(100%-6rem)] bg-border md:block" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
