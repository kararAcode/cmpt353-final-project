import { CTA } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Stats } from "@/components/landing/stats";

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-background">
            <Header />
            <Hero />
            <Stats />
            <Features />
            <HowItWorks />
            <CTA />
            <Footer />
        </main>
    );
}
