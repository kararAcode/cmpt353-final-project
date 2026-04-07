import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
    return (
        <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />

                    <div className="relative">
                        <h2 className="text-3xl font-bold text-foreground text-balance sm:text-4xl">
                            Ready to join the conversation?
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                            Sign up for free and start connecting with developers
                            who share your passion for building great software.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Button size="lg" className="w-full gap-2 sm:w-auto">
                                Get Started Free <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                Schedule a Demo
                            </Button>
                        </div>

                        <p className="mt-6 text-sm text-muted-foreground">
                            No credit card required. Free forever for individuals.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
