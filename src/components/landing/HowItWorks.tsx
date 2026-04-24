import { Ambulance, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const steps = [
  {
    num: "01",
    icon: Ambulance,
    title: "Request Ambulance",
    desc: "Share your location and get the nearest ambulance dispatched to you immediately.",
  },
  {
    num: "02",
    icon: Building2,
    title: "Find Hospitals",
    desc: "Browse nearby hospitals with real-time bed availability and direct contact info.",
  },
  {
    num: "03",
    icon: MapPin,
    title: "Track In Real-Time",
    desc: "Live GPS tracking of your dispatched ambulance with accurate ETA updates.",
  },
];

export const HowItWorks = () => {
  const navigate = useNavigate();
  return (
    <section id="how" className="py-20 lg:py-24">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">How It Works</h2>
          <p className="mt-3 text-muted-foreground">Three simple steps to get emergency help fast</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div
              key={s.num}
              className="group relative rounded-3xl border border-border/60 bg-card p-7 transition-spring hover:-translate-y-1 hover:shadow-large hover:border-primary/30"
            >
              <span className="absolute top-5 right-6 font-display text-5xl font-extrabold text-primary/10 group-hover:text-primary/20 transition-base">
                {s.num}
              </span>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-primary text-primary-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <Button variant="ghost" size="sm" className="mt-4 -ml-3 text-primary" onClick={() => navigate("/login")}>
                Get Started →
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
