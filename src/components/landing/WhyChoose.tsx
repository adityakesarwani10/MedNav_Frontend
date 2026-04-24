import { Clock, Heart, ShieldCheck, Zap } from "lucide-react";

const features = [
  { icon: Zap, title: "Lightning Fast", desc: "Average dispatch under 2 minutes" },
  { icon: ShieldCheck, title: "Verified Fleet", desc: "All ambulances GPS-tracked & certified" },
  { icon: Heart, title: "Life-Saving", desc: "10,000+ successful emergency responses" },
  { icon: Clock, title: "24/7 Available", desc: "Round-the-clock emergency coverage" },
];

export const WhyChoose = () => (
  <section id="why" className="py-20 lg:py-24 bg-secondary/40 border-y border-border/60">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Why Choose MedNav?</h2>
        <p className="mt-3 text-muted-foreground">Trusted by thousands in emergency situations</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-border/60 bg-card p-6 text-center transition-base hover:-translate-y-1 hover:shadow-medium hover:border-primary/30"
          >
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <f.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
