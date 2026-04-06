"use client";

import { useState } from "react";
import Link from "next/link";
import { Hash, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
];

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                            <Hash className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <span className="text-xl font-semibold text-foreground">
                            DevThreads
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 md:flex">
                        <ThemeToggle />
                        <Button variant="ghost" size="sm">
                            Sign In
                        </Button>
                        <Button size="sm">Get Started</Button>
                    </div>

                    <button
                        type="button"
                        className="p-2 text-muted-foreground transition-colors hover:text-foreground md:hidden"
                        onClick={() => setMobileMenuOpen((open) => !open)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-border bg-background md:hidden">
                    <div className="space-y-4 px-4 py-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="flex flex-col gap-2 border-t border-border pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Theme
                                </span>
                                <ThemeToggle />
                            </div>
                            <Button variant="ghost" size="sm" className="justify-start">
                                Sign In
                            </Button>
                            <Button size="sm">Get Started</Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
