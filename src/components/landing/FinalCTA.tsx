import { ArrowRight, Phone, Shield, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const FinalCTA = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardPath = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <section className="py-20 lg:py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 sm:p-14 text-center shadow-large">
          <div className="absolute inset-0 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.08]" />
          <div className="relative max-w-2xl mx-auto text-primary-foreground">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Every Second Counts in an Emergency
            </h2>
            <p className="mt-4 text-primary-foreground/90">
              Don't wait. Get immediate access to ambulances, hospitals, and real-time tracking — completely free.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="emergency"
                size="xl"
                className="animate-pulse-ring"
                onClick={() => navigate(user ? `${dashboardPath}?action=sos` : "/login?redirect=sos")}
              >
                <Phone className="h-5 w-5" /> Request Ambulance Now
              </Button>
              {user && (
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => navigate(dashboardPath)}
                  className="bg-background/10 text-primary-foreground border-primary-foreground/30 hover:bg-background/20 hover:text-primary-foreground"
                >
                  {user.role === "admin" ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  Go to {user.role === "admin" ? "Admin Panel" : "Dashboard"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
