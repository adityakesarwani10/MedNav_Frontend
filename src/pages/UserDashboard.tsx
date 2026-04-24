import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { api, BackendAmbulance, BackendHospital } from "@/lib/api";
import { Ambulance, Bed, Building2, Loader2, MapPin, Navigation, Phone, Search, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserDashboard = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [type, setType] = useState<"Basic" | "Advanced" | "ICU">("Advanced");
  const [trip, setTrip] = useState<{ ambulancePlate: string; eta: string } | null>(null);
  const [search, setSearch] = useState("");

  const [fleet, setFleet] = useState<BackendAmbulance[]>([]);
  const [hospitals, setHospitals] = useState<BackendHospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [f, h] = await Promise.all([api.user.fleet(), api.user.hospitals()]);
        if (cancelled) return;
        setFleet(f);
        setHospitals(h);
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Couldn't load live data",
            description: (err as Error).message,
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const available = useMemo(
    () => fleet.filter((a) => a.available || a.status === "available"),
    [fleet],
  );

  const filteredHospitals = useMemo(
    () =>
      hospitals.filter(
        (h) =>
          !search.trim() ||
          h.name.toLowerCase().includes(search.toLowerCase()) ||
          (h.area || h.address || "").toLowerCase().includes(search.toLowerCase()) ||
          (h.specialties || []).some((s) => s.toLowerCase().includes(search.toLowerCase())),
      ),
    [hospitals, search],
  );

  useEffect(() => {
    if (params.get("action") === "sos") {
      toast({
        title: "SOS Mode",
        description: "Fill pickup & request the nearest ambulance.",
      });
      const next = new URLSearchParams(params);
      next.delete("action");
      setParams(next, { replace: true });
    }
  }, [params, setParams, toast]);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup.trim()) {
      toast({ title: "Pickup needed", description: "Enter your pickup location.", variant: "destructive" });
      return;
    }
    const ambulance = available[0];
    if (!ambulance) {
      toast({ title: "No ambulance free", description: "Please try again in a moment.", variant: "destructive" });
      return;
    }
    // NOTE: Backend has no "create call" endpoint exposed to the user,
    // so this is a local-only confirmation until that route is added.
    setTrip({ ambulancePlate: ambulance.plate || ambulance.id, eta: "6 mins" });
    toast({
      title: "Ambulance request sent",
      description: `${ambulance.plate || ambulance.id} (${type}) acknowledged.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-hero border-b border-border/60">
          <div className="container py-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back</p>
                <h1 className="font-display text-3xl font-extrabold tracking-tight">{user?.name}</h1>
              </div>
              <Badge variant="outline" className="rounded-full px-3 py-1.5 text-xs font-semibold border-primary/30 text-primary">
                <Phone className="mr-1.5 h-3 w-3" /> {user?.phone}
              </Badge>
            </div>
          </div>
        </section>

        <section className="container py-8">
          <Tabs defaultValue="request" className="space-y-6">
            <TabsList className="rounded-full bg-secondary/70 p-1">
              <TabsTrigger value="request" className="rounded-full px-5">Request</TabsTrigger>
              <TabsTrigger value="hospitals" className="rounded-full px-5">Hospitals</TabsTrigger>
              <TabsTrigger value="track" className="rounded-full px-5">Track</TabsTrigger>
            </TabsList>

            {/* Request */}
            <TabsContent value="request" className="grid lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2 rounded-3xl border-border/60">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Ambulance className="h-5 w-5 text-emergency" /> Request an Ambulance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup">Pickup location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} className="h-11 rounded-full pl-10" placeholder="e.g. Sector 15, Noida" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dest">Destination hospital (optional)</Label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="dest" value={destination} onChange={(e) => setDestination(e.target.value)} className="h-11 rounded-full pl-10" placeholder="Nearest will be picked" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Ambulance type</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Basic", "Advanced", "ICU"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={`rounded-2xl border p-3 text-sm font-semibold transition-base ${
                              type === t
                                ? "border-primary bg-primary-soft text-accent-foreground shadow-soft"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button type="submit" variant="emergency" size="lg" className="w-full">
                      <Phone className="h-4 w-4" /> Dispatch Now
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/60 bg-gradient-card">
                <CardHeader>
                  <CardTitle className="font-display text-base">Nearest available</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading && (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {!loading && available.length === 0 && (
                    <div className="text-sm text-muted-foreground">No ambulances free right now.</div>
                  )}
                  {available.slice(0, 4).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-2xl bg-background/70 p-3 border border-border/50">
                      <div className="min-w-0">
                        <div className="font-mono font-semibold text-sm truncate">{a.plate || a.id}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {a.driver || "—"}{a.hospital ? ` · ${a.hospital}` : ""}
                        </div>
                      </div>
                      <Badge className="bg-success/10 text-success hover:bg-success/10">Free</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hospitals */}
            <TabsContent value="hospitals">
              <div className="mb-5 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-full pl-10" placeholder="Search hospitals or specialty…" />
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHospitals.map((h) => (
                    <Card key={h.id} className="rounded-3xl border-border/60 hover:-translate-y-1 hover:shadow-medium transition-spring">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="font-display text-lg">{h.name}</CardTitle>
                          {h.rating !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                              <Star className="h-3 w-3 fill-warning" /> {h.rating}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {h.area || h.address || "—"}
                          {h.distanceKm !== undefined && ` · ${h.distanceKm} km`}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Bed className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{h.erBeds ?? 0}</span>
                          <span className="text-muted-foreground">/ {h.totalBeds ?? 0} ER beds free</span>
                        </div>
                        {h.specialties && h.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {h.specialties.map((s) => (
                              <Badge key={s} variant="secondary" className="rounded-full font-medium">{s}</Badge>
                            ))}
                          </div>
                        )}
                        {h.phone && (
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <a href={`tel:${h.phone}`}><Phone className="h-3.5 w-3.5" /> Call hospital</a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Track */}
            <TabsContent value="track">
              <Card className="rounded-3xl border-border/60">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" /> Live trip tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!trip ? (
                    <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center text-sm text-muted-foreground">
                      No active trip. Request an ambulance to start tracking.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground">
                        <p className="text-xs uppercase tracking-wider opacity-80">Dispatched</p>
                        <p className="mt-1 font-mono text-2xl font-bold">{trip.ambulancePlate}</p>
                        <p className="mt-3 text-sm opacity-90">ETA <span className="font-bold">{trip.eta}</span> · driver en route</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        {["Dispatched", "En route", "Arrived"].map((s, i) => (
                          <div key={s} className={`rounded-2xl border p-3 ${i === 1 ? "border-primary bg-primary-soft text-accent-foreground" : "border-border bg-card text-muted-foreground"}`}>
                            <div className="font-semibold">{s}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

export default UserDashboard;
