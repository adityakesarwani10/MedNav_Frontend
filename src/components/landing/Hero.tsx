import { ActivitySquare, ArrowRight, Phone, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LiveStatusPanel } from "./LiveStatusPanel";
import { LiveTicker } from "./LiveTicker";
import { useAuth } from "@/contexts/AuthContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardPath = user?.role === "admin" ? "/admin" : "/dashboard";
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 -z-10 [background-image:radial-gradient(hsl(var(--primary)/0.06)_1px,transparent_1px)] [background-size:22px_22px]" />
      <LiveTicker />
      <div className="container grid lg:grid-cols-2 gap-12 lg:gap-8 items-center py-14 lg:py-20">
        <div className="space-y-7 animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-accent-foreground border border-primary/10">
            <ActivitySquare className="h-3.5 w-3.5 animate-pulse text-primary" />
            24/7 Emergency Response Active
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-balance">
            Emergency Help,{" "}
            {/* <span className="bg-gradient-primary bg-clip-text text-transparent pb-1 inline-block"> */}
            <span className="text-green-400">
              When You Need
            </span>
            <br />
            It Most
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Request an ambulance, find nearby hospitals, and track help in real-time — all in one tap.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="emergency"
              size="xl"
              onClick={() => navigate(user ? `${dashboardPath}?action=sos` : "/login?redirect=sos")}
              className="animate-pulse-ring"
            >
              <Phone className="h-5 w-5" /> SOS Emergency
            </Button>
            {user ? (
              <Button variant="outline" size="xl" onClick={() => navigate(dashboardPath)}>
                {user.role === "admin" ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                Go to {user.role === "admin" ? "Admin Panel" : "Dashboard"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="outline" size="xl" onClick={() => navigate("/login")}>
                Login / Sign Up <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-8 pt-4">
            {[
              { v: "8+", l: "Hospitals" },
              { v: "10+", l: "Ambulances" },
              { v: "<8min", l: "Avg Response" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-2xl font-bold text-primary">{s.v}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="animate-fade-up [animation-delay:120ms]">
          <LiveStatusPanel />
        </div>
      </div>
    </section>
  );
};
