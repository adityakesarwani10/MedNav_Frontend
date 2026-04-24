import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart, KeyRound, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";


const Login = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect");
  const { setUser, user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [confirmedPhone, setConfirmedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (user) {
      const target = user.role === "admin" ? "/admin" : "/dashboard";
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      toast({ title: "Invalid number", description: "Enter a valid 10-digit phone number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.sendOtp(phone);
      setConfirmedPhone(res.phone);
      setStep("otp");
      setResendIn(30);
      toast({
        title: "OTP sent",
        description: `A one-time code was sent to ${res.phone}.`,
      });
    } catch (err) {
      toast({ title: "Failed to send OTP", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading || otp.length !== 6) return;
    setLoading(true);
    try {
      const u = await api.verifyOtp(otp);
      setUser(u);
      toast({
        title: `Welcome, ${u.name}`,
        description: u.role === "admin" ? "Opening admin panel…" : "Opening your dashboard…",
      });
      const target = u.role === "admin" ? "/admin" : redirect === "sos" ? "/dashboard?action=sos" : "/dashboard";
      navigate(target, { replace: true });
    } catch (err) {
      toast({ title: "Verification failed", description: (err as Error).message, variant: "destructive" });
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <header className="container py-5">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-primary group-hover:scale-105 transition-spring">
            <Heart className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold">MedNav</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border/60 bg-card shadow-large p-7 sm:p-9 animate-fade-up">
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${step === "phone" ? "bg-gradient-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
                {step === "phone" ? <Phone className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold leading-tight">
                  {step === "phone" ? "Sign in to MedNav" : "Enter verification code"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {step === "phone"
                    ? "We'll send a one-time code to your phone."
                    : `Sent to ${confirmedPhone}`}
                </p>
              </div>
            </div>

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="flex gap-2">
                    <div className="flex h-11 items-center rounded-full border border-input bg-background px-4 text-sm font-medium text-muted-foreground">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      autoFocus
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, "").slice(0, 12))}
                      className="h-11 rounded-full px-5 text-base"
                    />
                  </div>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {loading ? "Sending OTP…" : "Send OTP"}
                </Button>

                <div className="rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground flex gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    One login for everyone. Your role (user / admin) is detected automatically from your phone number on the backend.
                  </span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-3">
                  <Label>6-digit code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(v) => setOtp(v)}
                      autoFocus
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Didn't receive the code? Check your SMS or use Resend.
                  </p>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {loading ? "Verifying…" : "Verify & continue"}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(""); }}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-base"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Change number
                  </button>
                  <button
                    type="button"
                    disabled={resendIn > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="font-semibold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            One sign-in for users and admins · role detected by your phone number
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
