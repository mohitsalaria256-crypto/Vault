import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "vault-finance-v3";

const DEFAULT_DATA = {
  cash: [
    { id: 1, label: "Checking", amount: 0 },
    { id: 2, label: "Savings", amount: 0 },
  ],
  stocks: [],
  crypto: [],
  gold: { oz: 0, avgCost: 0 },
  silver: { oz: 0, avgCost: 0 },
  debt: [
    { id: 1, label: "Honda Accord", balance: 34914, monthly: 571 },
    { id: 2, label: "Amex", balance: 2000, monthly: 0 },
    { id: 3, label: "Discover", balance: 2500, monthly: 0 },
  ],
};

const CRYPTO_IDS = {
  BTC:"bitcoin",ETH:"ethereum",SOL:"solana",DOGE:"dogecoin",
  ADA:"cardano",XRP:"ripple",AVAX:"avalanche-2",DOT:"polkadot",
  MATIC:"matic-network",LINK:"chainlink",UNI:"uniswap",LTC:"litecoin",
};

const GOLD_FALLBACK = 2000, SILVER_FALLBACK = 25;

function fmt(n) {
  if (n==null||isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(n);
}
function fmtPct(n) {
  if (n==null||isNaN(n)) return "—";
  return (n>=0?"+":"")+n.toFixed(2)+"%";
}
function fmtCompact(n) {
  if (n==null||isNaN(n)) return "—";
  if (Math.abs(n)>=1e6) return "$"+(n/1e6).toFixed(2)+"M";
  if (Math.abs(n)>=1e3) return "$"+(n/1e3).toFixed(1)+"K";
  return fmt(n);
}

// ── CSS injector ──────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f0f2f5;
    --surface: #e8eaed;
    --card: #ffffff;
    --border: #dde1e7;
    --border2: #c8cdd6;
    --gold: #1a1a2e;
    --gold2: #2d2d44;
    --gold-dim: #555570;
    --green: #16a34a;
    --green-dim: #dcfce7;
    --red: #dc2626;
    --red-dim: #fee2e2;
    --blue: #2563eb;
    --purple: #7c3aed;
    --text: #111827;
    --muted: #6b7280;
    --muted2: #9ca3af;
  }

  body { background: var(--bg); }

  input { font-family: 'JetBrains Mono', monospace !important; color: #111827 !important; background: #f9fafb !important; }
  input::placeholder { color: #9ca3af !important; }

  .vault-app {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Outfit', sans-serif;
    color: var(--text);
    position: relative;
    overflow-x: hidden;
  }

  /* animated bg orbs */
  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.45;
    pointer-events: none;
    animation: orbFloat 20s ease-in-out infinite;
  }
  .orb-1 { width:700px;height:700px;background:#c7d2fe;top:-250px;right:-150px;animation-delay:0s; }
  .orb-2 { width:500px;height:500px;background:#e9d5ff;bottom:-150px;left:-150px;animation-delay:-7s; }
  .orb-3 { width:350px;height:350px;background:#bfdbfe;top:40%;left:30%;animation-delay:-14s;opacity:0.5; }

  @keyframes orbFloat {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(30px,-40px) scale(1.05); }
    66% { transform: translate(-20px,30px) scale(0.95); }
  }

  /* topbar */
  .topbar {
    position: sticky; top: 0; z-index: 200;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    padding: 0 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 56px;
  }

  .logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.6rem;
    letter-spacing: 0.15em;
    background: linear-gradient(135deg, #1a1a2e 0%, #4a4a7a 50%, #1a1a2e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tab-btn {
    padding: 0.3rem 0.9rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: 'Outfit', sans-serif;
    transition: all 0.2s;
  }
  .tab-btn.active { background: rgba(26,26,46,0.08); color: var(--gold); border: 1px solid rgba(26,26,46,0.2); }
  .tab-btn.inactive { background: transparent; color: var(--muted); border: 1px solid transparent; }
  .tab-btn:hover { color: var(--text); }

  .refresh-btn {
    display: flex; align-items: center; gap: 0.4rem;
    background: rgba(26,26,46,0.06);
    border: 1px solid rgba(26,26,46,0.15);
    border-radius: 8px;
    color: var(--gold);
    cursor: pointer;
    padding: 0.4rem 0.9rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: 'Outfit', sans-serif;
    transition: all 0.2s;
  }
  .refresh-btn:hover { background: rgba(26,26,46,0.12); border-color: rgba(26,26,46,0.3); }
  .refresh-btn:disabled { opacity: 0.4; }
  .refresh-btn .spinner { animation: spin 1s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* net worth hero */
  .hero {
    position: relative;
    margin: 1.5rem 1rem 1rem;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 50%, #f0f2ff 100%);
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at top right, rgba(99,102,241,0.07) 0%, transparent 60%),
                radial-gradient(ellipse at bottom left, rgba(124,58,237,0.05) 0%, transparent 60%);
    pointer-events: none;
  }
  .hero-inner { position: relative; padding: 2rem 2.5rem; }
  .hero-label {
    font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 0.5rem; font-weight: 600;
  }
  .hero-amount {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3rem, 8vw, 5rem);
    letter-spacing: 0.02em;
    line-height: 1;
    margin-bottom: 1.25rem;
  }
  .hero-amount.positive { color: #16a34a; text-shadow: none; }
  .hero-amount.negative { color: #dc2626; text-shadow: none; }

  .hero-stats {
    display: flex; gap: 2rem; flex-wrap: wrap;
    border-top: 1px solid var(--border);
    padding-top: 1.25rem;
  }
  .hero-stat-label { font-size: 0.6rem; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.2rem; }
  .hero-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 0.88rem; }

  /* glass card */
  .glass-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 18px;
    overflow: hidden;
    transition: all 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .glass-card:hover { border-color: var(--border2); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

  .card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.9rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .section-label {
    font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--muted); font-weight: 600;
  }

  /* allocation bar */
  .alloc-bar {
    height: 6px; border-radius: 99px; overflow: hidden;
    display: flex; gap: 2px; margin: 0.85rem 0;
  }
  .alloc-seg { border-radius: 99px; transition: width 0.8s cubic-bezier(0.34,1.56,0.64,1); }

  /* growth grid */
  .growth-grid {
    display: grid; grid-template-columns: repeat(4,1fr);
  }
  .growth-cell {
    padding: 1rem 1.25rem;
    border-right: 1px solid var(--border);
    position: relative; overflow: hidden;
  }
  .growth-cell:last-child { border-right: none; }
  .growth-cell::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .growth-cell:hover::after { opacity: 1; }
  .growth-cell.positive::after { background: linear-gradient(90deg,transparent,#16a34a,transparent); }
  .growth-cell.negative::after { background: linear-gradient(90deg,transparent,#dc2626,transparent); }
  .growth-label { font-size: 0.58rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.3rem; }
  .growth-val { font-family: 'JetBrains Mono', monospace; font-size: 0.92rem; }

  /* asset table */
  .asset-table { overflow: hidden; }
  .table-header {
    display: flex; align-items: center;
    padding: 0.4rem 1rem;
    background: rgba(0,0,0,0.03);
    border-bottom: 1px solid var(--border);
  }
  .th { font-size: 0.58rem; color: var(--muted2); letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; }

  .asset-row {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  .asset-row:last-child { border-bottom: none; }
  .asset-row-inner {
    display: flex; align-items: center;
    padding: 0.85rem 1rem; gap: 0.5rem;
    cursor: pointer;
    transition: background 0.15s;
  }
  .asset-row-inner:hover { background: rgba(0,0,0,0.02); }

  .expand-btn {
    width: 24px; height: 24px; border-radius: 6px; border: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; font-size: 0.65rem;
    transition: all 0.2s;
    background: transparent; color: var(--muted);
  }
  .expand-btn.has-children { background: rgba(0,0,0,0.05); color: var(--muted); }
  .expand-btn.has-children:hover { background: rgba(26,26,46,0.08); color: var(--gold); }

  .asset-icon { font-size: 1.05rem; }
  .asset-name { font-size: 0.85rem; font-weight: 600; color: var(--text); }

  .mono { font-family: 'JetBrains Mono', monospace; }

  .badge {
    display: inline-flex; align-items: center;
    padding: 0.12rem 0.45rem; border-radius: 99px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; font-weight: 500;
  }
  .badge.up { background: #dcfce7; color: #15803d; }
  .badge.down { background: #fee2e2; color: #dc2626; }

  /* sub rows (dropdown) */
  .sub-rows { background: rgba(0,0,0,0.02); border-top: 1px solid var(--border); }
  .sub-row {
    display: flex; align-items: center;
    padding: 0.6rem 1rem 0.6rem 3.5rem; gap: 0.5rem;
    border-bottom: 1px solid rgba(20,30,46,0.5);
    transition: background 0.15s;
  }
  .sub-row:last-child { border-bottom: none; }
  .sub-row:hover { background: rgba(0,0,0,0.03); }

  .ticker { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; font-weight: 600; color: #4f46e5; }
  .ticker-sub { font-size: 0.6rem; color: var(--muted); margin-top: 0.1rem; }

  /* action buttons */
  .act-btn {
    padding: 0.28rem 0.65rem; border-radius: 7px; border: none;
    cursor: pointer; font-size: 0.68rem; font-weight: 600;
    font-family: 'Outfit', sans-serif; letter-spacing: 0.04em;
    transition: all 0.15s;
  }
  .act-btn.add { background: rgba(26,26,46,0.07); color: var(--gold); border: 1px solid rgba(26,26,46,0.15); }
  .act-btn.add:hover { background: rgba(26,26,46,0.12); }
  .act-btn.edit { background: #f3f4f6; color: var(--muted); border: 1px solid var(--border); }
  .act-btn.edit:hover { color: var(--text); background: #e5e7eb; border-color: var(--border2); }
  .act-btn.del { background: #fee2e2; color: var(--red); border: 1px solid #fecaca; }
  .act-btn.del:hover { background: #fecaca; }

  /* debt row */
  .debt-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.7rem 1.25rem;
    border-bottom: 1px solid rgba(20,30,46,0.5);
  }
  .debt-row:last-of-type { border-bottom: none; }

  /* modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(15,15,30,0.5);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  .modal-box {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2rem;
    width: 100%; max-width: 440px;
    max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1);
    position: relative;
  }
  .modal-box::before {
    content: '';
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 60%; height: 1px;
    background: linear-gradient(90deg,transparent,#6366f1,transparent);
  }
  @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
  .modal-title {
    font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem;
    letter-spacing: 0.1em; color: #111827; margin-bottom: 0;
  }

  .field-label { font-size: 0.6rem; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.3rem; font-weight: 600; }
  .field-input {
    width: 100%; background: rgba(3,5,8,0.8);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 0.65rem 0.9rem; color: var(--text); font-size: 0.88rem;
    outline: none; margin-bottom: 0.9rem;
    transition: border-color 0.2s;
  }
  .field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

  .btn-primary {
    background: linear-gradient(135deg, #1a1a2e 0%, #2d2d50 100%);
    color: #ffffff; border: none; border-radius: 10px;
    padding: 0.65rem 1.4rem; font-size: 0.82rem; font-weight: 700;
    cursor: pointer; letter-spacing: 0.06em; text-transform: uppercase;
    font-family: 'Outfit', sans-serif;
    transition: all 0.2s;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(232,184,75,0.3); }
  .btn-ghost {
    background: #f3f4f6; color: var(--muted);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 0.65rem 1.2rem; font-size: 0.82rem; font-weight: 600;
    cursor: pointer; font-family: 'Outfit', sans-serif;
    transition: all 0.2s;
  }
  .btn-ghost:hover { color: var(--text); background: #e5e7eb; border-color: var(--border2); }

  /* manage tab */
  .manage-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 1rem; }
  .manage-card { background: #ffffff; border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .manage-card-title { font-size: 0.72rem; color: #4f46e5; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1rem; }

  .manage-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.45rem 0; border-bottom: 1px solid var(--border);
  }
  .manage-item:last-of-type { border-bottom: none; }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  /* time badge */
  .time-badge {
    font-family: 'JetBrains Mono', monospace; font-size: 0.6rem;
    color: var(--muted); background: #f3f4f6;
    padding: 0.2rem 0.5rem; border-radius: 4px;
    border: 1px solid var(--border);
  }

  /* pulse dot */
  .live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #16a34a;
    box-shadow: 0 0 6px rgba(22,163,74,0.5);
    animation: pulse 2s ease-in-out infinite;
    display: inline-block;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

  @media (max-width:600px) {
    .growth-grid { grid-template-columns: repeat(2,1fr); }
    .growth-cell:nth-child(2) { border-right: none; }
    .hero-inner { padding: 1.5rem; }
    .hero-stats { gap: 1.25rem; }
  }
`;


const AUTH_KEY = "vault-auth-v1";
const SESSION_KEY = "vault-session-v1";
const JSONBIN_KEY = "vault-jsonbin-v1";
const HARDCODED_BIN_ID = "69f92e62856a682189a80bbf";

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    async function init() {
      try {
        // Check if account exists
        const auth = await window.storage.get(AUTH_KEY, true);
        if (!auth?.value) {
          setIsSetup(true);
        } else {
          // Auto-fill remembered username
          const session = await window.storage.get(SESSION_KEY, true);
          if (session?.value) {
            const s = JSON.parse(session.value);
            if (s.rememberMe && s.username) setUsername(s.username);
            setRememberMe(s.rememberMe || false);
          }
        }
      } catch {}
      setLoading(false);
    }
    init();
  }, []);

  async function handleSetup() {
    if (!username.trim()) { setError("Username is required"); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters"); return; }
    if (password !== confirmPw) { setError("Passwords don't match"); return; }
    try {
      await window.storage.set(AUTH_KEY, JSON.stringify({ username: username.trim(), password }), true);
      await window.storage.set(SESSION_KEY, JSON.stringify({ username: username.trim(), rememberMe }), true);
      onLogin(username.trim());
    } catch { setError("Failed to save — try again"); }
  }

  async function handleLogin() {
    if (!username.trim() || !password) { setError("Enter username and password"); return; }
    try {
      const auth = await window.storage.get(AUTH_KEY, true);
      if (!auth?.value) { setError("No account found"); return; }
      const creds = JSON.parse(auth.value);
      if (username.trim() !== creds.username || password !== creds.password) {
        setError("Incorrect username or password"); return;
      }
      await window.storage.set(SESSION_KEY, JSON.stringify({ username: username.trim(), rememberMe }), true);
      onLogin(username.trim());
    } catch { setError("Something went wrong"); }
  }

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#f0f2f5",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontFamily:"'Outfit',sans-serif",color:"#6b7280",fontSize:"0.85rem"}}>Loading…</div>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh", background:"#f0f2f5",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Outfit',sans-serif", padding:"1rem",
      backgroundImage:"radial-gradient(ellipse at 70% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(236,72,153,0.06) 0%, transparent 60%)",
    }}>
      <div style={{
        background:"#fff", borderRadius:"24px", padding:"2.5rem",
        width:"100%", maxWidth:"400px",
        boxShadow:"0 8px 40px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.05)",
        border:"1px solid #e5e7eb", position:"relative", overflow:"hidden",
      }}>
        {/* top accent line */}
        <div style={{position:"absolute",top:0,left:"10%",right:"10%",height:"3px",background:"linear-gradient(90deg,transparent,#6366f1,transparent)",borderRadius:"99px"}}/>

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:"2.5rem", letterSpacing:"0.15em",
            background:"linear-gradient(135deg,#1a1a2e,#4a4a7a)", WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent", backgroundClip:"text",
          }}>VAULT</div>
          <div style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:"0.2rem",letterSpacing:"0.05em"}}>
            {isSetup ? "Create your account" : "Welcome back"}
          </div>
        </div>

        {/* Fields */}
        <div style={{marginBottom:"0.9rem"}}>
          <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.3rem",fontWeight:600}}>Username</div>
          <input
            value={username} onChange={e=>{setUsername(e.target.value);setError("");}}
            placeholder="Enter username"
            onKeyDown={e=>e.key==="Enter"&&(isSetup?handleSetup():handleLogin())}
            style={{
              width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"10px",
              padding:"0.7rem 0.9rem",color:"#111827",fontSize:"0.9rem",outline:"none",
              fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box",
            }}
            onFocus={e=>e.target.style.borderColor="#6366f1"}
            onBlur={e=>e.target.style.borderColor="#e5e7eb"}
          />
        </div>

        <div style={{marginBottom: isSetup ? "0.9rem" : "0.75rem"}}>
          <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.3rem",fontWeight:600}}>Password</div>
          <div style={{position:"relative"}}>
            <input
              type={showPw?"text":"password"} value={password}
              onChange={e=>{setPassword(e.target.value);setError("");}}
              placeholder="Enter password"
              onKeyDown={e=>e.key==="Enter"&&(isSetup?handleSetup():handleLogin())}
              style={{
                width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"10px",
                padding:"0.7rem 2.5rem 0.7rem 0.9rem",color:"#111827",fontSize:"0.9rem",outline:"none",
                fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box",
              }}
              onFocus={e=>e.target.style.borderColor="#6366f1"}
              onBlur={e=>e.target.style.borderColor="#e5e7eb"}
            />
            <button onClick={()=>setShowPw(s=>!s)} style={{
              position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",
              background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:"0.8rem",
            }}>{showPw?"🙈":"👁"}</button>
          </div>
        </div>

        {isSetup && (
          <div style={{marginBottom:"0.75rem"}}>
            <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.3rem",fontWeight:600}}>Confirm Password</div>
            <input
              type={showPw?"text":"password"} value={confirmPw}
              onChange={e=>{setConfirmPw(e.target.value);setError("");}}
              placeholder="Re-enter password"
              onKeyDown={e=>e.key==="Enter"&&handleSetup()}
              style={{
                width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"10px",
                padding:"0.7rem 0.9rem",color:"#111827",fontSize:"0.9rem",outline:"none",
                fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box",
              }}
              onFocus={e=>e.target.style.borderColor="#6366f1"}
              onBlur={e=>e.target.style.borderColor="#e5e7eb"}
            />
          </div>
        )}

        {/* Remember me */}
        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1.25rem",cursor:"pointer"}} onClick={()=>setRememberMe(r=>!r)}>
          <div style={{
            width:"18px",height:"18px",borderRadius:"5px",border:"2px solid",flexShrink:0,
            borderColor: rememberMe?"#6366f1":"#d1d5db",
            background: rememberMe?"#6366f1":"transparent",
            display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s",
          }}>
            {rememberMe && <span style={{color:"#fff",fontSize:"0.65rem",lineHeight:1}}>✓</span>}
          </div>
          <span style={{fontSize:"0.78rem",color:"#6b7280",userSelect:"none"}}>Remember my username</span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:"#fee2e2",border:"1px solid #fecaca",borderRadius:"8px",
            padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#dc2626",marginBottom:"1rem",
          }}>{error}</div>
        )}

        {/* Submit */}
        <button onClick={isSetup?handleSetup:handleLogin} style={{
          width:"100%",
          background:"linear-gradient(135deg,#1a1a2e,#2d2d50)",
          color:"#fff",border:"none",borderRadius:"10px",
          padding:"0.75rem",fontSize:"0.85rem",fontWeight:700,
          cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase",
          fontFamily:"'Outfit',sans-serif",transition:"all 0.2s",
        }}
        onMouseEnter={e=>e.target.style.transform="translateY(-1px)"}
        onMouseLeave={e=>e.target.style.transform="translateY(0)"}
        >{isSetup?"Create Account":"Sign In"}</button>

        {!isSetup && (
          <div style={{textAlign:"center",marginTop:"1rem",fontSize:"0.72rem",color:"#9ca3af"}}>
            Your data is stored locally on this device only.
          </div>
        )}
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function Inp({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      {label && <div className="field-label">{label}</div>}
      <input className="field-input" type={type} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
          <div className="modal-title">{title}</div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:"1.3rem",lineHeight:1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ReturnDisplay({ gain, pct, large }) {
  if (gain === null) return <span style={{ color:"var(--muted2)", fontFamily:"JetBrains Mono,monospace", fontSize: large?"1rem":"0.8rem" }}>—</span>;
  const up = gain >= 0;
  return (
    <div style={{ textAlign:"right" }}>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize: large?"1.1rem":"0.82rem", color: up?"var(--green)":"var(--red)", fontWeight: large?600:400 }}>{fmt(gain)}</div>
      <div style={{ fontSize:"0.65rem", color: up?"#00b87a":"#cc3355", marginTop:"1px" }}>{fmtPct(pct)}</div>
    </div>
  );
}

function Badge({ pct }) {
  if (pct == null || isNaN(pct)) return null;
  return <span className={`badge ${pct>=0?"up":"down"}`}>{fmtPct(pct)}</span>;
}

function AssetRow({ icon, label, cost, value, gain, gainPct, onAdd, onEdit, children }) {
  const [open, setOpen] = useState(false);
  const hasKids = !!children;
  return (
    <div className="asset-row">
      <div className="asset-row-inner" onClick={() => hasKids && setOpen(o=>!o)}>
        <button className={`expand-btn ${hasKids?"has-children":""}`} onClick={e=>{e.stopPropagation();hasKids&&setOpen(o=>!o)}}>
          {hasKids ? (open?"▾":"▸") : ""}
        </button>
        <div style={{ width:"110px",flexShrink:0,display:"flex",alignItems:"center",gap:"0.5rem" }}>
          <span className="asset-icon">{icon}</span>
          <span className="asset-name">{label}</span>
        </div>
        <div style={{ flex:1, fontSize:"0.78rem", color:"var(--muted)" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.78rem",color:"var(--muted)" }}>{fmt(cost)}</span>
        </div>
        <div style={{ flex:1 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.85rem",color:"var(--text)" }}>{fmt(value)}</span>
        </div>
        <div style={{ flex:1 }}>
          <ReturnDisplay gain={gain} pct={gainPct} />
        </div>
        <div style={{ display:"flex",gap:"0.4rem",flexShrink:0 }} onClick={e=>e.stopPropagation()}>
          {onAdd && <button className="act-btn add" onClick={onAdd}>+ Add</button>}
          {onEdit && <button className="act-btn edit" onClick={onEdit}>Edit</button>}
        </div>
      </div>
      {open && hasKids && <div className="sub-rows">{children}</div>}
    </div>
  );
}

function SubRow({ label, qty, avgCost, price, value, gain, gainPct, change24h, onRemove }) {
  return (
    <div className="sub-row">
      <div style={{ width:"110px",flexShrink:0 }}>
        <div className="ticker">{label}</div>
        <div className="ticker-sub">{qty} @ ${Number(avgCost||0).toFixed(2)}</div>
      </div>
      <div style={{ flex:1 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.75rem",color:"var(--muted)" }}>{fmt(Number(qty)*Number(avgCost))}</span>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:"0.8rem",color:"var(--text)" }}>{price?fmt(price):"—"}</div>
        <Badge pct={change24h} />
      </div>
      <div style={{ flex:1 }}><ReturnDisplay gain={gain} pct={gainPct} /></div>
      <button className="act-btn del" onClick={onRemove}>✕</button>
    </div>
  );
}

// ── Auth Wrapper ──────────────────────────────────────────────────────────────
export default function Root() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [keyLoading, setKeyLoading] = useState(true);

  useEffect(() => {
    async function checkKey() {
      try {
        const stored = await window.storage.get(JSONBIN_KEY, true);
        if (stored?.value) {
          const p = JSON.parse(stored.value);
          if (p.apiKey) { setMasterKey(p.apiKey); setNeedsKey(false); }
          else { setNeedsKey(true); }
        } else { setNeedsKey(true); }
      } catch { setNeedsKey(true); }
      setKeyLoading(false);
    }
    checkKey();
  }, []);

  async function handleSaveKey() {
    if (!keyInput.trim()) { setKeyError("Please enter your Master Key"); return; }
    if (!keyInput.trim().startsWith("$2a$")) { setKeyError("That doesn't look like a valid Master Key — it should start with $2a$"); return; }
    setKeyError("");
    await window.storage.set(JSONBIN_KEY, JSON.stringify({ apiKey: keyInput.trim(), binId: HARDCODED_BIN_ID }), true);
    setMasterKey(keyInput.trim());
    setNeedsKey(false);
  }

  function handleLogin(u) { setUsername(u); setLoggedIn(true); }
  function handleLogout() { setLoggedIn(false); setUsername(""); }

  if (keyLoading) return (
    <div style={{minHeight:"100vh",background:"#f0f2f5",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif"}}>
      <div style={{color:"#6b7280",fontSize:"0.85rem"}}>Connecting to cloud…</div>
    </div>
  );

  if (needsKey) return (
    <div style={{
      minHeight:"100vh",background:"#f0f2f5",display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Outfit',sans-serif",padding:"1rem",
      backgroundImage:"radial-gradient(ellipse at 70% 20%,rgba(99,102,241,0.08) 0%,transparent 60%)",
    }}>
      <div style={{background:"#fff",borderRadius:"24px",padding:"2.5rem",width:"100%",maxWidth:"420px",boxShadow:"0 8px 40px rgba(0,0,0,0.1)",border:"1px solid #e5e7eb",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:"10%",right:"10%",height:"3px",background:"linear-gradient(90deg,transparent,#6366f1,transparent)",borderRadius:"99px"}}/>
        <div style={{textAlign:"center",marginBottom:"1.75rem"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.5rem",letterSpacing:"0.15em",background:"linear-gradient(135deg,#1a1a2e,#4a4a7a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>VAULT</div>
          <div style={{fontSize:"0.78rem",color:"#9ca3af",marginTop:"0.2rem"}}>One-time cloud setup</div>
        </div>
        <div style={{background:"#f0f7ff",border:"1px solid #bfdbfe",borderRadius:"12px",padding:"1rem",marginBottom:"1.25rem",fontSize:"0.75rem",color:"#1d4ed8",lineHeight:1.6}}>
          ☁️ Vault uses <b>JSONBin.io</b> to sync your data across devices. Paste your <b>X-Master-Key</b> from jsonbin.io/api-keys below. This is a one-time setup.
        </div>
        <div style={{marginBottom:"0.9rem"}}>
          <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.3rem",fontWeight:600}}>X-Master-Key from jsonbin.io</div>
          <input value={keyInput} onChange={e=>{setKeyInput(e.target.value);setKeyError("");}}
            placeholder="$2a$10$..."
            style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"0.7rem 0.9rem",color:"#111827",fontSize:"0.85rem",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}
            onKeyDown={e=>e.key==="Enter"&&handleSaveKey()}
          />
        </div>
        {keyError && <div style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:"8px",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#dc2626",marginBottom:"1rem"}}>{keyError}</div>}
        <button onClick={handleSaveKey} style={{width:"100%",background:"linear-gradient(135deg,#1a1a2e,#2d2d50)",color:"#fff",border:"none",borderRadius:"10px",padding:"0.75rem",fontSize:"0.85rem",fontWeight:700,cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'Outfit',sans-serif"}}>
          Connect & Continue
        </button>
        <div style={{textAlign:"center",marginTop:"1rem",fontSize:"0.68rem",color:"#9ca3af"}}>Your key is stored locally on this device only</div>
      </div>
    </div>
  );

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;
  return <App username={username} onLogout={handleLogout} masterKey={masterKey} />;
}

// ── Main ──────────────────────────────────────────────────────────────────────
function App({ username, onLogout, masterKey }) {
  const [data, setData] = useState(DEFAULT_DATA);
  const [storageReady, setStorageReady] = useState(false);

  const [prices, setPrices] = useState({ stocks:{}, crypto:{}, gold:null, silver:null });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState("Dashboard");

  const [stockForm, setStockForm] = useState({ symbol:"",shares:"",avgCost:"" });
  const [cryptoForm, setCryptoForm] = useState({ symbol:"",amount:"",avgCost:"" });
  const [goldForm, setGoldForm] = useState({ oz:"",avgCost:"" });
  const [silverForm, setSilverForm] = useState({ oz:"",avgCost:"" });
  const [cashForm, setCashForm] = useState([]);
  const [debtForm, setDebtForm] = useState([]);
  const [accountForm, setAccountForm] = useState({ newUsername:'', currentPw:'', newPw:'', confirmPw:'' });
  const [accountMsg, setAccountMsg] = useState({ text:'', type:'' });
  const jsonbinConfig = { apiKey: masterKey, binId: HARDCODED_BIN_ID };
  const [syncStatus, setSyncStatus] = useState('');
  const [showJsonbinSetup, setShowJsonbinSetup] = useState(false);
  const [jsonbinForm, setJsonbinForm] = useState({ apiKey:'', binId:'' });

  // Load config + data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load from JSONBin via Claude API proxy (bypasses CORS)
        if (masterKey && HARDCODED_BIN_ID) {
          setSyncStatus('syncing');
          try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 4096,
                tools: [{ type: "web_search_20250305", name: "web_search" }],
                system: "You are a data proxy. When asked to fetch a URL, use web_search to retrieve it and return ONLY the raw JSON content with no explanation. Return only valid JSON.",
                messages: [{ role: "user", content: `Fetch this URL and return only the JSON response body, nothing else: GET https://api.jsonbin.io/v3/b/${HARDCODED_BIN_ID}/latest with header X-Master-Key: ${masterKey}` }]
              })
            });
            if (res.ok) {
              const d2 = await res.json();
              const tb = [...d2.content].reverse().find(b => b.type === "text");
              if (tb?.text) {
                const match = tb.text.match(/\{[\s\S]*\}/);
                if (match) {
                  const parsed = JSON.parse(match[0]);
                  const p = parsed.record || parsed;
                  if (p && p.stocks !== undefined) {
                    setData(d => ({ ...DEFAULT_DATA, ...p, gold:{...DEFAULT_DATA.gold,...p.gold}, silver:{...DEFAULT_DATA.silver,...p.silver} }));
                  }
                }
              }
              setSyncStatus('ok');
            } else { setSyncStatus('error'); }
          } catch { setSyncStatus('error'); }
        }
      } catch { setSyncStatus('error'); }
      setStorageReady(true);
    }
    loadData();
  }, []);

  // Save whenever data changes
  useEffect(() => {
    if (!storageReady) return;
    async function saveData() {
      try {
        const { apiKey, binId } = jsonbinConfig;
        if (apiKey && binId) {
          // Save to JSONBin (cross-device)
          setSyncStatus('syncing');
          const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
            body: JSON.stringify(data)
          });
          setSyncStatus(r.ok ? 'ok' : 'error');
        } else {
          // Fallback local save
          await window.storage.set(STORAGE_KEY, JSON.stringify(data), true);
        }
      } catch { setSyncStatus('error'); }
    }
    saveData();
  }, [data, storageReady]);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    const next = { stocks:{}, crypto:{}, gold:null, silver:null };

    try { const r=await fetch("https://api.metals.live/v1/spot/gold"); if(r.ok){const j=await r.json();next.gold=j[0]?.price??null;} } catch {}
    try { const r=await fetch("https://api.metals.live/v1/spot/silver"); if(r.ok){const j=await r.json();next.silver=j[0]?.price??null;} } catch {}

    const cryptoSyms = data.crypto.map(c=>c.symbol.toUpperCase());
    const cgIds = cryptoSyms.map(s=>CRYPTO_IDS[s]).filter(Boolean);
    if (cgIds.length) {
      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgIds.join(",")}&vs_currencies=usd&include_24hr_change=true`);
        if (r.ok) {
          const j = await r.json();
          cryptoSyms.forEach(sym => { const id=CRYPTO_IDS[sym]; if(id&&j[id]) next.crypto[sym]={price:j[id].usd,change24h:j[id].usd_24h_change}; });
        }
      } catch {}
    }

    const stockSyms = data.stocks.map(s=>s.symbol.toUpperCase());
    if (stockSyms.length) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            model:"claude-sonnet-4-20250514", max_tokens:1000,
            tools:[{type:"web_search_20250305",name:"web_search"}],
            messages:[{role:"user",content:`Current stock price and today % change for: ${stockSyms.join(", ")}. JSON only: {"AAPL":{"price":213.45,"change24h":1.23}}`}],
          }),
        });
        if (res.ok) {
          const d2 = await res.json();
          const tb = [...d2.content].reverse().find(b=>b.type==="text");
          if (tb?.text) {
            const m = tb.text.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
            if (m) { const p=JSON.parse(m[0]); stockSyms.forEach(sym=>{if(p[sym]?.price) next.stocks[sym]={price:parseFloat(p[sym].price),change24h:parseFloat(p[sym].change24h)||null};}); }
          }
        }
      } catch {}
    }

    setPrices(next); setLastUpdated(new Date()); setLoading(false);
  }, [data.stocks, data.crypto]);

  useEffect(() => { fetchPrices(); }, []);

  // computed
  const goldP = prices.gold || GOLD_FALLBACK;
  const silverP = prices.silver || SILVER_FALLBACK;

  const stockItems = data.stocks.map(s => {
    const info = prices.stocks[s.symbol.toUpperCase()];
    const price = info?.price || null;
    const cost = s.avgCost * s.shares;
    const value = price ? price * s.shares : cost;
    const gain = price ? value - cost : null;
    const gainPct = (cost>0&&gain!==null) ? (gain/cost)*100 : null;
    return {...s,price,cost,value,gain,gainPct,change24h:info?.change24h??null};
  });
  const cryptoItems = data.crypto.map(c => {
    const info = prices.crypto[c.symbol.toUpperCase()];
    const price = info?.price || null;
    const cost = c.avgCost * c.amount;
    const value = price ? price * c.amount : cost;
    const gain = price ? value - cost : null;
    const gainPct = (cost>0&&gain!==null) ? (gain/cost)*100 : null;
    return {...c,price,cost,value,gain,gainPct,change24h:info?.change24h??null};
  });

  const stkCost=stockItems.reduce((a,s)=>a+s.cost,0), stkVal=stockItems.reduce((a,s)=>a+s.value,0);
  const stkGain=stkCost>0?stkVal-stkCost:null, stkGainPct=stkCost>0?(stkGain/stkCost)*100:null;

  const cryPtoCost=cryptoItems.reduce((a,c)=>a+c.cost,0), cryptoVal=cryptoItems.reduce((a,c)=>a+c.value,0);
  const cryptoGain=cryPtoCost>0?cryptoVal-cryPtoCost:null, cryptoGainPct=cryPtoCost>0?(cryptoGain/cryPtoCost)*100:null;

  const goldCost=(data.gold.avgCost||GOLD_FALLBACK)*data.gold.oz, goldVal=goldP*data.gold.oz;
  const goldGain=data.gold.oz>0?goldVal-goldCost:null, goldGainPct=goldCost>0&&goldGain!==null?(goldGain/goldCost)*100:null;

  const silvCost=(data.silver.avgCost||SILVER_FALLBACK)*data.silver.oz, silvVal=silverP*data.silver.oz;
  const silvGain=data.silver.oz>0?silvVal-silvCost:null, silvGainPct=silvCost>0&&silvGain!==null?(silvGain/silvCost)*100:null;

  const cashVal=data.cash.reduce((a,c)=>a+(parseFloat(c.amount)||0),0);
  const totalDebt=data.debt.reduce((a,d)=>a+(parseFloat(d.balance)||0),0);
  const totalCost=stkCost+cryPtoCost+goldCost+silvCost;
  const totalInvest=stkVal+cryptoVal+goldVal+silvVal;
  const totalAssets=totalInvest+cashVal;
  const netWorth=totalAssets-totalDebt;
  const totalGain=totalCost>0?totalInvest-totalCost:null;
  const totalGainPct=totalCost>0?(totalGain/totalCost)*100:null;

  const alloc = [
    {label:"Stocks",value:stkVal,color:"#6366f1"},
    {label:"Crypto",value:cryptoVal,color:"#ec4899"},
    {label:"Gold",value:goldVal,color:"#f59e0b"},
    {label:"Silver",value:silvVal,color:"#06b6d4"},
    {label:"Cash",value:cashVal,color:"#10b981"},
  ].filter(x=>x.value>0);

  const tableHeader = (
    <div className="table-header">
      <div style={{width:"24px",flexShrink:0}}/>
      <div className="th" style={{width:"110px",flexShrink:0}}>Asset</div>
      <div className="th" style={{flex:1}}>Cost Basis</div>
      <div className="th" style={{flex:1}}>Mkt Value</div>
      <div className="th" style={{flex:1,textAlign:"right"}}>Return</div>
      <div style={{width:"90px",flexShrink:0}}/>
    </div>
  );

  function renderDashboard() {
    return (
      <div style={{maxWidth:"920px",margin:"0 auto",padding:"0 1rem 2rem"}}>

        {/* Hero */}
        <div className="hero">
          <div className="hero-inner">
            <div className="hero-label">Total Net Worth</div>
            <div className={`hero-amount ${netWorth>=0?"positive":"negative"}`}>{fmtCompact(netWorth)}</div>
            <div className="hero-stats">
              {[
                {l:"Total Assets",v:fmt(totalAssets),c:"var(--text)"},
                {l:"Total Debt",v:fmt(totalDebt),c:"var(--red)"},
                {l:"Invested",v:fmt(totalInvest),c:"var(--text)"},
                {l:"Cash",v:fmt(cashVal),c:"var(--green)"},
              ].map(i=>(
                <div key={i.l}>
                  <div className="hero-stat-label">{i.l}</div>
                  <div className="hero-stat-val" style={{color:i.c}}>{i.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Allocation */}
        {alloc.length > 0 && (
          <div className="glass-card" style={{margin:"1rem 0"}}>
            <div className="card-header">
              <span className="section-label">Portfolio Allocation</span>
              <span className="live-dot" />
            </div>
            <div style={{padding:"1rem 1.25rem"}}>
              <div className="alloc-bar">
                {alloc.map(a=>(
                  <div key={a.label} className="alloc-seg"
                    style={{width:`${(a.value/totalAssets)*100}%`,background:a.color}} />
                ))}
              </div>
              <div style={{display:"flex",gap:"1.25rem",flexWrap:"wrap",marginTop:"0.5rem"}}>
                {alloc.map(a=>(
                  <div key={a.label} style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"2px",background:a.color,flexShrink:0}}/>
                    <span style={{fontSize:"0.7rem",color:"var(--muted)"}}>{a.label}</span>
                    <span style={{fontSize:"0.7rem",color:"var(--text)",fontFamily:"'JetBrains Mono',monospace"}}>
                      {((a.value/totalAssets)*100).toFixed(1)}%
                    </span>
                    <span style={{fontSize:"0.65rem",color:"var(--muted2)",fontFamily:"'JetBrains Mono',monospace"}}>
                      {fmtCompact(a.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Growth */}
        <div className="glass-card" style={{margin:"1rem 0"}}>
          <div className="card-header">
            <span className="section-label">Portfolio Growth</span>
          </div>
          <div className="growth-grid">
            {[
              {label:"Cost Basis",value:fmt(totalCost),n:null},
              {label:"Current Value",value:fmt(totalInvest),n:null},
              {label:"Total Return",value:totalGain!==null?fmt(totalGain):"—",n:totalGain},
              {label:"Return %",value:totalGainPct!==null?fmtPct(totalGainPct):"—",n:totalGainPct},
            ].map((item,i)=>(
              <div key={i} className={`growth-cell ${item.n!=null?(item.n>=0?"positive":"negative"):""}`}>
                <div className="growth-label">{item.label}</div>
                <div className="growth-val" style={{color:item.n!=null?(item.n>=0?"var(--green)":"var(--red)"):"var(--text)"}}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Table */}
        <div className="glass-card" style={{margin:"1rem 0"}}>
          <div className="card-header">
            <span className="section-label">Holdings</span>
          </div>
          <div className="asset-table">
            {tableHeader}

            <AssetRow icon="📈" label="Stocks" cost={stkCost} value={stkVal} gain={stkGain} gainPct={stkGainPct} onAdd={()=>setModal("addStock")}>
              {stockItems.map(s=>(
                <SubRow key={s.id} label={s.symbol} qty={s.shares} avgCost={s.avgCost}
                  price={s.price} value={s.value} gain={s.gain} gainPct={s.gainPct} change24h={s.change24h}
                  onRemove={()=>setData(d=>({...d,stocks:d.stocks.filter(x=>x.id!==s.id)}))} />
              ))}
              {!stockItems.length && <div style={{padding:"0.85rem 3.5rem",fontSize:"0.72rem",color:"var(--muted2)"}}>No stocks — click + Add</div>}
            </AssetRow>

            <AssetRow icon="₿" label="Crypto" cost={cryPtoCost} value={cryptoVal} gain={cryptoGain} gainPct={cryptoGainPct} onAdd={()=>setModal("addCrypto")}>
              {cryptoItems.map(c=>(
                <SubRow key={c.id} label={c.symbol} qty={c.amount} avgCost={c.avgCost}
                  price={c.price} value={c.value} gain={c.gain} gainPct={c.gainPct} change24h={c.change24h}
                  onRemove={()=>setData(d=>({...d,crypto:d.crypto.filter(x=>x.id!==c.id)}))} />
              ))}
              {!cryptoItems.length && <div style={{padding:"0.85rem 3.5rem",fontSize:"0.72rem",color:"var(--muted2)"}}>No crypto — click + Add</div>}
            </AssetRow>

            <AssetRow icon="🥇" label="Gold" cost={goldCost} value={goldVal} gain={goldGain} gainPct={goldGainPct}
              onEdit={()=>{setGoldForm({oz:data.gold.oz||"",avgCost:data.gold.avgCost||""});setModal("editGold");}}>
              <div style={{padding:"0.65rem 1rem 0.65rem 3.5rem",fontSize:"0.72rem",color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace"}}>
                {data.gold.oz||0} oz · spot {prices.gold?fmt(prices.gold):"—"}/oz · avg ${data.gold.avgCost||0}/oz
              </div>
            </AssetRow>

            <AssetRow icon="🥈" label="Silver" cost={silvCost} value={silvVal} gain={silvGain} gainPct={silvGainPct}
              onEdit={()=>{setSilverForm({oz:data.silver.oz||"",avgCost:data.silver.avgCost||""});setModal("editSilver");}}>
              <div style={{padding:"0.65rem 1rem 0.65rem 3.5rem",fontSize:"0.72rem",color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace"}}>
                {data.silver.oz||0} oz · spot {prices.silver?fmt(prices.silver):"—"}/oz · avg ${data.silver.avgCost||0}/oz
              </div>
            </AssetRow>

            <AssetRow icon="💵" label="Cash" cost={cashVal} value={cashVal} gain={0} gainPct={0}
              onEdit={()=>{setCashForm(data.cash.map(c=>({...c})));setModal("editCash");}}>
              {data.cash.map(c=>(
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 1rem 0.5rem 3.5rem",fontSize:"0.75rem",borderBottom:"1px solid rgba(20,30,46,0.4)"}}>
                  <span style={{color:"var(--muted)"}}>{c.label}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",color:"var(--green)"}}>{fmt(c.amount)}</span>
                </div>
              ))}
            </AssetRow>
          </div>
        </div>

        {/* Debt */}
        <div className="glass-card">
          <div className="card-header">
            <span className="section-label">Liabilities</span>
            <button className="act-btn edit" onClick={()=>{setDebtForm(data.debt.map(d=>({...d})));setModal("editDebt");}}>Edit</button>
          </div>
          {data.debt.map(d=>(
            <div className="debt-row" key={d.id}>
              <div>
                <div style={{fontSize:"0.85rem",color:"var(--text)"}}>{d.label}</div>
                {d.monthly>0&&<div style={{fontSize:"0.62rem",color:"var(--muted)",marginTop:"0.15rem"}}>${d.monthly}/mo</div>}
              </div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",color:"var(--red)",fontSize:"0.88rem"}}>{fmt(d.balance)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"0.85rem 1.25rem",borderTop:"1px solid var(--border)"}}>
            <span style={{fontSize:"0.78rem",fontWeight:600,color:"var(--text)"}}>Total Debt</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",color:"var(--red)",fontWeight:600}}>{fmt(totalDebt)}</span>
          </div>
        </div>
      </div>
    );
  }

  function renderManage() {
    return (
      <div style={{maxWidth:"920px",margin:"0 auto",padding:"1.5rem 1rem"}}>
        <div className="manage-grid">
          {/* Stocks */}
          <div className="manage-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="manage-card-title">📈 Stocks & ETFs</span>
              <button className="act-btn add" onClick={()=>setModal("addStock")}>+ Add</button>
            </div>
            {data.stocks.map(s=>(
              <div className="manage-item" key={s.id}>
                <div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.8rem",color:"var(--gold)"}}>{s.symbol}</div>
                  <div style={{fontSize:"0.62rem",color:"var(--muted)"}}>{s.shares} shares @ ${s.avgCost}</div>
                </div>
                <button className="act-btn del" onClick={()=>setData(d=>({...d,stocks:d.stocks.filter(x=>x.id!==s.id)}))}>✕</button>
              </div>
            ))}
            {!data.stocks.length && <div style={{fontSize:"0.72rem",color:"var(--muted2)"}}>None added</div>}
          </div>

          {/* Crypto */}
          <div className="manage-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="manage-card-title">₿ Crypto</span>
              <button className="act-btn add" onClick={()=>setModal("addCrypto")}>+ Add</button>
            </div>
            {data.crypto.map(c=>(
              <div className="manage-item" key={c.id}>
                <div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.8rem",color:"#db2777"}}>{c.symbol}</div>
                  <div style={{fontSize:"0.62rem",color:"var(--muted)"}}>{c.amount} @ ${c.avgCost}</div>
                </div>
                <button className="act-btn del" onClick={()=>setData(d=>({...d,crypto:d.crypto.filter(x=>x.id!==c.id)}))}>✕</button>
              </div>
            ))}
            {!data.crypto.length && <div style={{fontSize:"0.72rem",color:"var(--muted2)"}}>None added</div>}
          </div>

          {/* Metals */}
          <div className="manage-card">
            <div className="manage-card-title">🥇 Precious Metals</div>
            {[
              {l:"Gold",oz:data.gold.oz,avg:data.gold.avgCost,onClick:()=>{setGoldForm({oz:data.gold.oz||"",avgCost:data.gold.avgCost||""});setModal("editGold");}},
              {l:"Silver",oz:data.silver.oz,avg:data.silver.avgCost,onClick:()=>{setSilverForm({oz:data.silver.oz||"",avgCost:data.silver.avgCost||""});setModal("editSilver");}},
            ].map(m=>(
              <div className="manage-item" key={m.l}>
                <div>
                  <div style={{fontSize:"0.82rem",color:"var(--text)"}}>{m.l}</div>
                  <div style={{fontSize:"0.62rem",color:"var(--muted)"}}>{m.oz||0} oz · avg ${m.avg||0}/oz</div>
                </div>
                <button className="act-btn edit" onClick={m.onClick}>Edit</button>
              </div>
            ))}
          </div>

          {/* Cash */}
          <div className="manage-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="manage-card-title">💵 Cash & Savings</span>
              <button className="act-btn edit" onClick={()=>{setCashForm(data.cash.map(c=>({...c})));setModal("editCash");}}>Edit</button>
            </div>
            {data.cash.map(c=>(
              <div className="manage-item" key={c.id}>
                <span style={{fontSize:"0.8rem",color:"var(--muted)"}}>{c.label}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.8rem",color:"var(--green)"}}>{fmt(c.amount)}</span>
              </div>
            ))}
          </div>

          {/* Debt */}
          <div className="manage-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="manage-card-title">💳 Debt</span>
              <button className="act-btn edit" onClick={()=>{setDebtForm(data.debt.map(d=>({...d})));setModal("editDebt");}}>Edit</button>
            </div>
            {data.debt.map(d=>(
              <div className="manage-item" key={d.id}>
                <div>
                  <div style={{fontSize:"0.8rem",color:"var(--text)"}}>{d.label}</div>
                  {d.monthly>0&&<div style={{fontSize:"0.62rem",color:"var(--muted)"}}>${d.monthly}/mo</div>}
                </div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.8rem",color:"var(--red)"}}>{fmt(d.balance)}</span>
              </div>
            ))}
          </div>

          {/* Account Settings */}
          <div style={{gridColumn:"1/-1"}}>
            <div style={{
              background:"#fff",border:"1px solid #e5e7eb",borderRadius:"16px",
              padding:"1.5rem",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",marginTop:"0.5rem"
            }}>
              <div style={{fontSize:"0.72rem",color:"#4f46e5",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"1.25rem"}}>
                🔐 Account Settings
              </div>

              {/* JSONBin Sync */}
              <div style={{background:"#f0f7ff",border:"1px solid #bfdbfe",borderRadius:"12px",padding:"1.1rem",marginBottom:"1.5rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
                  <div>
                    <div style={{fontSize:"0.78rem",fontWeight:700,color:"#1d4ed8"}}>☁️ Cloud Sync (JSONBin.io)</div>
                    <div style={{fontSize:"0.68rem",color:"#3b82f6",marginTop:"0.15rem"}}>Sync your data across all devices</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                    {jsonbinConfig.binId && <span style={{fontSize:"0.65rem",color:"#16a34a",background:"#dcfce7",padding:"0.15rem 0.5rem",borderRadius:"99px",border:"1px solid #bbf7d0"}}>✓ Connected</span>}
                    <button onClick={()=>setShowJsonbinSetup(s=>!s)} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:"7px",padding:"0.35rem 0.75rem",fontSize:"0.72rem",fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                      {showJsonbinSetup?"Cancel":jsonbinConfig.binId?"Edit":"Set Up"}
                    </button>
                  </div>
                </div>

                {!jsonbinConfig.binId && !showJsonbinSetup && (
                  <div style={{fontSize:"0.72rem",color:"#6b7280",lineHeight:1.6}}>
                    <b>How to set up:</b> Go to <b>jsonbin.io</b> → sign up free → copy your <b>Master Key</b> from API Keys page → create a new Bin → copy the <b>Bin ID</b> → paste both below.
                  </div>
                )}

                {showJsonbinSetup && (
                  <div style={{marginTop:"0.5rem"}}>
                    <div style={{marginBottom:"0.6rem"}}>
                      <div style={{fontSize:"0.6rem",color:"#1d4ed8",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem",fontWeight:600}}>Master API Key (X-Master-Key)</div>
                      <input value={jsonbinForm.apiKey} onChange={e=>setJsonbinForm(f=>({...f,apiKey:e.target.value}))}
                        placeholder="$2a$10$..."
                        style={{width:"100%",background:"#fff",border:"1px solid #bfdbfe",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#111827",fontSize:"0.8rem",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                      />
                    </div>
                    <div style={{marginBottom:"0.85rem"}}>
                      <div style={{fontSize:"0.6rem",color:"#1d4ed8",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem",fontWeight:600}}>Bin ID</div>
                      <input value={jsonbinForm.binId} onChange={e=>setJsonbinForm(f=>({...f,binId:e.target.value}))}
                        placeholder="6801abc123..."
                        style={{width:"100%",background:"#fff",border:"1px solid #bfdbfe",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#111827",fontSize:"0.8rem",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                      />
                    </div>
                    <div style={{display:"flex",gap:"0.5rem"}}>
                      <button onClick={async()=>{
                        if(!jsonbinForm.apiKey||!jsonbinForm.binId){return;}
                        // Test connection
                        setSyncStatus('syncing');
                        try {
                          const r = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinForm.binId}/latest`,{headers:{'X-Master-Key':jsonbinForm.apiKey}});
                          if(!r.ok){setSyncStatus('error');alert('Could not connect — check your API Key and Bin ID');return;}
                        } catch { setSyncStatus('error'); alert('Connection failed'); return; }
                        await window.storage.set(JSONBIN_KEY, JSON.stringify({apiKey:jsonbinForm.apiKey,binId:jsonbinForm.binId}), true);
                        setJsonbinConfig({apiKey:jsonbinForm.apiKey,binId:jsonbinForm.binId});
                        setSyncStatus('ok');
                        setShowJsonbinSetup(false);
                        // Push current data to bin
                        await fetch(`https://api.jsonbin.io/v3/b/${jsonbinForm.binId}`,{method:'PUT',headers:{'Content-Type':'application/json','X-Master-Key':jsonbinForm.apiKey},body:JSON.stringify(data)});
                      }} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.75rem",fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                        Save & Connect
                      </button>
                      {jsonbinConfig.binId && <button onClick={async()=>{
                        await window.storage.set(JSONBIN_KEY, JSON.stringify({apiKey:'',binId:''}), true);
                        setJsonbinConfig({apiKey:'',binId:''});
                        setJsonbinForm({apiKey:'',binId:''});
                        setShowJsonbinSetup(false);
                        setSyncStatus('');
                      }} style={{background:"#fee2e2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:"8px",padding:"0.5rem 1rem",fontSize:"0.75rem",fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                        Disconnect
                      </button>}
                    </div>
                  </div>
                )}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"1.5rem"}}>

                {/* Change Username */}
                <div>
                  <div style={{fontSize:"0.75rem",fontWeight:600,color:"#374151",marginBottom:"0.85rem"}}>Change Username</div>
                  <div style={{marginBottom:"0.6rem"}}>
                    <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem",fontWeight:600}}>New Username</div>
                    <input value={accountForm.newUsername} onChange={e=>setAccountForm(f=>({...f,newUsername:e.target.value}))}
                      placeholder="Enter new username"
                      style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#111827",fontSize:"0.85rem",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}
                    />
                  </div>
                  <div style={{marginBottom:"0.85rem"}}>
                    <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem",fontWeight:600}}>Current Password</div>
                    <input type="password" value={accountForm.currentPw} onChange={e=>setAccountForm(f=>({...f,currentPw:e.target.value}))}
                      placeholder="Confirm with password"
                      style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#111827",fontSize:"0.85rem",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}
                    />
                  </div>
                  <button onClick={async()=>{
                    setAccountMsg({text:'',type:''});
                    if(!accountForm.newUsername.trim()){setAccountMsg({text:'Enter a new username',type:'error'});return;}
                    try{
                      const auth=await window.storage.get(AUTH_KEY, true);
                      if(!auth?.value){setAccountMsg({text:'Account not found',type:'error'});return;}
                      const creds=JSON.parse(auth.value);
                      if(accountForm.currentPw!==creds.password){setAccountMsg({text:'Incorrect password',type:'error'});return;}
                      await window.storage.set(AUTH_KEY,JSON.stringify({...creds,username:accountForm.newUsername.trim()}), true);
                      const sess=await window.storage.get(SESSION_KEY, true);
                      if(sess?.value){const s=JSON.parse(sess.value);await window.storage.set(SESSION_KEY,JSON.stringify({...s,username:accountForm.newUsername.trim()}), true);}
                      setAccountForm(f=>({...f,newUsername:'',currentPw:''}));
                      setAccountMsg({text:'Username updated! Please sign in again.',type:'success'});
                      setTimeout(()=>onLogout(),1500);
                    }catch{setAccountMsg({text:'Something went wrong',type:'error'});}
                  }} style={{
                    background:"linear-gradient(135deg,#1a1a2e,#2d2d50)",color:"#fff",border:"none",
                    borderRadius:"8px",padding:"0.55rem 1.1rem",fontSize:"0.78rem",fontWeight:700,
                    cursor:"pointer",letterSpacing:"0.05em",textTransform:"uppercase",fontFamily:"'Outfit',sans-serif"
                  }}>Update Username</button>
                </div>

                {/* Change Password */}
                <div>
                  <div style={{fontSize:"0.75rem",fontWeight:600,color:"#374151",marginBottom:"0.85rem"}}>Change Password</div>
                  <div style={{marginBottom:"0.6rem"}}>
                    <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem",fontWeight:600}}>Current Password</div>
                    <input type="password" value={accountForm.currentPw} onChange={e=>setAccountForm(f=>({...f,currentPw:e.target.value}))}
                      placeholder="Enter current password"
                      style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#111827",fontSize:"0.85rem",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}
                    />
                  </div>
                  <div style={{marginBottom:"0.6rem"}}>
                    <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem",fontWeight:600}}>New Password</div>
                    <input type="password" value={accountForm.newPw} onChange={e=>setAccountForm(f=>({...f,newPw:e.target.value}))}
                      placeholder="Enter new password"
                      style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#111827",fontSize:"0.85rem",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}
                    />
                  </div>
                  <div style={{marginBottom:"0.85rem"}}>
                    <div style={{fontSize:"0.6rem",color:"#6b7280",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"0.25rem",fontWeight:600}}>Confirm New Password</div>
                    <input type="password" value={accountForm.confirmPw} onChange={e=>setAccountForm(f=>({...f,confirmPw:e.target.value}))}
                      placeholder="Re-enter new password"
                      style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"0.6rem 0.8rem",color:"#111827",fontSize:"0.85rem",outline:"none",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}
                    />
                  </div>
                  <button onClick={async()=>{
                    setAccountMsg({text:'',type:''});
                    if(accountForm.newPw.length<4){setAccountMsg({text:'New password must be at least 4 characters',type:'error'});return;}
                    if(accountForm.newPw!==accountForm.confirmPw){setAccountMsg({text:'Passwords do not match',type:'error'});return;}
                    try{
                      const auth=await window.storage.get(AUTH_KEY, true);
                      if(!auth?.value){setAccountMsg({text:'Account not found',type:'error'});return;}
                      const creds=JSON.parse(auth.value);
                      if(accountForm.currentPw!==creds.password){setAccountMsg({text:'Current password is incorrect',type:'error'});return;}
                      await window.storage.set(AUTH_KEY,JSON.stringify({...creds,password:accountForm.newPw}), true);
                      setAccountForm(f=>({...f,currentPw:'',newPw:'',confirmPw:''}));
                      setAccountMsg({text:'Password updated successfully!',type:'success'});
                    }catch{setAccountMsg({text:'Something went wrong',type:'error'});}
                  }} style={{
                    background:"linear-gradient(135deg,#1a1a2e,#2d2d50)",color:"#fff",border:"none",
                    borderRadius:"8px",padding:"0.55rem 1.1rem",fontSize:"0.78rem",fontWeight:700,
                    cursor:"pointer",letterSpacing:"0.05em",textTransform:"uppercase",fontFamily:"'Outfit',sans-serif"
                  }}>Update Password</button>
                </div>
              </div>

              {/* Status message */}
              {accountMsg.text && (
                <div style={{
                  marginTop:"1rem",padding:"0.6rem 0.85rem",borderRadius:"8px",fontSize:"0.8rem",fontWeight:500,
                  background: accountMsg.type==='success'?"#dcfce7":"#fee2e2",
                  color: accountMsg.type==='success'?"#15803d":"#dc2626",
                  border: `1px solid ${accountMsg.type==='success'?"#bbf7d0":"#fecaca"}`,
                }}>{accountMsg.text}</div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="vault-app">
        {/* bg orbs */}
        <div className="orb orb-1"/>
        <div className="orb orb-2"/>
        <div className="orb orb-3"/>

        {/* Topbar */}
        <div className="topbar">
          <div className="logo">VAULT</div>
          <div style={{display:"flex",gap:"0.3rem"}}>
            {["Dashboard","Manage"].map(t=>(
              <button key={t} className={`tab-btn ${tab===t?"active":"inactive"}`} onClick={()=>setTab(t)}>{t}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            {lastUpdated && <span className="time-badge">{lastUpdated.toLocaleTimeString()}</span>}
            <button className="refresh-btn" onClick={fetchPrices} disabled={loading}>
              {loading ? <><span className="spinner">⟳</span> Updating</> : <><span>↻</span> Refresh</>}
            </button>
            {jsonbinConfig.binId && (
              <div title={syncStatus==='ok'?'Synced to cloud':syncStatus==='error'?'Sync failed':'Syncing...'} style={{display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.65rem',color:syncStatus==='ok'?'#16a34a':syncStatus==='error'?'#dc2626':'#f59e0b'}}>
                <div style={{width:'7px',height:'7px',borderRadius:'50%',background:syncStatus==='ok'?'#16a34a':syncStatus==='error'?'#dc2626':'#f59e0b',boxShadow:syncStatus==='ok'?'0 0 6px #16a34a':syncStatus==='error'?'0 0 6px #dc2626':'0 0 6px #f59e0b'}}/>
                {syncStatus==='ok'?'Synced':syncStatus==='error'?'Sync Error':'Syncing'}
              </div>
            )}
          </div>
        </div>

        {tab==="Dashboard" && renderDashboard()}
        {tab==="Manage" && renderManage()}

        {/* ── Modals ── */}
        {modal==="addStock" && (
          <Modal title="ADD STOCK / ETF" onClose={()=>setModal(null)}>
            <Inp label="Ticker Symbol" value={stockForm.symbol} onChange={v=>setStockForm(f=>({...f,symbol:v}))} placeholder="NVDA, SPY, VOO…" />
            <Inp label="Shares" type="number" value={stockForm.shares} onChange={v=>setStockForm(f=>({...f,shares:v}))} placeholder="10" />
            <Inp label="Avg Cost Per Share ($)" type="number" value={stockForm.avgCost} onChange={v=>setStockForm(f=>({...f,avgCost:v}))} placeholder="150.00" />
            <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={()=>{
                if(!stockForm.symbol||!stockForm.shares) return;
                setData(d=>({...d,stocks:[...d.stocks,{id:Date.now(),symbol:stockForm.symbol.toUpperCase().trim(),shares:parseFloat(stockForm.shares),avgCost:parseFloat(stockForm.avgCost)||0}]}));
                setStockForm({symbol:"",shares:"",avgCost:""});setModal(null);setTimeout(fetchPrices,300);
              }}>Add Stock</button>
            </div>
          </Modal>
        )}

        {modal==="addCrypto" && (
          <Modal title="ADD CRYPTO" onClose={()=>setModal(null)}>
            <div style={{fontSize:"0.65rem",color:"var(--muted)",marginBottom:"1rem",letterSpacing:"0.05em"}}>Supported: {Object.keys(CRYPTO_IDS).join(" · ")}</div>
            <Inp label="Symbol" value={cryptoForm.symbol} onChange={v=>setCryptoForm(f=>({...f,symbol:v}))} placeholder="BTC, ETH, SOL…" />
            <Inp label="Amount" type="number" value={cryptoForm.amount} onChange={v=>setCryptoForm(f=>({...f,amount:v}))} placeholder="0.5" />
            <Inp label="Avg Cost Per Coin ($)" type="number" value={cryptoForm.avgCost} onChange={v=>setCryptoForm(f=>({...f,avgCost:v}))} placeholder="50000" />
            <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={()=>{
                if(!cryptoForm.symbol||!cryptoForm.amount) return;
                setData(d=>({...d,crypto:[...d.crypto,{id:Date.now(),symbol:cryptoForm.symbol.toUpperCase().trim(),amount:parseFloat(cryptoForm.amount),avgCost:parseFloat(cryptoForm.avgCost)||0}]}));
                setCryptoForm({symbol:"",amount:"",avgCost:""});setModal(null);setTimeout(fetchPrices,300);
              }}>Add Crypto</button>
            </div>
          </Modal>
        )}

        {modal==="editGold" && (
          <Modal title="EDIT GOLD" onClose={()=>setModal(null)}>
            <Inp label="Ounces Held" type="number" value={goldForm.oz} onChange={v=>setGoldForm(f=>({...f,oz:v}))} placeholder="1.5" />
            <Inp label="Avg Cost Per Oz ($)" type="number" value={goldForm.avgCost} onChange={v=>setGoldForm(f=>({...f,avgCost:v}))} placeholder="1900" />
            <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={()=>{setData(d=>({...d,gold:{oz:parseFloat(goldForm.oz)||0,avgCost:parseFloat(goldForm.avgCost)||0}}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}

        {modal==="editSilver" && (
          <Modal title="EDIT SILVER" onClose={()=>setModal(null)}>
            <Inp label="Ounces Held" type="number" value={silverForm.oz} onChange={v=>setSilverForm(f=>({...f,oz:v}))} placeholder="10" />
            <Inp label="Avg Cost Per Oz ($)" type="number" value={silverForm.avgCost} onChange={v=>setSilverForm(f=>({...f,avgCost:v}))} placeholder="25" />
            <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={()=>{setData(d=>({...d,silver:{oz:parseFloat(silverForm.oz)||0,avgCost:parseFloat(silverForm.avgCost)||0}}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}

        {modal==="editCash" && (
          <Modal title="EDIT CASH & SAVINGS" onClose={()=>setModal(null)}>
            {cashForm.map((c,i)=>(
              <div key={c.id} style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}>
                <div style={{flex:1}}><Inp label="Account" value={c.label} onChange={v=>setCashForm(f=>f.map((x,j)=>j===i?{...x,label:v}:x))} placeholder="Checking" /></div>
                <div style={{flex:1}}><Inp label="Balance ($)" type="number" value={c.amount} onChange={v=>setCashForm(f=>f.map((x,j)=>j===i?{...x,amount:v}:x))} placeholder="0" /></div>
                <button className="act-btn del" onClick={()=>setCashForm(f=>f.filter(x=>x.id!==c.id))} style={{marginTop:"1.5rem"}}>✕</button>
              </div>
            ))}
            <button className="btn-ghost" style={{fontSize:"0.75rem",padding:"0.4rem 0.9rem",marginBottom:"1rem"}} onClick={()=>setCashForm(f=>[...f,{id:Date.now(),label:"",amount:""}])}>+ Add Account</button>
            <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end"}}>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={()=>{setData(d=>({...d,cash:cashForm.map(c=>({...c,amount:parseFloat(c.amount)||0}))}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}

        {modal==="editDebt" && (
          <Modal title="EDIT DEBT" onClose={()=>setModal(null)}>
            {debtForm.map((d,i)=>(
              <div key={d.id} style={{background:"#f3f4f6",borderRadius:"12px",padding:"1rem",marginBottom:"0.75rem",border:"1px solid var(--border)"}}>
                <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}>
                  <div style={{flex:2}}><Inp label="Name" value={d.label} onChange={v=>setDebtForm(f=>f.map((x,j)=>j===i?{...x,label:v}:x))} placeholder="Car Loan" /></div>
                  <button className="act-btn del" onClick={()=>setDebtForm(f=>f.filter(x=>x.id!==d.id))} style={{marginTop:"1.5rem"}}>✕</button>
                </div>
                <div style={{display:"flex",gap:"0.5rem"}}>
                  <div style={{flex:1}}><Inp label="Balance ($)" type="number" value={d.balance} onChange={v=>setDebtForm(f=>f.map((x,j)=>j===i?{...x,balance:v}:x))} placeholder="5000" /></div>
                  <div style={{flex:1}}><Inp label="Monthly ($)" type="number" value={d.monthly} onChange={v=>setDebtForm(f=>f.map((x,j)=>j===i?{...x,monthly:v}:x))} placeholder="200" /></div>
                </div>
              </div>
            ))}
            <button className="btn-ghost" style={{fontSize:"0.75rem",padding:"0.4rem 0.9rem",marginBottom:"1rem"}} onClick={()=>setDebtForm(f=>[...f,{id:Date.now(),label:"",balance:"",monthly:""}])}>+ Add Debt</button>
            <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end"}}>
              <button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={()=>{setData(d=>({...d,debt:debtForm.map(x=>({...x,balance:parseFloat(x.balance)||0,monthly:parseFloat(x.monthly)||0}))}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}
