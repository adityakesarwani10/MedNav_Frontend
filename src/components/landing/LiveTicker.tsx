import { useEffect, useState } from "react";
import { Ambulance } from "lucide-react";
import { api, BackendAmbulance } from "@/lib/api";

export const LiveTicker = () => {
  const [onTrip, setOnTrip] = useState<BackendAmbulance | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const fleet = await api.public.fleet();
        if (cancelled) return;
        const busy = fleet.find(
          (a) => a.status === "on-trip" || a.status === "en_route" || a.status === "busy",
        );
        setOnTrip(busy || null);
      } catch {
        if (!cancelled) setOnTrip(null);
      }
    };

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!onTrip) return null;
  return (
    <div className="border-b border-border/60 bg-background/60 backdrop-blur">
      <div className="container flex items-center gap-3 py-2 text-xs sm:text-sm overflow-hidden">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 font-semibold text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-blink" />
          LIVE
        </span>
        <Ambulance className="h-4 w-4 text-emergency shrink-0" />
        <p className="truncate text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{onTrip.plate || onTrip.id}</span> — On Trip
          {onTrip.driver ? ` · ${onTrip.driver}` : ""}
          {onTrip.hospital ? ` · ${onTrip.hospital}` : ""}
        </p>
      </div>
    </div>
  );
};
