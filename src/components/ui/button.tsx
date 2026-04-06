import * as React from "react";

type ButtonVariant = "default" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
        "border border-border bg-background hover:bg-accent/10 hover:text-accent",
    ghost: "hover:bg-accent/10 hover:text-accent",
};

const sizeClasses: Record<ButtonSize, string> = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-11 px-6 text-base",
    icon: "size-9",
};

export function Button({
    className = "",
    variant = "default",
    size = "default",
    type = "button",
    ...props
}: ButtonProps) {
    const classes = [
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return <button type={type} className={classes} {...props} />;
}
