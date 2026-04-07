"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, LogOut, Shield } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SearchHeaderProps = {
    isAuthenticated: boolean;
    authLabel: string;
    email?: string;
    role?: string;
};

export function SearchHeader({
    isAuthenticated,
    authLabel,
    email,
    role,
}: SearchHeaderProps) {
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/auth/logout", {
            method: "POST",
        });

        router.refresh();
    }

    return (
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <Link
                    href="/channels"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to channels
                </Link>

                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <span className="max-w-32 truncate">{authLabel}</span>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{authLabel}</DropdownMenuLabel>
                                {email ? (
                                    <DropdownMenuLabel className="pt-0 text-xs font-normal text-muted-foreground">
                                        {email}
                                    </DropdownMenuLabel>
                                ) : null}
                                <DropdownMenuSeparator />
                                {role === "admin" ? (
                                    <DropdownMenuItem asChild>
                                        <Link href="/admin/users">
                                            <Shield className="h-4 w-4" />
                                            Manage users
                                        </Link>
                                    </DropdownMenuItem>
                                ) : null}
                                {role === "admin" ? <DropdownMenuSeparator /> : null}
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="h-4 w-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link
                            href="/signin"
                            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Sign in
                        </Link>
                    )}
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
