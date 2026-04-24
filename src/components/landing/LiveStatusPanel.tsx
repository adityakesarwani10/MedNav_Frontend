import { useEffect, useState } from "react";
import { Ambulance as AmbIcon, Bed, Building2, Clock, Zap } from "lucide-react";
import { api, BackendAmbulance, BackendHospital } from "@/lib/api";

const StatTile = ({
  icon: Icon,
  value,
  label,
  tone = "primary",
}: {
  icon: typeof Building2;
  value: number | string;
  label: string;
  tone?: "primary" | "warning" | "emergency" | "success";
}) => {
  const toneMap = {
    primary: "bg-primary-soft text-primary",
    warning: "bg-warning-soft text-warning",
    emergency: "bg-emergency-soft text-emergency",
    success: "bg-primary-soft text-success",
  } as const;
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 transition-base hover:border-primary/30 hover:-translate-y-0.5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneMap[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 font-display text-2xl font-bold leading-none">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const statusBadge = (s?: string, available?: boolean) => {
  if (s === "available" || available) return "bg-success/10 text-success";
  if (s === "on-trip" || s === "busy" || s === "en_route") return "bg-warning-soft text-warning";
  return "bg-muted text-muted-foreground";
};

export const LiveStatusPanel = () => {
  const [fleet, setFleet] = useState<BackendAmbulance[]>([]);
  const [hospitals, setHospitals] = useState<BackendHospital[]>([]);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [f, h] = await Promise.all([api.public.fleet(), api.public.hospitals()]);
        if (cancelled) return;
        setFleet(f);
        setHospitals(h);
        setOnline(true);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const available = fleet.filter((a) => a.available || a.status === "available").length;
  const bedsFree = hospitals.reduce((s, h) => s + (h.erBeds ?? 0), 0);

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-gradient-primary opacity-10 blur-3xl rounded-full" aria-hidden />
      <div className="relative rounded-3xl border border-border/60 bg-gradient-card p-5 sm:p-6 shadow-large">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-bold">Live Status</h3>
            <p className="text-xs text-muted-foreground">Refreshes every minute</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${online ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-success animate-blink" : "bg-muted-foreground"}`} />
            {online ? "Online" : "Offline"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={Building2} value={hospitals.length} label="Hospitals" />
          <StatTile icon={AmbIcon} value={fleet.length} label="Ambulances" tone="warning" />
          <StatTile icon={Zap} value={available} label="Available" tone="success" />
          <StatTile icon={Bed} value={bedsFree} label="ER Beds Free" />
        </div>

        <div className="mt-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Recent Activity
          </div>
          <div className="space-y-2">
            {fleet.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl bg-secondary/60 p-3 hover:bg-secondary transition-base"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary shrink-0">
                    <AmbIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold truncate">{a.plate || a.id}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.driver || "—"}</div>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusBadge(a.status, a.available)}`}>
                  {(a.status === "on-trip" || a.status === "en_route" || a.status === "busy") ? "On Trip" : (a.status || (a.available ? "available" : "offline"))}
                </span>
              </div>
            ))}
            {fleet.length === 0 && (
              <div className="rounded-xl bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
                Waiting for live data…
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-success/20 bg-success/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-success">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Avg. Response</div>
            <div className="text-xs text-muted-foreground">&lt;3 min dispatch time</div>
          </div>
        </div>
      </div>
    </div>
  );
};
