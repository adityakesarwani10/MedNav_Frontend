import { useEffect, useRef, useState } from "react";
import { Device } from "@twilio/voice-sdk";

const TOKEN_URL = "https://mednav-backend.onrender.com/api/token";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .mn-root {
    min-height: 100svh;
    background: #060d1a;
    display: flex;
    flex-direction: column;
    font-family: 'Sora', sans-serif;
    position: relative;
    overflow: hidden;
  }
  .mn-bg-glow {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
  }
  .mn-bg-glow::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(ellipse at center,
      rgba(220,38,38,0.07) 0%, rgba(16,185,129,0.04) 40%, transparent 70%);
    border-radius: 50%;
    animation: mn-ambientPulse 4s ease-in-out infinite;
  }
  @keyframes mn-ambientPulse {
    0%,100% { opacity:0.6; transform:translate(-50%,-50%) scale(1); }
    50% { opacity:1; transform:translate(-50%,-50%) scale(1.1); }
  }
  .mn-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none; z-index: 0;
  }

  /* Navbar */
  .mn-navbar {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px;
    background: rgba(6,13,26,0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .mn-nav-logo { display: flex; align-items: center; gap: 9px; }
  .mn-nav-mark {
    width: 34px; height: 34px;
    background: linear-gradient(135deg,#dc2626,#b91c1c);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px;
    box-shadow: 0 4px 12px rgba(220,38,38,0.45);
    flex-shrink: 0;
  }
  .mn-nav-brand { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; color: #fff; }
  .mn-nav-brand span { color: #dc2626; }
  .mn-nav-links { display: flex; align-items: center; gap: 4px; }
  .mn-nav-link {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 10px;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.45);
    cursor: pointer; border: none; background: none;
    font-family: 'Sora', sans-serif;
    transition: all 0.2s; text-decoration: none;
  }
  .mn-nav-link:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.05); }
  .mn-nav-link.active {
    color: #fff;
    background: rgba(220,38,38,0.12);
    border: 1px solid rgba(220,38,38,0.2);
  }
  .mn-nav-link-icon { font-size: 15px; }
  .mn-nav-menu {
    width: 34px; height: 34px; border-radius: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.07);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 3px; cursor: pointer;
  }
  .mn-menu-line { width: 14px; height: 1.5px; background: rgba(255,255,255,0.45); border-radius: 2px; }

  /* Main */
  .mn-main {
    flex: 1; display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 1; padding: 40px 24px;
  }

  /* Card */
  .mn-card {
    width: 100%; max-width: 360px;
    background: linear-gradient(145deg, #0d1b2e 0%, #0a1420 100%);
    border-radius: 32px;
    border: 1.5px solid rgba(255,255,255,0.07);
    box-shadow:
      0 40px 80px rgba(0,0,0,0.5),
      0 0 0 1px rgba(255,255,255,0.03),
      inset 0 1px 0 rgba(255,255,255,0.07);
    overflow: hidden; padding-bottom: 28px;
  }
  .mn-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 24px 16px;
  }
  .mn-card-title { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.3px; }
  .mn-card-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }
  .mn-status-badge {
    display: flex; align-items: center; gap: 5px;
    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 20px; padding: 4px 10px;
    font-size: 11px; font-weight: 500; color: #34d399;
    font-family: 'JetBrains Mono', monospace;
  }
  .mn-badge-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #34d399; box-shadow: 0 0 6px rgba(52,211,153,0.8);
    animation: mn-blink 2s ease-in-out infinite;
  }
  @keyframes mn-blink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  .mn-divider {
    height: 1px;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent);
    margin: 0 24px 24px;
  }
  .mn-content {
    padding: 0 24px; display: flex; flex-direction: column;
    align-items: center; gap: 24px;
  }
  .mn-stage-lbl {
    font-size: 10px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(255,255,255,0.25);
    font-family: 'JetBrains Mono', monospace;
  }

  /* Circle & rings */
  .mn-circle-wrap {
    position: relative; width: 170px; height: 170px;
    display: flex; align-items: center; justify-content: center;
  }
  .mn-ring { position: absolute; border-radius: 50%; border: 1.5px solid; width: 170px; height: 170px; }
  @keyframes mn-rExp {
    from { transform: scale(0.65); opacity: 0.75; }
    to { transform: scale(1.6); opacity: 0; }
  }
  .mn-r1 { border-color: rgba(220,38,38,0.22); animation: mn-rExp 2.4s ease-out infinite; }
  .mn-r2 { border-color: rgba(220,38,38,0.13); animation: mn-rExp 2.4s ease-out infinite 0.6s; }
  .mn-r3 { border-color: rgba(220,38,38,0.07); animation: mn-rExp 2.4s ease-out infinite 1.2s; }
  .mn-rl1 { border-color: rgba(124,58,237,0.25); animation: mn-rExp 1.7s ease-out infinite; }
  .mn-rl2 { border-color: rgba(124,58,237,0.14); animation: mn-rExp 1.7s ease-out infinite 0.42s; }
  .mn-rl3 { border-color: rgba(124,58,237,0.07); animation: mn-rExp 1.7s ease-out infinite 0.85s; }
  .mn-rp1 { border-color: rgba(16,185,129,0.25); animation: mn-rExp 2s ease-out infinite; }
  .mn-rp2 { border-color: rgba(16,185,129,0.13); animation: mn-rExp 2s ease-out infinite 0.5s; }
  .mn-rc1 { border-color: rgba(245,158,11,0.22); animation: mn-rExp 1.4s ease-out infinite; }
  .mn-rc2 { border-color: rgba(245,158,11,0.12); animation: mn-rExp 1.4s ease-out infinite 0.35s; }

  .mn-hero-btn {
    position: relative; width: 114px; height: 114px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: none; outline: none; z-index: 2;
    transition: transform 0.15s ease;
  }
  .mn-hero-btn:hover { transform: scale(1.04); }
  .mn-hero-btn:active { transform: scale(0.97); }
  .mn-hero-btn:disabled { cursor: not-allowed; opacity: 0.5; }
  .mn-btn-idle {
    background: linear-gradient(145deg,#dc2626,#991b1b);
    box-shadow: 0 8px 30px rgba(220,38,38,0.55),0 2px 8px rgba(220,38,38,0.3),inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .mn-btn-connecting {
    background: linear-gradient(145deg,#f59e0b,#d97706);
    box-shadow: 0 8px 30px rgba(245,158,11,0.45),inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .mn-btn-listening {
    background: linear-gradient(145deg,#7c3aed,#6d28d9);
    box-shadow: 0 8px 30px rgba(124,58,237,0.55),inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .mn-btn-processing {
    background: linear-gradient(145deg,#059669,#047857);
    box-shadow: 0 8px 30px rgba(5,150,105,0.55),inset 0 1px 0 rgba(255,255,255,0.15);
  }

  .mn-bico { font-size: 38px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35)); }
  @keyframes mn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .mn-spin { animation: mn-spin 2s linear infinite; }
  @keyframes mn-mpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.13); } }
  .mn-mpulse { animation: mn-mpulse 1.1s ease-in-out infinite; }
  @keyframes mn-bglow {
    0%,100% { filter: drop-shadow(0 0 5px rgba(16,185,129,0.6)); }
    50% { filter: drop-shadow(0 0 14px rgba(16,185,129,1)); }
  }
  .mn-bglow { animation: mn-bglow 1.4s ease-in-out infinite; }

  /* Text info */
  .mn-txt-info { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .mn-main-st { font-size: 18px; font-weight: 600; color: #fff; letter-spacing: -0.3px; }
  .mn-sub-st { font-size: 12px; color: rgba(255,255,255,0.37); font-weight: 400; }

  /* Waves */
  .mn-waves { display: flex; align-items: center; gap: 3px; height: 26px; }
  .mn-wb { width: 3px; background: linear-gradient(to top,#7c3aed,#a78bfa); border-radius: 2px; animation: mn-wa 1s ease-in-out infinite; }
  .mn-wb:nth-child(1) { animation-delay:0s; height:7px; }
  .mn-wb:nth-child(2) { animation-delay:.1s; height:13px; }
  .mn-wb:nth-child(3) { animation-delay:.2s; height:21px; }
  .mn-wb:nth-child(4) { animation-delay:.3s; height:26px; }
  .mn-wb:nth-child(5) { animation-delay:.4s; height:21px; }
  .mn-wb:nth-child(6) { animation-delay:.3s; height:13px; }
  .mn-wb:nth-child(7) { animation-delay:.2s; height:7px; }
  @keyframes mn-wa { 0%,100% { transform:scaleY(0.5); opacity:0.6; } 50% { transform:scaleY(1); opacity:1; } }

  /* Call button */
  .mn-call-btn {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg,#dc2626,#b91c1c);
    border: none; border-radius: 16px;
    color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
    font-family: 'Sora', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 6px 20px rgba(220,38,38,0.4),inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .mn-call-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 28px rgba(220,38,38,0.5),inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .mn-call-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Info pill */
  .mn-info-pill {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 12px 14px; width: 100%;
  }
  .mn-pill-icon {
    width: 32px; height: 32px; border-radius: 9px;
    background: rgba(16,185,129,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .mn-pill-txt { font-size: 11px; color: rgba(255,255,255,0.38); line-height: 1.45; }
  .mn-pill-txt strong { color: rgba(255,255,255,0.65); font-weight: 500; display: block; font-size: 12px; margin-bottom: 2px; }

  /* Speak hint */
  .mn-speak-hint {
    display: flex; align-items: center; gap: 8px;
    background: rgba(124,58,237,0.08);
    border: 1px solid rgba(124,58,237,0.18);
    border-radius: 12px; padding: 10px 14px; width: 100%;
  }
  .mn-speak-hint span { font-size: 12px; color: rgba(167,139,250,0.85); }

  /* Severity */
  .mn-sev-card {
    width: 100%;
    background: rgba(220,38,38,0.07);
    border: 1px solid rgba(220,38,38,0.22);
    border-radius: 14px; padding: 13px 16px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .mn-sev-lbl { font-size: 11px; color: rgba(255,255,255,0.38); font-weight: 500; margin-bottom: 3px; }
  .mn-sev-val { font-size: 15px; font-weight: 700; color: #f87171; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }
  .mn-sev-ico { width: 28px; height: 28px; background: rgba(220,38,38,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; }

  /* Progress */
  .mn-prog-wrap { width: 100%; display: flex; flex-direction: column; gap: 7px; }
  .mn-prog-lbl { font-size: 10px; color: rgba(255,255,255,0.28); font-family: 'JetBrains Mono', monospace; }
  .mn-prog-bg { width: 100%; background: rgba(255,255,255,0.06); border-radius: 6px; height: 5px; overflow: hidden; }
  .mn-prog-fill {
    height: 100%;
    background: linear-gradient(90deg,#10b981,#34d399);
    border-radius: 6px;
    box-shadow: 0 0 6px rgba(16,185,129,0.4);
    animation: mn-pf 5s linear forwards;
  }
  @keyframes mn-pf { from { width: 0%; } to { width: 82%; } }
`;

type Stage = "idle" | "connecting" | "listening" | "processing";

function getRings(stage: Stage): string[] {
  if (stage === "idle") return ["mn-r1", "mn-r2", "mn-r3"];
  if (stage === "connecting") return ["mn-rc1", "mn-rc2"];
  if (stage === "listening") return ["mn-rl1", "mn-rl2", "mn-rl3"];
  return ["mn-rp1", "mn-rp2"];
}

function getIconAnim(stage: Stage): string {
  if (stage === "connecting") return "mn-spin";
  if (stage === "listening") return "mn-mpulse";
  if (stage === "processing") return "mn-bglow";
  return "";
}

function getBtnClass(stage: Stage): string {
  if (stage === "connecting") return "mn-hero-btn mn-btn-connecting";
  if (stage === "listening") return "mn-hero-btn mn-btn-listening";
  if (stage === "processing") return "mn-hero-btn mn-btn-processing";
  return "mn-hero-btn mn-btn-idle";
}

function getStageIcon(stage: Stage): string {
  if (stage === "idle") return "📞";
  if (stage === "connecting") return "⏳";
  if (stage === "listening") return "🎤";
  return "🧠";
}

function getStageLbl(stage: Stage): string {
  if (stage === "idle") return "Emergency Assistance";
  if (stage === "connecting") return "Establishing Connection";
  if (stage === "listening") return "AI Listening";
  return "AI Processing";
}

export default function CallingPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [status, setStatus] = useState("Initializing...");
  const [isReady, setIsReady] = useState(false);
  const deviceRef = useRef<Device | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const res = await fetch(TOKEN_URL);
        const { token } = await res.json();
        const device = new Device(token);
        deviceRef.current = device;
        device.on("registered", () => {
          setIsReady(true);
          setStatus("Ready to call");
        });
        device.on("connect", () => {
          setStage("listening");
          setStatus("Listening...");
        });
        device.on("disconnect", () => {
          setStage("idle");
          setStatus("Call ended");
        });
        device.on("error", (err) => {
          console.error(err);
          setStatus("Error: " + err.message);
        });
        await device.register();
      } catch (err: any) {
        setStatus(err.message);
      }
    }
    setup();
    return () => {
      deviceRef.current?.destroy();
    };
  }, []);

  const startCall = async () => {
    if (!deviceRef.current) return;
    setStage("connecting");
    setStatus("Connecting...");
    await deviceRef.current.connect();
    setTimeout(() => {
      setStage("processing");
    }, 5000);
  };

  const rings = getRings(stage);

  return (
    <>
      <style>{styles}</style>
      <div className="mn-root">
        <div className="mn-bg-glow" />
        <div className="mn-bg-grid" />

        {/* Navbar */}
        <nav className="mn-navbar">
          <div className="mn-nav-logo">
            <div className="mn-nav-mark">🚑</div>
            <span className="mn-nav-brand">Med<span>Nav</span></span>
          </div>
          <div className="mn-nav-links">
            <a href="/" className="mn-nav-link active">
              <span className="mn-nav-link-icon">🏠</span>
              Home
            </a>
            <a href="/dashboard" className="mn-nav-link">
              <span className="mn-nav-link-icon">📊</span>
              Dashboard
            </a>
          </div>
          <div className="mn-nav-menu">
            <div className="mn-menu-line" />
            <div className="mn-menu-line" />
            <div className="mn-menu-line" style={{ width: 9 }} />
          </div>
        </nav>

        {/* Main */}
        <main className="mn-main">
          <div className="mn-card">
            <div className="mn-card-header">
              <div>
                <div className="mn-card-title">Emergency Assistance</div>
                <div className="mn-card-sub">We're here to help</div>
              </div>
              <div className="mn-status-badge">
                <div className="mn-badge-dot" />
                {isReady ? "Online" : "Init..."}
              </div>
            </div>

            <div className="mn-divider" />

            <div className="mn-content">
              <div className="mn-stage-lbl">{getStageLbl(stage)}</div>

              <div className="mn-circle-wrap">
                {rings.map((cls, i) => (
                  <div key={i} className={`mn-ring ${cls}`} />
                ))}
                <button
                  className={getBtnClass(stage)}
                  onClick={stage === "idle" ? startCall : undefined}
                  disabled={stage === "idle" && !isReady}
                >
                  <span className={`mn-bico ${getIconAnim(stage)}`}>
                    {getStageIcon(stage)}
                  </span>
                </button>
              </div>

              <div className="mn-txt-info">
                <span className="mn-main-st">{status}</span>
                {stage === "listening" && (
                  <div className="mn-waves">
                    {[...Array(7)].map((_, i) => <div key={i} className="mn-wb" />)}
                  </div>
                )}
                {stage === "processing" && (
                  <span className="mn-sub-st">Analyzing your symptoms and situation...</span>
                )}
                {stage === "idle" && (
                  <span className="mn-sub-st">We're here to help</span>
                )}
                {stage === "connecting" && (
                  <span className="mn-sub-st">Please wait...</span>
                )}
              </div>

              {stage === "idle" && (
                <>
                  <button onClick={startCall} disabled={!isReady} className="mn-call-btn">
                    <span>📞</span>
                    Tap to Call for Help
                  </button>
                  <div className="mn-info-pill">
                    <div className="mn-pill-txt">
                      <strong className="text-center">Works Offline</strong>
                      This is a Prototype demo and We do have have enough credits to do calling on Unknown numbers, but it is fully functional for Verified Number. For testing, We use this Web browser's microphone and speakers to simulate the call experience.
                    </div>
                  </div>
                </>
              )}

              {stage === "listening" && (
                <div className="mn-speak-hint">
                  <span style={{ fontSize: 16 }}>🔊</span>
                  <span>Speak clearly for better assistance</span>
                </div>
              )}

              {stage === "processing" && (
                <>
                  {/* <div className="mn-sev-card">
                    <div>
                      <div className="mn-sev-lbl">Detected Severity</div>
                      <div className="mn-sev-val">HIGH</div>
                    </div>
                    <div className="mn-sev-ico">⚠️</div>
                  </div> */}
                  <div className="mn-prog-wrap">
                    <span className="mn-prog-lbl">Preparing response...</span>
                    <div className="mn-prog-bg">
                      <div className="mn-prog-fill" key={stage} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}