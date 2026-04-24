import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { api, BackendAmbulance, BackendCall, BackendHospital } from "@/lib/api";
import { Ambulance as AmbIcon, Bed, Building2, ClipboardList, Loader2, ShieldCheck, TrendingUp, UserCog, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  trend?: string;
}) => (
  <Card className="rounded-3xl border-border/60 bg-gradient-card">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold">{value}</p>
          {trend && <p className="mt-1 text-xs text-success font-semibold flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {trend}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const ambStatusBadge = (s?: string) => {
  if (s === "available") return "bg-success/10 text-success hover:bg-success/10";
  if (s === "on-trip" || s === "en_route" || s === "busy") return "bg-warning-soft text-warning hover:bg-warning-soft";
  return "bg-muted text-muted-foreground hover:bg-muted";
};

const callStatusBadge = (s?: string) => {
  switch (s) {
    case "pending": return "bg-warning-soft text-warning hover:bg-warning-soft";
    case "dispatched": return "bg-primary-soft text-accent-foreground hover:bg-primary-soft";
    case "en_route":
    case "on-trip": return "bg-emergency-soft text-emergency hover:bg-emergency-soft";
    case "completed": return "bg-success/10 text-success hover:bg-success/10";
    default: return "bg-muted text-muted-foreground hover:bg-muted";
  }
};

type AdminUser = { id: string; name?: string; phone: string; role: string };
type Overview = { stats: Record<string, number>; recentActivity: BackendCall[]; systemStatus: string };

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ambs, setAmbs] = useState<BackendAmbulance[]>([]);
  const [hosp, setHosp] = useState<BackendHospital[]>([]);
  const [calls, setCalls] = useState<BackendCall[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refresh = async () => {
    try {
      const [f, h, c, u] = await Promise.all([
        api.admin.fleet(),
        api.admin.hospitals(),
        api.admin.calls(),
        api.admin.users(),
      ]);
      setAmbs(f);
      setHosp(h);
      setCalls(c);
      setUsers(u as { id: string; name?: string; phone: string; role: string }[]);
    } catch (err) {
      toast({ title: "Failed to load admin data", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    let cancelled = false;
    const tick = async () => {
      try {
        const c = await api.admin.calls();
        const o = await api.admin.overview().catch(() => null);
        if (cancelled) return;
        setCalls(c);
        if (o) setOverview(o);
        setLastSync(new Date());
      } catch {
        // swallow transient polling errors
      }
    };
    const interval = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => ({
      ambulances: ambs.length,
      available: ambs.filter((a) => a.available || a.status === "available").length,
      hospitals: hosp.length,
      beds: hosp.reduce((s, h) => s + (h.erBeds ?? 0), 0),
      activeCalls: calls.filter((b) => b.status !== "completed" && b.status !== "cancelled").length,
      users: users.length,
    }),
    [ambs, hosp, calls, users],
  );

  const cycleAmbStatus = async (a: BackendAmbulance) => {
    const order = ["available", "on-trip", "offline"];
    const cur = a.status || (a.available ? "available" : "offline");
    const next = order[(order.indexOf(cur) + 1) % order.length];
    setBusyId(a.id);
    try {
      await api.admin.updateAmbulance(a.id, { status: next, available: next === "available" });
      setAmbs((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: next, available: next === "available" } : x)));
      toast({ title: "Updated", description: `${a.plate || a.id} → ${next}` });
    } catch (err) {
      toast({ title: "Update failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const adjustBeds = async (h: BackendHospital, delta: number) => {
    const newVal = Math.max(0, Math.min(h.totalBeds ?? 9999, (h.erBeds ?? 0) + delta));
    setBusyId(h.id);
    try {
      await api.admin.updateHospital(h.id, { erBeds: newVal });
      setHosp((prev) => prev.map((x) => (x.id === h.id ? { ...x, erBeds: newVal } : x)));
    } catch (err) {
      toast({ title: "Update failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-hero border-b border-border/60">
          <div className="container py-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge variant="secondary" className="rounded-full mb-3 gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-primary" /> Admin Console
                </Badge>
                <h1 className="font-display text-3xl font-extrabold tracking-tight">Operations Overview</h1>
                <p className="text-sm text-muted-foreground mt-1">Signed in as {user?.name} · {user?.phone}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Live · auto-refresh 2s
                  {lastSync && (
                    <span className="text-success/70 font-mono ml-1">
                      {lastSync.toLocaleTimeString()}
                    </span>
                  )}
                </span>
                {overview?.systemStatus && (
                  <Badge variant="secondary" className="rounded-full capitalize">
                    {overview.systemStatus}
                  </Badge>
                )}
                <Button variant="outline" onClick={() => { setLoading(true); refresh(); }}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={AmbIcon} label="Ambulances" value={stats.ambulances} />
            <StatCard icon={ShieldCheck} label="Available" value={stats.available} />
            <StatCard icon={Building2} label="Hospitals" value={stats.hospitals} />
            <StatCard icon={Bed} label="ER Beds Free" value={stats.beds} />
            <StatCard icon={ClipboardList} label="Active Calls" value={stats.activeCalls} />
            <StatCard icon={UserCog} label="Users" value={stats.users} />
          </div>

          <Tabs defaultValue="calls" className="space-y-5">
            <TabsList className="rounded-full bg-secondary/70 p-1 flex flex-wrap h-auto">
              <TabsTrigger value="calls" className="rounded-full px-5">Calls</TabsTrigger>
              <TabsTrigger value="ambulances" className="rounded-full px-5">Ambulances</TabsTrigger>
              <TabsTrigger value="hospitals" className="rounded-full px-5">Hospitals</TabsTrigger>
              <TabsTrigger value="users" className="rounded-full px-5">Users</TabsTrigger>
            </TabsList>

            {/* Calls */}
            <TabsContent value="calls">
              <Card className="rounded-3xl border-border/60 overflow-hidden">
                <CardHeader>
                  <CardTitle className="font-display">All calls</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Patient / Condition</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ambulance</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calls.length === 0 && !loading && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No calls yet.</TableCell></TableRow>
                        )}
                        {calls.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono text-xs">{b.id}</TableCell>
                            <TableCell>
                              <div className="font-semibold">{b.patient || b.patientName || b.condition || "—"}</div>
                              {b.phone && <div className="text-xs text-muted-foreground font-mono">{b.phone}</div>}
                            </TableCell>
                            <TableCell>
                              {b.priority && <Badge variant="secondary" className="rounded-full capitalize">{b.priority}</Badge>}
                            </TableCell>
                            <TableCell>
                              <Badge className={`rounded-full capitalize ${callStatusBadge(b.status)}`}>
                                {(b.status || "—").replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{b.ambulance || b.ambulanceId || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{b.timestamp || b.createdAt || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ambulances */}
            <TabsContent value="ambulances">
              <Card className="rounded-3xl border-border/60 overflow-hidden">
                <CardHeader>
                  <CardTitle className="font-display">Fleet</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plate</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Hospital</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Toggle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ambs.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-mono font-semibold">{a.plate || a.id}</TableCell>
                            <TableCell>
                              <div>{a.driver || "—"}</div>
                              {a.phone && <div className="text-xs text-muted-foreground font-mono">{a.phone}</div>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{a.hospital || "—"}</TableCell>
                            <TableCell>
                              <Badge className={`rounded-full capitalize ${ambStatusBadge(a.status)}`}>
                                {(a.status || (a.available ? "available" : "offline")).replace("-", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => cycleAmbStatus(a)} disabled={busyId === a.id}>
                                {busyId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cycle status"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hospitals */}
            <TabsContent value="hospitals">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hosp.map((h) => (
                  <Card key={h.id} className="rounded-3xl border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="font-display text-lg">{h.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{h.area || h.address}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-end gap-2">
                        <div className="font-display text-3xl font-bold text-primary">{h.erBeds ?? 0}</div>
                        <div className="text-sm text-muted-foreground pb-1">/ {h.totalBeds ?? 0} ER beds free</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => adjustBeds(h, -1)} disabled={busyId === h.id}>-1 bed</Button>
                        <Button size="sm" variant="soft" className="flex-1" onClick={() => adjustBeds(h, 1)} disabled={busyId === h.id}>+1 bed</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Users */}
            <TabsContent value="users">
              <Card className="rounded-3xl border-border/60 overflow-hidden">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2"><Users className="h-5 w-5" /> Users</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-mono text-xs">{u.id}</TableCell>
                            <TableCell className="font-semibold">{u.name || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{u.phone}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="rounded-full capitalize">{u.role}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
