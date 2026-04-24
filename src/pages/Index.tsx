import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyChoose } from "@/components/landing/WhyChoose";
import { FinalCTA } from "@/components/landing/FinalCTA";

const Index = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1">
      <Hero />
      <section id="live" />
      <HowItWorks />
      <WhyChoose />
      <FinalCTA />
    </main>
    <Footer />
  </div>
);

export default Index;
