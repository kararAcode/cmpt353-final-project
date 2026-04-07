import Link from "next/link";
import { Hash } from "lucide-react";

const footerLinks = {
    Product: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Changelog", href: "#" },
        { label: "Roadmap", href: "#" },
    ],
    Company: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
    ],
    Resources: [
        { label: "Documentation", href: "#" },
        { label: "Help Center", href: "#" },
        { label: "Community", href: "#" },
        { label: "API", href: "#" },
    ],
    Legal: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Cookie Policy", href: "#" },
    ],
};

export function Footer() {
    return (
        <footer className="border-t border-border bg-card/50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                                <Hash className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <span className="text-xl font-semibold text-foreground">
                                DevThreads
                            </span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                            The channel-based platform where developers connect,
                            ask questions, and grow together.
                        </p>
                        <div className="mt-4 flex items-center gap-4">
                            <Link
                                href="#"
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                GitHub
                            </Link>
                            <Link
                                href="#"
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                X
                            </Link>
                        </div>
                    </div>

                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h3 className="mb-4 text-sm font-semibold text-foreground">
                                {category}
                            </h3>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} DevThreads. All rights
                        reserved.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Built with care for the developer community
                    </p>
                </div>
            </div>
        </footer>
    );
}
