import { useState, useEffect, useCallback, useRef } from "react";
// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f4f6f9;--white:#fff;--border:#e4e7ef;--border2:#c8cfe0;
  --navy:#0b1f3a;--navy2:#162d52;--blue:#1a56db;--blue2:#1347c2;
  --green:#059669;--green-bg:#ecfdf5;--red:#dc2626;--red-bg:#fef2f2;
  --amber:#d97706;--amber-bg:#fffbeb;
  --text:#0b1f3a;--text2:#4b5675;--text3:#8896b3;
  --sh:0 1px 3px rgba(0,0,0,.07),0 1px 2px rgba(0,0,0,.04);
  --sh-md:0 4px 12px rgba(0,0,0,.08);--sh-lg:0 12px 32px rgba(0,0,0,.12);
  --r:12px;--r-lg:16px;
}
body{background:var(--bg);font-family:'Inter',sans-serif;color:var(--text);}
input,button,select{font-family:'Inter',sans-serif;}
input::placeholder{color:var(--text3)!important;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px;}

.topbar{background:var(--navy);height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;position:sticky;top:0;z-index:200;box-shadow:0 1px 0 rgba(255,255,255,.06);}
.logo{font-size:1.05rem;font-weight:700;letter-spacing:.06em;color:#fff;display:flex;align-items:center;gap:.4rem;}
.logo-accent{color:#60a5fa;}
.nav-pills{display:flex;gap:.2rem;}
.nav-pill{padding:.3rem .85rem;border-radius:6px;border:none;cursor:pointer;font-size:.73rem;font-weight:500;background:transparent;color:rgba(255,255,255,.55);transition:all .15s;}
.nav-pill.active{background:rgba(255,255,255,.1);color:#fff;}
.nav-pill:hover{color:#fff;}
.topbar-right{display:flex;align-items:center;gap:.6rem;}
.user-chip{display:flex;align-items:center;gap:.4rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.28rem .65rem;font-size:.7rem;color:rgba(255,255,255,.75);}
.dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.dot-green{background:#10b981;box-shadow:0 0 5px #10b981;}
.dot-amber{background:#f59e0b;animation:blink 1s infinite;}
.dot-red{background:#ef4444;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.ref-btn{display:flex;align-items:center;gap:.35rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;color:rgba(255,255,255,.8);cursor:pointer;padding:.28rem .7rem;font-size:.7rem;font-weight:500;transition:all .15s;}
.ref-btn:hover{background:rgba(255,255,255,.13);}
.ref-btn:disabled{opacity:.4;}
.spin{animation:spin 1s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}
.signout{background:transparent;border:1px solid rgba(255,255,255,.15);border-radius:6px;color:rgba(255,255,255,.5);cursor:pointer;padding:.25rem .55rem;font-size:.68rem;transition:all .15s;}
.signout:hover{color:#fff;border-color:rgba(255,255,255,.35);}

.main{max-width:960px;margin:0 auto;padding:1.5rem 1rem 4rem;}

/* Hero */
.hero{background:var(--navy);border-radius:var(--r-lg);padding:1.75rem 2rem 1.5rem;margin-bottom:1rem;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 100% 0%,rgba(26,86,219,.35) 0%,transparent 55%),radial-gradient(ellipse at 5% 100%,rgba(5,150,105,.18) 0%,transparent 50%);pointer-events:none;}
.hero-inner{position:relative;}
.hero-lbl{font-size:.65rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:.3rem;}
.hero-nw{font-size:clamp(2rem,6vw,3.2rem);font-weight:700;letter-spacing:-.02em;line-height:1;color:#fff;margin-bottom:1.25rem;}
.hero-nw.up{color:#34d399;}
.hero-nw.dn{color:#f87171;}
.hero-stats{display:flex;gap:2rem;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,.07);padding-top:1.1rem;}
.hs-lbl{font-size:.6rem;color:rgba(255,255,255,.38);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.2rem;}
.hs-val{font-size:.88rem;font-weight:600;color:rgba(255,255,255,.88);font-variant-numeric:tabular-nums;}

/* Summary row */
.sum-row{display:grid;grid-template-columns:repeat(4,1fr);margin-bottom:1rem;border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--sh);border:1px solid var(--border);}
.sum-cell{background:var(--white);padding:.9rem 1.1rem;border-right:1px solid var(--border);}
.sum-cell:last-child{border-right:none;}
.sum-lbl{font-size:.58rem;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.25rem;}
.sum-val{font-size:.92rem;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums;}
.sum-val.gr{color:var(--green);}
.sum-val.rd{color:var(--red);}

/* Cards */
.card{background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--sh);overflow:hidden;margin-bottom:1rem;}
.card-hdr{display:flex;align-items:center;justify-content:space-between;padding:.85rem 1.25rem;border-bottom:1px solid var(--border);}
.card-ttl{font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--text3);}

/* Allocation */
.alloc-bar{display:flex;height:6px;border-radius:99px;overflow:hidden;gap:2px;}
.alloc-seg{border-radius:99px;transition:width .7s ease;}
.alloc-legend{display:flex;gap:1rem;flex-wrap:wrap;margin-top:.7rem;}
.al-item{display:flex;align-items:center;gap:.35rem;}
.al-dot{width:7px;height:7px;border-radius:2px;flex-shrink:0;}
.al-name{font-size:.68rem;color:var(--text3);}
.al-pct{font-size:.68rem;font-weight:600;color:var(--text);font-variant-numeric:tabular-nums;}
.al-val{font-size:.65rem;color:var(--text3);font-variant-numeric:tabular-nums;}

/* Growth grid */
.growth-grid{display:grid;grid-template-columns:repeat(4,1fr);}
.gc{padding:.9rem 1.1rem;border-right:1px solid var(--border);position:relative;overflow:hidden;}
.gc:last-child{border-right:none;}
.gc::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;opacity:0;transition:opacity .2s;}
.gc:hover::after{opacity:1;}
.gc.up::after{background:var(--green);}
.gc.dn::after{background:var(--red);}
.gc-lbl{font-size:.58rem;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.25rem;}
.gc-val{font-size:.9rem;font-weight:700;font-variant-numeric:tabular-nums;}
.gc-val.up{color:var(--green);}
.gc-val.dn{color:var(--red);}
.gc-val.neu{color:var(--text);}

/* Holdings */
.tbl-hdr{display:flex;align-items:center;padding:.45rem 1rem;background:var(--bg);border-bottom:1px solid var(--border);}
.th{font-size:.58rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;}
.asset-row{border-bottom:1px solid var(--border);}
.asset-row:last-child{border-bottom:none;}
.asset-row-inner{display:flex;align-items:center;padding:.8rem 1rem;gap:.5rem;cursor:pointer;transition:background .1s;}
.asset-row-inner:hover{background:#f8fafd;}
.exp-btn{width:22px;height:22px;border-radius:6px;border:none;display:flex;align-items:center;justify-content:center;font-size:.6rem;cursor:pointer;flex-shrink:0;background:var(--border);color:var(--text3);transition:all .15s;}
.exp-btn.active,.exp-btn:hover{background:var(--blue);color:#fff;}
.anc{width:130px;flex-shrink:0;}
.ai{display:flex;align-items:center;gap:.5rem;}
.a-icon{font-size:.95rem;}
.a-name{font-size:.83rem;font-weight:600;color:var(--text);}
.mono{font-family:'DM Mono',monospace;font-size:.8rem;color:var(--text2);}
.mono-val{font-family:'DM Mono',monospace;font-size:.83rem;font-weight:500;color:var(--text);}
.ret-up{color:var(--green);font-family:'DM Mono',monospace;font-size:.8rem;}
.ret-dn{color:var(--red);font-family:'DM Mono',monospace;font-size:.8rem;}
.ret-pct{font-size:.65rem;}

/* Badge */
.bdg{display:inline-flex;align-items:center;padding:.1rem .42rem;border-radius:99px;font-size:.63rem;font-weight:600;font-family:'DM Mono',monospace;}
.bdg-up{background:var(--green-bg);color:var(--green);}
.bdg-dn{background:var(--red-bg);color:var(--red);}

/* Sub rows */
.sub-rows{background:#f8fafd;border-top:1px solid var(--border);}
.sub-row{display:flex;align-items:center;padding:.58rem 1rem .58rem 3.2rem;gap:.5rem;border-bottom:1px solid var(--border);}
.sub-row:last-child{border-bottom:none;}
.sub-row:hover{background:#f0f4fc;}
.ticker{font-size:.76rem;font-weight:700;color:var(--blue);font-family:'DM Mono',monospace;}
.ticker-sub{font-size:.6rem;color:var(--text3);margin-top:.08rem;}

/* Debt & Retire rows */
.debt-row,.ret-row{display:flex;justify-content:space-between;align-items:center;padding:.75rem 1.25rem;border-bottom:1px solid var(--border);}
.debt-row:last-of-type,.ret-row:last-of-type{border-bottom:none;}

/* Buttons */
.btn-add{background:var(--blue);color:#fff;border:none;border-radius:7px;padding:.26rem .65rem;font-size:.68rem;font-weight:600;cursor:pointer;transition:all .15s;}
.btn-add:hover{background:var(--blue2);}
.btn-edit{background:var(--bg);color:var(--text2);border:1px solid var(--border);border-radius:7px;padding:.3rem .75rem;font-size:.68rem;font-weight:500;cursor:pointer;transition:all .15s;min-height:30px;}
.btn-edit:hover{border-color:var(--border2);color:var(--text);}
.btn-del{background:var(--red-bg);color:var(--red);border:none;border-radius:6px;padding:.2rem .5rem;font-size:.65rem;font-weight:600;cursor:pointer;}
.btn-del:hover{background:#fecaca;}

/* Modal */
.modal-ov{position:fixed;inset:0;z-index:1000;background:rgba(11,31,58,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi .15s ease;}
@keyframes fi{from{opacity:0}to{opacity:1}}
.modal-box{background:var(--white);border-radius:20px;padding:1.75rem;width:100%;max-width:440px;max-height:90vh;overflow-y:auto;box-shadow:var(--sh-lg);animation:su .2s ease;}
@keyframes su{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
.m-ttl{font-size:.95rem;font-weight:700;color:var(--text);margin-bottom:1.25rem;}
.f-lbl{font-size:.6rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.28rem;}
.f-inp{width:100%;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:.62rem .85rem;color:var(--text);font-size:.88rem;outline:none;margin-bottom:.8rem;transition:border-color .15s;font-family:'DM Mono',monospace;}
.f-inp:focus{border-color:var(--blue);background:#fff;}
.btn-pri{background:var(--blue);color:#fff;border:none;border-radius:10px;padding:.65rem 1.4rem;font-size:.83rem;font-weight:600;cursor:pointer;transition:all .15s;}
.btn-pri:hover{background:var(--blue2);transform:translateY(-1px);box-shadow:0 4px 14px rgba(26,86,219,.3);}
.btn-gho{background:var(--bg);color:var(--text2);border:1.5px solid var(--border);border-radius:10px;padding:.65rem 1.2rem;font-size:.83rem;font-weight:500;cursor:pointer;transition:all .15s;}
.btn-gho:hover{border-color:var(--border2);}
.err-box{background:var(--red-bg);border:1px solid #fecaca;border-radius:8px;padding:.5rem .8rem;font-size:.76rem;color:var(--red);margin-bottom:.8rem;}

/* Login */
.login-bg{min-height:100vh;background:var(--navy);display:flex;align-items:center;justify-content:center;padding:1rem;background-image:radial-gradient(ellipse at 70% 30%,rgba(26,86,219,.25) 0%,transparent 50%),radial-gradient(ellipse at 20% 80%,rgba(5,150,105,.12) 0%,transparent 50%);}
.login-card{background:#fff;border-radius:20px;padding:2.5rem;width:100%;max-width:400px;box-shadow:var(--sh-lg);}
.l-logo{font-size:1.3rem;font-weight:800;letter-spacing:.04em;color:var(--navy);margin-bottom:.2rem;}
.l-logo span{color:var(--blue);}
.l-sub{font-size:.76rem;color:var(--text3);margin-bottom:1.75rem;}
.l-inp{width:100%;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:.7rem .9rem;color:var(--text);font-size:.9rem;outline:none;box-sizing:border-box;transition:all .15s;margin-bottom:.7rem;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.05em;}
.l-inp:focus{border-color:var(--blue);background:#fff;box-shadow:0 0 0 3px rgba(26,86,219,.08);}
.l-btn{width:100%;background:var(--navy);color:#fff;border:none;border-radius:10px;padding:.78rem;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:.02em;}
.l-btn:hover{background:var(--navy2);transform:translateY(-1px);box-shadow:var(--sh-md);}
.chk-row{display:flex;align-items:center;gap:.5rem;cursor:pointer;margin-bottom:1.25rem;}
.chk-box{width:18px;height:18px;border-radius:5px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.chk-box.on{background:var(--blue);border-color:var(--blue);}
.chk-lbl{font-size:.76rem;color:var(--text3);user-select:none;}
.divider{height:1px;background:var(--border);margin:1.1rem 0;}
.pw-wrap{position:relative;margin-bottom:.7rem;}
.pw-wrap .l-inp{margin-bottom:0;padding-right:2.5rem;}
.pw-eye{position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text3);font-size:.85rem;}

/* Manage */
.mgr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;}
.mgr-card{background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:1.25rem;box-shadow:var(--sh);}
.mgr-ttl{font-size:.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1rem;}
.mgr-item{display:flex;justify-content:space-between;align-items:center;padding:.4rem 0;border-bottom:1px solid var(--border);}
.mgr-item:last-of-type{border-bottom:none;}

/* Acct settings */
.acct-section{grid-column:1/-1;background:var(--white);border:1px solid var(--border);border-radius:var(--r-lg);padding:1.5rem;box-shadow:var(--sh);}
.acct-ttl{font-size:.65rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.1em;margin-bottom:1.25rem;}
.acct-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.5rem;}
.acct-sub{font-size:.78rem;font-weight:600;color:var(--text);margin-bottom:.85rem;}
.acct-inp{width:100%;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;padding:.58rem .8rem;color:var(--text);font-size:.83rem;outline:none;box-sizing:border-box;transition:border-color .15s;font-family:'DM Mono',monospace;margin-bottom:.5rem;}
.acct-inp:focus{border-color:var(--blue);}
.acct-btn{background:var(--navy);color:#fff;border:none;border-radius:8px;padding:.5rem 1rem;font-size:.75rem;font-weight:600;cursor:pointer;letter-spacing:.04em;}
.acct-btn:hover{background:var(--navy2);}
.msg-ok{background:var(--green-bg);border:1px solid #a7f3d0;border-radius:8px;padding:.5rem .8rem;font-size:.76rem;color:var(--green);margin-top:.85rem;}
.msg-err{background:var(--red-bg);border:1px solid #fecaca;border-radius:8px;padding:.5rem .8rem;font-size:.76rem;color:var(--red);margin-top:.85rem;}

/* ── Tablet (iPad) ── */
@media(max-width:900px){
  .main{padding:1.25rem .85rem 5rem;}
  .hero{padding:1.5rem 1.5rem 1.25rem;}
  .hero-nw{font-size:2.4rem;}
  .gg{grid-template-columns:repeat(2,1fr);}
  .gc:nth-child(2){border-right:none;}
  .gc:nth-child(3){border-top:1px solid var(--border);}
  .mgr-grid{grid-template-columns:repeat(2,1fr);}
  .anc{width:110px;}
  .acct-grid{grid-template-columns:1fr;}
}

/* ── Mobile ── */
@media(max-width:640px){
  .topbar{padding:0 12px;height:52px;}
  .logo{font-size:14px;}
  .nav-pills{display:none;}
  .tr{gap:6px;}
  .chip{padding:3px 7px;font-size:10px;}
  .rbtn{padding:3px 8px;font-size:10px;}
  .so{font-size:9px;padding:2px 5px;}
  .main{padding:1rem .75rem 5rem;}

  .hero{padding:1.1rem 1.1rem 1rem;border-radius:10px;}
  .hero-nw{font-size:2rem;margin-bottom:1rem;}
  .hero-stats{gap:.85rem;padding-top:.85rem;}
  .hs-val{font-size:.8rem;}
  .hs-lbl{font-size:.55rem;}

  .sum-row{grid-template-columns:repeat(2,1fr);}
  .sum-cell:nth-child(2){border-right:none;}
  .sum-cell:nth-child(3){border-top:none;}
  .sum-cell:nth-child(3){border-top:1px solid var(--border);}
  .sum-val{font-size:.82rem;}

  .growth-grid{grid-template-columns:repeat(2,1fr);}
  .gc:nth-child(2){border-right:none;}
  .gc:nth-child(3){border-top:1px solid var(--border);}
  .gc{padding:.75rem 1rem;}
  .gcv{font-size:.82rem;}

  .card-hdr{padding:.75rem 1rem;}
  .thdr{display:none;}
  .arow{padding:.75rem 1rem;flex-wrap:wrap;gap:6px;}
  .anc{width:100%;display:flex;justify-content:space-between;align-items:center;}
  .anc > div {flex:1;}
  .arow .mono{display:none;}
  .arow .monov{font-size:.8rem;}
  .ret{flex:1;text-align:right;}
  .ru{font-size:.78rem;}
  .rpct{font-size:.65rem;}
  .exp-btn{width:24px;height:24px;}
  .a-name{font-size:.8rem;}
  .btnadd,.btnedit{font-size:.68rem;padding:4px 8px;}

  .sub-row{padding:.6rem .75rem .6rem 2.5rem;flex-wrap:wrap;gap:4px;}
  .sub-row > div:nth-child(2){display:none;}
  .ticker{font-size:.75rem;}
  .ticker-sub{font-size:.6rem;}

  .debt-row{padding:.65rem 1rem;}
  .dtot > span{font-size:.85rem;}

  .alloc{padding:.85rem 1rem;}
  .aleg{gap:.6rem;}
  .aname{font-size:.65rem;}
  .apct{font-size:.65rem;}

  .modal-box{padding:1.25rem;border-radius:16px;}
  .m-ttl{font-size:.9rem;}
  .f-inp{font-size:.85rem;padding:.58rem .75rem;}
  .btn-pri,.btn-gho{padding:.6rem 1rem;font-size:.8rem;}

  .login-card{padding:1.75rem 1.5rem;border-radius:16px;}
  .l-logo{font-size:1.2rem;}
  .l-inp{font-size:.88rem;padding:.65rem .85rem;}
  .l-btn{padding:.72rem;font-size:.85rem;}

  .mgr-grid{grid-template-columns:1fr;}
  .acct-grid{grid-template-columns:1fr;}
  .acct-section{padding:1.1rem;}

  /* Mobile bottom nav */
  .mobile-nav{display:flex!important;}
}

/* Bottom nav bar for mobile */
.mobile-nav{
  display:none;
  position:fixed;bottom:0;left:0;right:0;
  background:var(--white);border-top:1px solid var(--border);
  padding:.5rem 0 calc(.5rem + env(safe-area-inset-bottom));
  z-index:300;
  box-shadow:0 -2px 12px rgba(0,0,0,.07);
}
.mob-nav-btn{
  flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
  background:none;border:none;cursor:pointer;padding:.25rem 0;
}
.mob-nav-icon{font-size:18px;line-height:1;}
.mob-nav-lbl{font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;}
.mob-nav-btn.active .mob-nav-lbl{color:var(--blue);}
.mob-nav-btn.inactive .mob-nav-lbl{color:var(--text3);}
`;

// ── Firebase ─────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey:"AIzaSyCc-cNmkbW4HnMotuUGpaAkHQs0mtPbNRo",
  authDomain:"vault-f328a.firebaseapp.com",
  projectId:"vault-f328a",
  storageBucket:"vault-f328a.firebasestorage.app",
  messagingSenderId:"370299444857",
  appId:"1:370299444857:web:5dbaff35b47dd48ece7ea8"
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const fbSet = (col, id, data) => setDoc(doc(db, col, id), data);
const fbGet = async (col, id) => { const s = await getDoc(doc(db, col, id)); return s.exists() ? s.data() : null; };
const fbListen = (col, id, cb) => onSnapshot(doc(db, col, id), s => { if (s.exists()) cb(s.data()); });

async function initFirebase() { return true; }

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_KEY = "vault-session-v3";
const CRYPTO_IDS = {
  BTC:"bitcoin",ETH:"ethereum",SOL:"solana",DOGE:"dogecoin",ADA:"cardano",
  XRP:"ripple",AVAX:"avalanche-2",DOT:"polkadot",LINK:"chainlink",LTC:"litecoin",BNB:"binancecoin",
};
const DEFAULT_DATA = {
  stocks:[],crypto:[],
  gold:{oz:0,avgCost:0},silver:{oz:0,avgCost:0},
  retirement:{k401:0,rothIra:0,pension:0,k401MyContrib:0,k401CompanyContrib:0,k401YTDMine:0,k401YTDCompany:0},
  cash:[{id:1,label:"Checking",amount:0},{id:2,label:"Savings",amount:0}],
  debt:[],
};

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = n => n==null||isNaN(n) ? "—" : new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(n);
const fmtPct = n => n==null||isNaN(n) ? "—" : (n>=0?"+":"")+n.toFixed(2)+"%";
const fmtC = n => {
  if (n==null||isNaN(n)) return "—";
  const a=Math.abs(n);
  if(a>=1e6) return (n<0?"-$":"$")+(a/1e6).toFixed(2)+"M";
  if(a>=1e3) return (n<0?"-$":"$")+(a/1e3).toFixed(1)+"K";
  return fmt(n);
};
const lsGet = k => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch{return null;} };
const lsSet = (k,v) => { try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} };

// ── UI Atoms ──────────────────────────────────────────────────────────────────
function Modal({title, onClose, children}) {
  return (
    <div className="modal-ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
          <div className="m-ttl">{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:"1.25rem",lineHeight:1}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({label, value, onChange, type="text", placeholder=""}) {
  return (
    <div>
      {label && <div className="f-lbl">{label}</div>}
      <input className="f-inp" type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
    </div>
  );
}

function Badge({pct}) {
  if (pct==null||isNaN(pct)) return null;
  return <span className={`bdg ${pct>=0?"bdg-up":"bdg-dn"}`}>{fmtPct(pct)}</span>;
}

function ReturnDisplay({gain, pct}) {
  if (gain===null||gain===undefined) return <span style={{color:"var(--text3)",fontFamily:"'DM Mono',monospace",fontSize:".8rem"}}>—</span>;
  const up = gain>=0;
  return (
    <div style={{textAlign:"right"}}>
      <div className={up?"ret-up":"ret-dn"}>{fmt(gain)}</div>
      <div className={`ret-pct ${up?"ret-up":"ret-dn"}`}>{fmtPct(pct)}</div>
    </div>
  );
}

function AssetRow({icon, label, cost, value, gain, gainPct, onAdd, onEdit, children}) {
  const [open, setOpen] = useState(false);
  const hasKids = !!children;
  return (
    <div className="asset-row">
      <div className="asset-row-inner" onClick={()=>hasKids&&setOpen(o=>!o)}>
        <button className={`exp-btn${open?" active":""}`} onClick={e=>{e.stopPropagation();hasKids&&setOpen(o=>!o);}}>
          {hasKids?(open?"▾":"▸"):""}
        </button>
        <div className="anc">
          <div className="ai"><span className="a-icon">{icon}</span><span className="a-name">{label}</span></div>
        </div>
        <div style={{flex:1}}><span className="mono">{fmt(cost)}</span></div>
        <div style={{flex:1}}><span className="mono-val">{fmt(value)}</span></div>
        <div style={{flex:1}}><ReturnDisplay gain={gain} pct={gainPct}/></div>
        <div style={{display:"flex",gap:".35rem",flexShrink:0,minWidth:"60px",justifyContent:"flex-end"}} onClick={e=>e.stopPropagation()}>
          {onAdd && <button className="btn-add" onClick={onAdd}>+ Add</button>}
          {onEdit && <button className="btn-edit" onClick={onEdit}>Edit</button>}
        </div>
      </div>
      {open && hasKids && <div className="sub-rows">{children}</div>}
    </div>
  );
}

function SubRow({label, qty, avgCost, price, value, gain, gainPct, change24h, onRemove}) {
  return (
    <div className="sub-row">
      <div style={{width:"130px",flexShrink:0}}>
        <div className="ticker">{label}</div>
        <div className="ticker-sub">{qty} @ ${Number(avgCost||0).toFixed(2)}</div>
      </div>
      <div style={{flex:1}}><span className="mono">{fmt(Number(qty)*Number(avgCost))}</span></div>
      <div style={{flex:1}}>
        <div className="mono-val">{price?fmt(price):"—"}</div>
        <Badge pct={change24h}/>
      </div>
      <div style={{flex:1}}><ReturnDisplay gain={gain} pct={gainPct}/></div>
      <button className="btn-del" onClick={onRemove}>✕</button>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const [mode, setMode] = useState("login"); // login | setup
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(true);

  useEffect(()=>{
    initFirebase().then(()=>{
      const s = lsGet(SESSION_KEY);
      if (s?.remember && s?.username) setUsername(s.username);
      if (s?.remember) setRemember(true);
      setFbLoading(false);
    });
  },[]);

  async function submit() {
    if (!username.trim()||!password) { setError("Fill in all fields"); return; }
    setError(""); setLoading(true);
    try {
      if (mode==="setup") {
        if (password.length<4) { setError("Password must be at least 4 characters"); setLoading(false); return; }
        if (password!==confirmPw) { setError("Passwords don't match"); setLoading(false); return; }
        const existing = await fbGet("vaultAuth", username.trim());
        if (existing) { setError("Username already taken — try another"); setLoading(false); return; }
        await fbSet("vaultAuth", username.trim(), {username:username.trim(), password, createdAt:Date.now()});
        lsSet(SESSION_KEY, {username:username.trim(), remember});
        onLogin(username.trim());
      } else {
        const auth = await fbGet("vaultAuth", username.trim());
        if (!auth) { setError("Account not found — create one instead"); setLoading(false); return; }
        if (auth.password !== password) { setError("Incorrect password"); setLoading(false); return; }
        lsSet(SESSION_KEY, {username:username.trim(), remember});
        onLogin(username.trim());
      }
    } catch(e) { setError("Connection error — check your internet"); setLoading(false); }
  }

  if (fbLoading) return (
    <div className="login-bg">
      <div style={{color:"rgba(255,255,255,.5)",fontSize:".85rem",fontFamily:"Inter,sans-serif"}}>Connecting…</div>
    </div>
  );

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="l-logo">VAULT<span>.</span></div>
        <div className="l-sub">{mode==="setup" ? "Create your account" : "Sign in to your account"}</div>

        <div className="f-lbl" style={{marginBottom:".3rem"}}>Username</div>
        <input className="l-inp" value={username} onChange={e=>{setUsername(e.target.value.toUpperCase());setError("");}}
          placeholder="Enter username" onKeyDown={e=>e.key==="Enter"&&submit()}/>

        <div className="f-lbl" style={{marginBottom:".3rem"}}>Password</div>
        <div className="pw-wrap">
          <input className="l-inp" type={showPw?"text":"password"} value={password}
            onChange={e=>{setPassword(e.target.value.toUpperCase());setError("");}}
            placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          <button className="pw-eye" onClick={()=>setShowPw(s=>!s)}>{showPw?"🙈":"👁"}</button>
        </div>

        {mode==="setup" && (
          <>
            <div className="f-lbl" style={{marginBottom:".3rem",marginTop:".1rem"}}>Confirm Password</div>
            <input className="l-inp" type={showPw?"text":"password"} value={confirmPw}
              onChange={e=>{setConfirmPw(e.target.value.toUpperCase());setError("");}}
              placeholder="Re-enter password" onKeyDown={e=>e.key==="Enter"&&submit()}/>
          </>
        )}

        <div className="chk-row" onClick={()=>setRemember(r=>!r)}>
          <div className={`chk-box${remember?" on":""}`}>
            {remember && <span style={{color:"#fff",fontSize:".65rem"}}>✓</span>}
          </div>
          <span className="chk-lbl">Remember my username</span>
        </div>

        {error && <div className="err-box">{error}</div>}

        <button className="l-btn" onClick={submit} disabled={loading}>
          {loading ? "Please wait…" : mode==="setup" ? "Create Account" : "Sign In"}
        </button>

        <div className="divider"/>
        <div style={{textAlign:"center",fontSize:".72rem",color:"var(--text3)",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",marginTop:".85rem"}}>
          <span style={{color:"#10b981",fontSize:"10px"}}>●</span>
          <span>Synced across all your devices via Firebase</span>
        </div>
        <div style={{textAlign:"center",marginTop:".5rem"}}>
          <span style={{fontSize:".78rem",color:"var(--text3)"}}>{mode==="login" ? "New here? " : "Have an account? "}</span>
          <button onClick={()=>{setMode(m=>m==="login"?"setup":"login");setError("");}}
            style={{background:"none",border:"none",color:"var(--blue)",cursor:"pointer",fontWeight:700,fontSize:".82rem",textDecoration:"underline"}}>
            {mode==="login"?"Create one":"Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App({username, onLogout}) {
  const [data, setData] = useState(DEFAULT_DATA);
  const [prices, setPrices] = useState({stocks:{},crypto:{},gold:null,silver:null});
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("ok"); // ok|syncing|error
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tab, setTab] = useState("Dashboard");
  const [modal, setModal] = useState(null);
  const [ready, setReady] = useState(false);
  const unsubRef = useRef(null);

  // forms
  const [stockForm, setStockForm] = useState({symbol:"",shares:"",avgCost:""});
  const [cryptoForm, setCryptoForm] = useState({symbol:"",amount:"",avgCost:""});
  const [goldForm, setGoldForm] = useState({oz:"",avgCost:""});
  const [silverForm, setSilverForm] = useState({oz:"",avgCost:""});
  const [retForm, setRetForm] = useState({k401:"",rothIra:"",pension:"",k401MyContrib:"",k401CompanyContrib:"",k401YTDMine:"",k401YTDCompany:""});
  const [cashForm, setCashForm] = useState([]);
  const [debtForm, setDebtForm] = useState([]);
  const [acctForm, setAcctForm] = useState({newUser:"",curPw:"",newPw:"",confPw:""});
  const [acctMsg, setAcctMsg] = useState({text:"",type:""});

  // Load + real-time listener
  useEffect(()=>{
    async function load() {
      try {
        const saved = await fbGet("vaultData", username);
        // Only load if this user has actually saved data before
        if (saved?.data && saved?.savedByUser === username) {
          const p = saved.data;
          setData(d=>({...DEFAULT_DATA,...p,
            gold:{...DEFAULT_DATA.gold,...p.gold},
            silver:{...DEFAULT_DATA.silver,...p.silver},
            retirement:{...DEFAULT_DATA.retirement,...p.retirement},
          }));
        }
        // If no data exists for this user, they get a clean empty slate
      } catch {}
      setReady(true);
      // Real-time listener
      if (fbListen) {
        unsubRef.current = fbListen("vaultData", username, (d)=>{
          // Only apply data if it belongs to this user
          if (d?.data && d?.savedByUser === username) {
            const p = d.data;
            setData(prev=>({...DEFAULT_DATA,...p,
              gold:{...DEFAULT_DATA.gold,...p.gold},
              silver:{...DEFAULT_DATA.silver,...p.silver},
              retirement:{...DEFAULT_DATA.retirement,...p.retirement},
            }));
          }
        });
      }
    }
    load();
    return ()=>{ if(unsubRef.current) unsubRef.current(); };
  },[username]);

  // Auto-save to Firebase whenever data changes
  const saveTimer = useRef(null);
  useEffect(()=>{
    if (!ready) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async()=>{
      setSyncStatus("syncing");
      try {
        await fbSet("vaultData", username, {data, updatedAt:Date.now(), savedByUser:username});
        setSyncStatus("ok");
      } catch { setSyncStatus("error"); }
    }, 300);
  },[data, ready]);

  // ── Fetch Prices ────────────────────────────────────────────────────────────
  const fetchPrices = useCallback(async()=>{
    setLoading(true);
    const next = {stocks:{},crypto:{},gold:null,silver:null};

    // ── Gold & Silver: try multiple free APIs ──────────────────────────────
    const fetchMetal = async (metal) => {
      // Source 1: metals.live
      try {
        const r = await fetch(`https://api.metals.live/v1/spot/${metal}`);
        if (r.ok) { const j=await r.json(); const p=j[0]?.price; if(p>100) return p; }
      } catch {}
      // Source 2: goldprice.org via allorigins
      try {
        const url = "https://data-asg.goldprice.org/dbXRates/USD";
        const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        if (r.ok) {
          const w = await r.json();
          const j = JSON.parse(w.contents);
          if (metal==="gold" && j?.items?.[0]?.xauPrice) return j.items[0].xauPrice;
          if (metal==="silver" && j?.items?.[0]?.xagPrice) return j.items[0].xagPrice;
        }
      } catch {}
      // Source 3: Exchange rate API for XAU/XAG
      try {
        const sym = metal==="gold"?"XAU":"XAG";
        const url = `https://open.er-api.com/v6/latest/${sym}`;
        const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        if (r.ok) {
          const w = await r.json();
          const j = JSON.parse(w.contents);
          if (j?.rates?.USD) return j.rates.USD;
        }
      } catch {}
      // Source 4: Yahoo Finance for GC=F (gold futures) via allorigins
      try {
        const sym = metal==="gold"?"GC%3DF":"SI%3DF";
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
        const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        if (r.ok) {
          const w = await r.json();
          const j = JSON.parse(w.contents);
          const price = j?.chart?.result?.[0]?.meta?.regularMarketPrice;
          if (price && price > 100) return price;
        }
      } catch {}
      return null;
    };

    const [gPrice, sPrice] = await Promise.all([fetchMetal("gold"), fetchMetal("silver")]);
    next.gold = gPrice;
    next.silver = sPrice;

    // ── Crypto: Multiple sources ────────────────────────────────────────────
    const cSyms = data.crypto.map(c=>c.symbol.toUpperCase());
    const cgIds = cSyms.map(s=>CRYPTO_IDS[s]).filter(Boolean);
    if (cgIds.length) {
      let fetched = false;
      // Source 1: CoinGecko direct
      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgIds.join(",")}&vs_currencies=usd&include_24hr_change=true`);
        if (r.ok) {
          const j = await r.json();
          cSyms.forEach(sym=>{ const id=CRYPTO_IDS[sym]; if(id&&j[id]) next.crypto[sym]={price:j[id].usd,change24h:j[id].usd_24h_change}; });
          fetched = Object.keys(next.crypto).length > 0;
        }
      } catch {}
      // Source 2: CoinGecko via allorigins proxy
      if (!fetched) {
        try {
          const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds.join(",")}&vs_currencies=usd&include_24hr_change=true`;
          const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
          if (r.ok) {
            const w = await r.json();
            const j = JSON.parse(w.contents);
            cSyms.forEach(sym=>{ const id=CRYPTO_IDS[sym]; if(id&&j[id]) next.crypto[sym]={price:j[id].usd,change24h:j[id].usd_24h_change}; });
            fetched = Object.keys(next.crypto).length > 0;
          }
        } catch {}
      }
      // Source 3: Binance via allorigins (works globally, no key needed)
      if (!fetched) {
        try {
          const binanceSyms = cSyms.filter(s=>["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","DOT","LINK","LTC","MATIC"].includes(s));
          await Promise.all(binanceSyms.map(async sym => {
            try {
              const pair = `${sym}USDT`;
              const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`;
              const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
              if (r.ok) {
                const w = await r.json();
                const j = JSON.parse(w.contents);
                if (j?.lastPrice && parseFloat(j.lastPrice) > 0) {
                  next.crypto[sym] = { price: parseFloat(j.lastPrice), change24h: parseFloat(j.priceChangePercent)||null };
                  fetched = true;
                }
              }
            } catch {}
          }));
        } catch {}
      }
      // Source 4: CoinCap (free, no key)
      if (!fetched) {
        try {
          for (const sym of cSyms) {
            const id = CRYPTO_IDS[sym];
            if (!id) continue;
            const r = await fetch(`https://api.coincap.io/v2/assets/${id}`);
            if (r.ok) {
              const j = await r.json();
              if (j?.data?.priceUsd > 0) {
                next.crypto[sym] = { price: parseFloat(j.data.priceUsd), change24h: parseFloat(j.data.changePercent24Hr) };
              }
            }
          }
        } catch {}
      }
    }

    // ── Stocks: Netlify serverless function (server-side, no CORS) ────────
    const sSyms = data.stocks.map(s=>s.symbol.toUpperCase());
    if (sSyms.length) {
      try {
        // Call our own Netlify function - runs server-side so Yahoo Finance works perfectly
        const r = await fetch(`/.netlify/functions/stocks?symbols=${sSyms.join(",")}`);
        if (r.ok) {
          const data2 = await r.json();
          sSyms.forEach(sym => {
            if (data2[sym]?.price > 0) next.stocks[sym] = data2[sym];
          });
        }
      } catch(e) {
        console.error("Stock fetch error:", e);
      }
    }

    setPrices(next); setLastUpdated(new Date()); setLoading(false);
  },[data.stocks,data.crypto]);

  useEffect(()=>{
    if(!ready) return;
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // auto-refresh every 60s
    return ()=>clearInterval(interval);
  },[ready]);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const goldP = prices.gold || 3300;
  const silvP = prices.silver || 33;

  const stkItems = data.stocks.map(s=>{
    const info = prices.stocks[s.symbol.toUpperCase()];
    const price = info?.price||null;
    const cost = s.avgCost*s.shares;
    const value = price ? price*s.shares : cost;
    const gain = price ? value-cost : null;
    const gainPct = (cost>0&&gain!==null) ? (gain/cost)*100 : null;
    return {...s,price,cost,value,gain,gainPct,change24h:info?.change24h??null};
  });
  const cryItems = data.crypto.map(c=>{
    const info = prices.crypto[c.symbol.toUpperCase()];
    const price = info?.price||null;
    const cost = c.avgCost*c.amount;
    const value = price ? price*c.amount : cost;
    const gain = price ? value-cost : null;
    const gainPct = (cost>0&&gain!==null) ? (gain/cost)*100 : null;
    return {...c,price,cost,value,gain,gainPct,change24h:info?.change24h??null};
  });

  const stkCost=stkItems.reduce((a,s)=>a+s.cost,0), stkVal=stkItems.reduce((a,s)=>a+s.value,0);
  const stkGain=stkCost>0?stkVal-stkCost:null, stkGainPct=stkCost>0?(stkGain/stkCost)*100:null;
  const cryCost=cryItems.reduce((a,c)=>a+c.cost,0), cryVal=cryItems.reduce((a,c)=>a+c.value,0);
  const cryGain=cryCost>0?cryVal-cryCost:null, cryGainPct=cryCost>0?(cryGain/cryCost)*100:null;
  const goldCost=(data.gold.avgCost||3300)*data.gold.oz, goldVal=goldP*data.gold.oz;
  const goldGain=data.gold.oz>0?goldVal-goldCost:null, goldGainPct=goldCost>0&&goldGain!==null?(goldGain/goldCost)*100:null;
  const silvCost=(data.silver.avgCost||33)*data.silver.oz, silvVal=silvP*data.silver.oz;
  const silvGain=data.silver.oz>0?silvVal-silvCost:null, silvGainPct=silvCost>0&&silvGain!==null?(silvGain/silvCost)*100:null;
  const cashVal=data.cash.reduce((a,c)=>a+(parseFloat(c.amount)||0),0);
  const retTotal=(parseFloat(data.retirement.k401)||0)+(parseFloat(data.retirement.rothIra)||0)+(parseFloat(data.retirement.pension)||0);
  const totalDebt=data.debt.reduce((a,d)=>a+(parseFloat(d.balance)||0),0);
  const totalCost=stkCost+cryCost+goldCost+silvCost;
  const totalInvest=stkVal+cryVal+goldVal+silvVal;
  const totalAssets=totalInvest+cashVal+retTotal;
  const netWorth=totalAssets-totalDebt;
  const totalGain=totalCost>0?totalInvest-totalCost:null;
  const totalGainPct=totalCost>0?(totalGain/totalCost)*100:null;

  const ALLOC = [
    {label:"Stocks",value:stkVal,color:"#1a56db"},
    {label:"Crypto",value:cryVal,color:"#7c3aed"},
    {label:"Gold",value:goldVal,color:"#d97706"},
    {label:"Silver",value:silvVal,color:"#64748b"},
    {label:"Retirement",value:retTotal,color:"#059669"},
    {label:"Cash",value:cashVal,color:"#0891b2"},
  ].filter(x=>x.value>0);

  // ── Table header ─────────────────────────────────────────────────────────────
  const TblHdr = (
    <div className="tbl-hdr">
      <div style={{width:"22px",flexShrink:0}}/>
      <div className="th" style={{width:"130px",flexShrink:0}}>Asset</div>
      <div className="th" style={{flex:1}}>Cost Basis</div>
      <div className="th" style={{flex:1}}>Market Value</div>
      <div className="th" style={{flex:1,textAlign:"right"}}>Return</div>
      <div style={{width:"90px",flexShrink:0}}/>
    </div>
  );

  // ── DASHBOARD ─────────────────────────────────────────────────────────────────
  function renderDashboard() {
    return (
      <div className="main">
        {/* Hero */}
        <div className="hero" style={{marginBottom:"1rem"}}>
          <div className="hero-inner">
            <div className="hero-lbl">Total Net Worth</div>
            <div className={`hero-nw ${netWorth>=0?"up":"dn"}`}>{fmtC(netWorth)}</div>
            <div className="hero-stats">
              {[
                {l:"Total Assets",v:fmtC(totalAssets)},
                {l:"Invested",v:fmtC(totalInvest)},
                {l:"Retirement",v:fmtC(retTotal)},
                {l:"Cash",v:fmtC(cashVal)},
                {l:"Total Debt",v:fmtC(totalDebt)},
              ].map(x=>(
                <div key={x.l}>
                  <div className="hs-lbl">{x.l}</div>
                  <div className="hs-val">{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio growth row */}
        <div className="card" style={{marginBottom:"1rem"}}>
          <div className="card-hdr"><span className="card-ttl">Portfolio Growth</span></div>
          <div className="growth-grid">
            {[
              {lbl:"Cost Basis",val:fmt(totalCost),cls:"neu"},
              {lbl:"Market Value",val:fmt(totalInvest),cls:"neu"},
              {lbl:"Total Return",val:totalGain!==null?fmt(totalGain):"—",cls:totalGain>=0?"up":"dn"},
              {lbl:"Return %",val:totalGainPct!==null?fmtPct(totalGainPct):"—",cls:totalGainPct>=0?"up":"dn"},
            ].map((x,i)=>(
              <div key={i} className={`gc ${x.cls}`}>
                <div className="gc-lbl">{x.lbl}</div>
                <div className={`gc-val ${x.cls}`}>{x.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation */}
        {ALLOC.length>0 && (
          <div className="card" style={{marginBottom:"1rem"}}>
            <div className="card-hdr"><span className="card-ttl">Allocation</span></div>
            <div style={{padding:"1rem 1.25rem"}}>
              <div className="alloc-bar">
                {ALLOC.map(a=><div key={a.label} className="alloc-seg" style={{width:`${(a.value/totalAssets)*100}%`,background:a.color}}/>)}
              </div>
              <div className="alloc-legend">
                {ALLOC.map(a=>(
                  <div key={a.label} className="al-item">
                    <div className="al-dot" style={{background:a.color}}/>
                    <span className="al-name">{a.label}</span>
                    <span className="al-pct">{((a.value/totalAssets)*100).toFixed(1)}%</span>
                    <span className="al-val">· {fmtC(a.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Holdings */}
        <div className="card" style={{marginBottom:"1rem"}}>
          <div className="card-hdr"><span className="card-ttl">Holdings</span></div>
          {TblHdr}
          <AssetRow icon="📈" label="Stocks" cost={stkCost} value={stkVal} gain={stkGain} gainPct={stkGainPct} onAdd={()=>setModal("addStock")}>
            {stkItems.map(s=>(
              <SubRow key={s.id} label={s.symbol} qty={s.shares} avgCost={s.avgCost} price={s.price} value={s.value} gain={s.gain} gainPct={s.gainPct} change24h={s.change24h} onRemove={()=>setData(d=>({...d,stocks:d.stocks.filter(x=>x.id!==s.id)}))}/>
            ))}
            {!stkItems.length && <div style={{padding:".8rem 3.2rem",fontSize:".73rem",color:"var(--text3)"}}>No stocks — click + Add</div>}
          </AssetRow>
          <AssetRow icon="₿" label="Crypto" cost={cryCost} value={cryVal} gain={cryGain} gainPct={cryGainPct} onAdd={()=>setModal("addCrypto")}>
            {cryItems.map(c=>(
              <SubRow key={c.id} label={c.symbol} qty={c.amount} avgCost={c.avgCost} price={c.price} value={c.value} gain={c.gain} gainPct={c.gainPct} change24h={c.change24h} onRemove={()=>setData(d=>({...d,crypto:d.crypto.filter(x=>x.id!==c.id)}))}/>
            ))}
            {!cryItems.length && <div style={{padding:".8rem 3.2rem",fontSize:".73rem",color:"var(--text3)"}}>No crypto — click + Add</div>}
          </AssetRow>
          <AssetRow icon="🥇" label="Gold" cost={goldCost} value={goldVal} gain={goldGain} gainPct={goldGainPct} onEdit={()=>{setGoldForm({oz:data.gold.oz||"",avgCost:data.gold.avgCost||""});setModal("editGold");}}>
            <div style={{padding:".6rem 1rem .6rem 3.2rem",fontSize:".73rem",color:"var(--text3)",fontFamily:"'DM Mono',monospace"}}>
              {data.gold.oz||0} oz · Live: {prices.gold?fmt(prices.gold):"fetching…"}/oz · Avg cost: ${data.gold.avgCost||0}/oz
            </div>
          </AssetRow>
          <AssetRow icon="🥈" label="Silver" cost={silvCost} value={silvVal} gain={silvGain} gainPct={silvGainPct} onEdit={()=>{setSilverForm({oz:data.silver.oz||"",avgCost:data.silver.avgCost||""});setModal("editSilver");}}>
            <div style={{padding:".6rem 1rem .6rem 3.2rem",fontSize:".73rem",color:"var(--text3)",fontFamily:"'DM Mono',monospace"}}>
              {data.silver.oz||0} oz · Live: {prices.silver?fmt(prices.silver):"fetching…"}/oz · Avg cost: ${data.silver.avgCost||0}/oz
            </div>
          </AssetRow>
          <AssetRow icon="🏦" label="Retirement" cost={retTotal} value={retTotal} gain={null} gainPct={null} onEdit={()=>{setRetForm({k401:data.retirement.k401||"",rothIra:data.retirement.rothIra||"",pension:data.retirement.pension||"",k401MyContrib:data.retirement.k401MyContrib||"",k401CompanyContrib:data.retirement.k401CompanyContrib||"",k401YTDMine:data.retirement.k401YTDMine||"",k401YTDCompany:data.retirement.k401YTDCompany||""});setModal("editRetirement");}}>
            {[["401(k) Balance",data.retirement.k401],["Roth IRA",data.retirement.rothIra],["Pension",data.retirement.pension]].map(([lbl,val])=>(
              <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:".5rem 1rem .5rem 3.2rem",fontSize:".75rem",borderBottom:"1px solid var(--border)"}}>
                <span style={{color:"var(--text2)"}}>{lbl}</span>
                <span style={{fontFamily:"'DM Mono',monospace",color:"var(--green)"}}>{fmt(parseFloat(val)||0)}</span>
              </div>
            ))}
            {(data.retirement.k401MyContrib>0||data.retirement.k401CompanyContrib>0) && (
              <div style={{padding:".6rem 1rem .6rem 3.2rem",background:"#f8fafd",borderTop:"1px solid var(--border)"}}>
                <div style={{fontSize:".65rem",fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".4rem"}}>401(k) Contributions</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:".5rem"}}>
                  {[["My Contribution/paycheck",data.retirement.k401MyContrib],["Company Match/paycheck",data.retirement.k401CompanyContrib],["My YTD Total",data.retirement.k401YTDMine],["Company YTD Total",data.retirement.k401YTDCompany]].map(([lbl,val])=>(
                    <div key={lbl} style={{background:"#fff",borderRadius:"8px",padding:".5rem .75rem",border:"1px solid var(--border)"}}>
                      <div style={{fontSize:".6rem",color:"var(--text3)",marginBottom:".15rem"}}>{lbl}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:".82rem",fontWeight:600,color:"var(--blue)"}}>{fmt(parseFloat(val)||0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AssetRow>
          <AssetRow icon="💵" label="Cash" cost={cashVal} value={cashVal} gain={0} gainPct={0} onEdit={()=>{setCashForm(data.cash.map(c=>({...c})));setModal("editCash");}}>
            {data.cash.map(c=>(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:".5rem 1rem .5rem 3.2rem",fontSize:".75rem",borderBottom:"1px solid var(--border)"}}>
                <span style={{color:"var(--text2)"}}>{c.label}</span>
                <span style={{fontFamily:"'DM Mono',monospace",color:"var(--green)"}}>{fmt(c.amount)}</span>
              </div>
            ))}
          </AssetRow>
        </div>

        {/* Debt */}
        <div className="card">
          <div className="card-hdr">
            <span className="card-ttl">Liabilities</span>
            <button className="btn-edit" onClick={()=>{setDebtForm(data.debt.map(d=>({...d})));setModal("editDebt");}}>Edit</button>
          </div>
          {data.debt.map(d=>(
            <div className="debt-row" key={d.id}>
              <div>
                <div style={{fontSize:".83rem",fontWeight:500,color:"var(--text)"}}>{d.label}</div>
                {d.monthly>0 && <div style={{fontSize:".65rem",color:"var(--text3)",marginTop:".1rem"}}>${d.monthly}/mo</div>}
              </div>
              <span style={{fontFamily:"'DM Mono',monospace",color:"var(--red)",fontWeight:600}}>{fmt(d.balance)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:".85rem 1.25rem",borderTop:"1px solid var(--border)"}}>
            <span style={{fontSize:".83rem",fontWeight:700}}>Total Debt</span>
            <span style={{fontFamily:"'DM Mono',monospace",color:"var(--red)",fontWeight:700}}>{fmt(totalDebt)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── MANAGE ────────────────────────────────────────────────────────────────────
  function renderManage() {
    return (
      <div className="main">
        <div className="mgr-grid">
          <div className="mgr-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="mgr-ttl">📈 Stocks & ETFs</span>
              <button className="btn-add" onClick={()=>setModal("addStock")}>+ Add</button>
            </div>
            {data.stocks.map(s=>(
              <div className="mgr-item" key={s.id}>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:".78rem",color:"var(--blue)",fontWeight:700}}>{s.symbol}</div>
                  <div style={{fontSize:".62rem",color:"var(--text3)"}}>{s.shares} shares @ ${s.avgCost}</div>
                </div>
                <button className="btn-del" onClick={()=>setData(d=>({...d,stocks:d.stocks.filter(x=>x.id!==s.id)}))}>✕</button>
              </div>
            ))}
            {!data.stocks.length && <div style={{fontSize:".72rem",color:"var(--text3)"}}>None added</div>}
          </div>

          <div className="mgr-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="mgr-ttl">₿ Crypto</span>
              <button className="btn-add" onClick={()=>setModal("addCrypto")}>+ Add</button>
            </div>
            {data.crypto.map(c=>(
              <div className="mgr-item" key={c.id}>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:".78rem",color:"#7c3aed",fontWeight:700}}>{c.symbol}</div>
                  <div style={{fontSize:".62rem",color:"var(--text3)"}}>{c.amount} @ ${c.avgCost}</div>
                </div>
                <button className="btn-del" onClick={()=>setData(d=>({...d,crypto:d.crypto.filter(x=>x.id!==c.id)}))}>✕</button>
              </div>
            ))}
            {!data.crypto.length && <div style={{fontSize:".72rem",color:"var(--text3)"}}>None added</div>}
          </div>

          <div className="mgr-card">
            <span className="mgr-ttl">🥇 Precious Metals</span>
            {[
              {l:"Gold",oz:data.gold.oz,avg:data.gold.avgCost,onClick:()=>{setGoldForm({oz:data.gold.oz||"",avgCost:data.gold.avgCost||""});setModal("editGold");}},
              {l:"Silver",oz:data.silver.oz,avg:data.silver.avgCost,onClick:()=>{setSilverForm({oz:data.silver.oz||"",avgCost:data.silver.avgCost||""});setModal("editSilver");}},
            ].map(m=>(
              <div className="mgr-item" key={m.l}>
                <div>
                  <div style={{fontSize:".8rem",fontWeight:500}}>{m.l}</div>
                  <div style={{fontSize:".62rem",color:"var(--text3)"}}>{m.oz||0} oz · avg ${m.avg||0}/oz</div>
                </div>
                <button className="btn-edit" onClick={m.onClick}>Edit</button>
              </div>
            ))}
          </div>

          <div className="mgr-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="mgr-ttl">🏦 Retirement</span>
              <button className="btn-edit" onClick={()=>{setRetForm({k401:data.retirement.k401||"",rothIra:data.retirement.rothIra||"",pension:data.retirement.pension||""});setModal("editRetirement");}}>Edit</button>
            </div>
            {[["401(k)",data.retirement.k401],["Roth IRA",data.retirement.rothIra],["Pension/Other",data.retirement.pension]].map(([lbl,val])=>(
              <div className="mgr-item" key={lbl}>
                <span style={{fontSize:".78rem",color:"var(--text2)"}}>{lbl}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:".78rem",color:"var(--green)"}}>{fmt(parseFloat(val)||0)}</span>
              </div>
            ))}
          </div>

          <div className="mgr-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="mgr-ttl">💵 Cash & Savings</span>
              <button className="btn-edit" onClick={()=>{setCashForm(data.cash.map(c=>({...c})));setModal("editCash");}}>Edit</button>
            </div>
            {data.cash.map(c=>(
              <div className="mgr-item" key={c.id}>
                <span style={{fontSize:".78rem",color:"var(--text2)"}}>{c.label}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:".78rem",color:"var(--green)"}}>{fmt(c.amount)}</span>
              </div>
            ))}
          </div>

          <div className="mgr-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <span className="mgr-ttl">💳 Debt</span>
              <button className="btn-edit" onClick={()=>{setDebtForm(data.debt.map(d=>({...d})));setModal("editDebt");}}>Edit</button>
            </div>
            {data.debt.map(d=>(
              <div className="mgr-item" key={d.id}>
                <div>
                  <div style={{fontSize:".78rem",fontWeight:500}}>{d.label}</div>
                  {d.monthly>0&&<div style={{fontSize:".62rem",color:"var(--text3)"}}>${d.monthly}/mo</div>}
                </div>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:".78rem",color:"var(--red)"}}>{fmt(d.balance)}</span>
              </div>
            ))}
          </div>

          {/* Account Settings */}
          <div className="acct-section">
            <div className="acct-ttl">🔐 Account Settings</div>
            <div className="acct-grid">
              <div>
                <div className="acct-sub">Change Username</div>
                <div className="f-lbl">New Username</div>
                <input className="acct-inp" value={acctForm.newUser} onChange={e=>setAcctForm(f=>({...f,newUser:e.target.value}))} placeholder="Enter new username"/>
                <div className="f-lbl">Current Password</div>
                <input className="acct-inp" type="password" value={acctForm.curPw} onChange={e=>setAcctForm(f=>({...f,curPw:e.target.value}))} placeholder="Confirm with password"/>
                <button className="acct-btn" onClick={async()=>{
                  setAcctMsg({text:"",type:""});
                  if(!acctForm.newUser.trim()){setAcctMsg({text:"Enter new username",type:"err"});return;}
                  const auth = await fbGet("vaultAuth",username);
                  if(auth.password!==acctForm.curPw){setAcctMsg({text:"Incorrect password",type:"err"});return;}
                  await fbSet("vaultAuth",acctForm.newUser.trim(),{username:acctForm.newUser.trim(),password:auth.password,createdAt:auth.createdAt});
                  setAcctMsg({text:"Username updated! Signing you out…",type:"ok"});
                  setTimeout(()=>onLogout(),1500);
                }}>Update Username</button>
              </div>
              <div>
                <div className="acct-sub">Change Password</div>
                <div className="f-lbl">Current Password</div>
                <input className="acct-inp" type="password" value={acctForm.curPw} onChange={e=>setAcctForm(f=>({...f,curPw:e.target.value}))} placeholder="Current password"/>
                <div className="f-lbl">New Password</div>
                <input className="acct-inp" type="password" value={acctForm.newPw} onChange={e=>setAcctForm(f=>({...f,newPw:e.target.value}))} placeholder="New password"/>
                <div className="f-lbl">Confirm New Password</div>
                <input className="acct-inp" type="password" value={acctForm.confPw} onChange={e=>setAcctForm(f=>({...f,confPw:e.target.value}))} placeholder="Re-enter new password"/>
                <button className="acct-btn" onClick={async()=>{
                  setAcctMsg({text:"",type:""});
                  if(acctForm.newPw.length<4){setAcctMsg({text:"Password must be at least 4 characters",type:"err"});return;}
                  if(acctForm.newPw!==acctForm.confPw){setAcctMsg({text:"Passwords don't match",type:"err"});return;}
                  const auth = await fbGet("vaultAuth",username);
                  if(auth.password!==acctForm.curPw){setAcctMsg({text:"Current password is incorrect",type:"err"});return;}
                  await fbSet("vaultAuth",username,{...auth,password:acctForm.newPw});
                  setAcctForm(f=>({...f,curPw:"",newPw:"",confPw:""}));
                  setAcctMsg({text:"Password updated successfully!",type:"ok"});
                }}>Update Password</button>
              </div>
            </div>
            {acctMsg.text && <div className={acctMsg.type==="ok"?"msg-ok":"msg-err"}>{acctMsg.text}</div>}

            {/* Delete Account */}
            <div style={{marginTop:"1.5rem",paddingTop:"1.25rem",borderTop:"1px solid var(--border)"}}>
              <div style={{fontSize:".78rem",fontWeight:600,color:"var(--red)",marginBottom:".5rem"}}>⚠️ Danger Zone</div>
              <div style={{background:"var(--red-bg)",border:"1px solid #fecaca",borderRadius:"12px",padding:"1.1rem"}}>
                <div style={{fontSize:".82rem",fontWeight:600,color:"var(--red)",marginBottom:".25rem"}}>Delete Account</div>
                <div style={{fontSize:".72rem",color:"#9f1239",marginBottom:".85rem"}}>This will permanently delete your account and ALL your financial data. This cannot be undone.</div>
                <div style={{marginBottom:".5rem"}}>
                  <div className="f-lbl" style={{color:"#9f1239"}}>Enter your password to confirm</div>
                  <input className="acct-inp" type="password" value={acctForm.curPw}
                    onChange={e=>setAcctForm(f=>({...f,curPw:e.target.value}))}
                    placeholder="Your password"
                    style={{borderColor:"#fecaca",background:"#fff"}}
                  />
                </div>
                <button onClick={async()=>{
                  setAcctMsg({text:"",type:""});
                  if(!acctForm.curPw){setAcctMsg({text:"Enter your password to confirm deletion",type:"err"});return;}
                  const auth = await fbGet("vaultAuth", username);
                  if(!auth){setAcctMsg({text:"Account not found",type:"err"});return;}
                  if(auth.password !== acctForm.curPw.toUpperCase()){setAcctMsg({text:"Incorrect password",type:"err"});return;}
                  if(!window.confirm("Are you sure? This will delete EVERYTHING permanently.")){return;}
                  try {
                    await deleteDoc(doc(db, "vaultAuth", username));
                    await deleteDoc(doc(db, "vaultData", username));
                    lsSet(SESSION_KEY, {});
                    onLogout();
                  } catch(e) {
                    setAcctMsg({text:"Failed to delete account. Try again.",type:"err"});
                  }
                }} style={{
                  background:"var(--red)",color:"#fff",border:"none",borderRadius:"8px",
                  padding:".55rem 1.1rem",fontSize:".78rem",fontWeight:700,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif",letterSpacing:".04em"
                }}>🗑 Delete My Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div>
        {/* Topbar */}
        <div className="topbar">
          <div className="logo">VAULT<span className="logo-accent">.</span></div>
          <div className="nav-pills">
            {["Dashboard","Manage"].map(t=>(
              <button key={t} className={`nav-pill${tab===t?" active":""}`} onClick={()=>setTab(t)}>{t}</button>
            ))}
          </div>
          <div className="topbar-right">
            {lastUpdated && <span style={{fontSize:".62rem",color:"rgba(255,255,255,.35)",fontFamily:"'DM Mono',monospace"}}>{lastUpdated.toLocaleTimeString()}</span>}
            <button className="ref-btn" onClick={fetchPrices} disabled={loading}>
              {loading ? <><span className="spin">⟳</span> Updating…</> : <>↻ Refresh</>}
            </button>
            <div className="user-chip">
              <div className={`dot ${syncStatus==="ok"?"dot-green":syncStatus==="syncing"?"dot-amber":"dot-red"}`}/>
              {username}
            </div>
            <button className="signout" onClick={onLogout}>Sign out</button>
          </div>
        </div>

        {tab==="Dashboard" && renderDashboard()}
        {tab==="Manage" && renderManage()}

        {/* Mobile Bottom Nav */}
        <div className="mobile-nav">
          {[
            {id:"Dashboard",icon:"📊",label:"Dashboard"},
            {id:"Manage",icon:"⚙️",label:"Manage"},
          ].map(t=>(
            <button key={t.id} className={`mob-nav-btn ${tab===t.id?"active":"inactive"}`} onClick={()=>setTab(t.id)}>
              <span className="mob-nav-icon">{t.icon}</span>
              <span className="mob-nav-lbl" style={{color:tab===t.id?"var(--blue)":"var(--text3)"}}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Modals ── */}
        {modal==="addStock" && (
          <Modal title="Add Stock or ETF" onClose={()=>setModal(null)}>
            <Field label="Ticker Symbol" value={stockForm.symbol} onChange={v=>setStockForm(f=>({...f,symbol:v}))} placeholder="NVDA, SPY, VOO…"/>
            <Field label="Shares" type="number" value={stockForm.shares} onChange={v=>setStockForm(f=>({...f,shares:v}))} placeholder="10"/>
            <Field label="Avg Cost Per Share ($)" type="number" value={stockForm.avgCost} onChange={v=>setStockForm(f=>({...f,avgCost:v}))} placeholder="150.00"/>
            <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-gho" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-pri" onClick={()=>{
                const sym = stockForm.symbol.toUpperCase().trim();
                const shares = parseFloat(stockForm.shares);
                const avgCost = parseFloat(stockForm.avgCost)||0;
                if(!sym||!shares) return;
                const newStock = {id:Date.now(),symbol:sym,shares,avgCost};
                setData(d=>{
                  // Prevent duplicate if symbol already exists
                  const exists = d.stocks.find(s=>s.symbol===sym);
                  if(exists) return d;
                  return {...d,stocks:[...d.stocks,newStock]};
                });
                setStockForm({symbol:"",shares:"",avgCost:""});
                setModal(null);
                setTimeout(fetchPrices,500);
              }}>Add Stock</button>
            </div>
          </Modal>
        )}

        {modal==="addCrypto" && (
          <Modal title="Add Crypto" onClose={()=>setModal(null)}>
            <div style={{fontSize:".68rem",color:"var(--text3)",marginBottom:".85rem"}}>Supported: {Object.keys(CRYPTO_IDS).join(" · ")}</div>
            <Field label="Symbol" value={cryptoForm.symbol} onChange={v=>setCryptoForm(f=>({...f,symbol:v}))} placeholder="BTC, ETH, SOL…"/>
            <Field label="Amount" type="number" value={cryptoForm.amount} onChange={v=>setCryptoForm(f=>({...f,amount:v}))} placeholder="0.5"/>
            <Field label="Avg Cost Per Coin ($)" type="number" value={cryptoForm.avgCost} onChange={v=>setCryptoForm(f=>({...f,avgCost:v}))} placeholder="50000"/>
            <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-gho" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-pri" onClick={()=>{
                const sym = cryptoForm.symbol.toUpperCase().trim();
                const amount = parseFloat(cryptoForm.amount);
                const avgCost = parseFloat(cryptoForm.avgCost)||0;
                if(!sym||!amount) return;
                const newCrypto = {id:Date.now(),symbol:sym,amount,avgCost};
                setData(d=>{
                  const exists = d.crypto.find(c=>c.symbol===sym);
                  if(exists) return d;
                  return {...d,crypto:[...d.crypto,newCrypto]};
                });
                setCryptoForm({symbol:"",amount:"",avgCost:""});
                setModal(null);
                setTimeout(fetchPrices,500);
              }}>Add Crypto</button>
            </div>
          </Modal>
        )}

        {modal==="editGold" && (
          <Modal title="Edit Gold Holdings" onClose={()=>setModal(null)}>
            <Field label="Ounces Held" type="number" value={goldForm.oz} onChange={v=>setGoldForm(f=>({...f,oz:v}))} placeholder="1.5"/>
            <Field label="Avg Cost Per Oz ($)" type="number" value={goldForm.avgCost} onChange={v=>setGoldForm(f=>({...f,avgCost:v}))} placeholder="1900"/>
            <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-gho" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-pri" onClick={()=>{setData(d=>({...d,gold:{oz:parseFloat(goldForm.oz)||0,avgCost:parseFloat(goldForm.avgCost)||0}}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}

        {modal==="editSilver" && (
          <Modal title="Edit Silver Holdings" onClose={()=>setModal(null)}>
            <Field label="Ounces Held" type="number" value={silverForm.oz} onChange={v=>setSilverForm(f=>({...f,oz:v}))} placeholder="10"/>
            <Field label="Avg Cost Per Oz ($)" type="number" value={silverForm.avgCost} onChange={v=>setSilverForm(f=>({...f,avgCost:v}))} placeholder="25"/>
            <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-gho" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-pri" onClick={()=>{setData(d=>({...d,silver:{oz:parseFloat(silverForm.oz)||0,avgCost:parseFloat(silverForm.avgCost)||0}}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}

        {modal==="editRetirement" && (
          <Modal title="Edit Retirement Accounts" onClose={()=>setModal(null)}>
            <div style={{fontSize:".7rem",fontWeight:700,color:"var(--blue)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".75rem"}}>Account Balances</div>
            <Field label="401(k) Total Balance ($)" type="number" value={retForm.k401} onChange={v=>setRetForm(f=>({...f,k401:v}))} placeholder="50000"/>
            <Field label="Roth IRA Balance ($)" type="number" value={retForm.rothIra} onChange={v=>setRetForm(f=>({...f,rothIra:v}))} placeholder="15000"/>
            <Field label="Pension / Other ($)" type="number" value={retForm.pension} onChange={v=>setRetForm(f=>({...f,pension:v}))} placeholder="0"/>
            <div style={{height:"1px",background:"var(--border)",margin:"1rem 0"}}/>
            <div style={{fontSize:".7rem",fontWeight:700,color:"var(--blue)",textTransform:"uppercase",letterSpacing:".08em",marginBottom:".75rem"}}>401(k) Contribution Tracking</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".5rem"}}>
              <Field label="My contribution per paycheck ($)" type="number" value={retForm.k401MyContrib} onChange={v=>setRetForm(f=>({...f,k401MyContrib:v}))} placeholder="200"/>
              <Field label="Company match per paycheck ($)" type="number" value={retForm.k401CompanyContrib} onChange={v=>setRetForm(f=>({...f,k401CompanyContrib:v}))} placeholder="100"/>
              <Field label="My YTD contributions ($)" type="number" value={retForm.k401YTDMine} onChange={v=>setRetForm(f=>({...f,k401YTDMine:v}))} placeholder="2400"/>
              <Field label="Company YTD match ($)" type="number" value={retForm.k401YTDCompany} onChange={v=>setRetForm(f=>({...f,k401YTDCompany:v}))} placeholder="1200"/>
            </div>
            <div style={{background:"#f0f7ff",border:"1px solid #bfdbfe",borderRadius:"10px",padding:".75rem",marginTop:".75rem",fontSize:".72rem",color:"#1d4ed8"}}>
              💡 YTD 2025 limit: <strong>$23,500</strong> employee · <strong>$46,750</strong> combined (with employer match)
            </div>
            <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button className="btn-gho" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-pri" onClick={()=>{setData(d=>({...d,retirement:{k401:parseFloat(retForm.k401)||0,rothIra:parseFloat(retForm.rothIra)||0,pension:parseFloat(retForm.pension)||0,k401MyContrib:parseFloat(retForm.k401MyContrib)||0,k401CompanyContrib:parseFloat(retForm.k401CompanyContrib)||0,k401YTDMine:parseFloat(retForm.k401YTDMine)||0,k401YTDCompany:parseFloat(retForm.k401YTDCompany)||0}}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}

        {modal==="editCash" && (
          <Modal title="Edit Cash & Savings" onClose={()=>setModal(null)}>
            {cashForm.map((c,i)=>(
              <div key={c.id} style={{display:"flex",gap:".5rem",alignItems:"flex-start"}}>
                <div style={{flex:1}}><Field label="Account" value={c.label} onChange={v=>setCashForm(f=>f.map((x,j)=>j===i?{...x,label:v}:x))} placeholder="Checking"/></div>
                <div style={{flex:1}}><Field label="Balance ($)" type="number" value={c.amount} onChange={v=>setCashForm(f=>f.map((x,j)=>j===i?{...x,amount:v}:x))} placeholder="0"/></div>
                <button className="btn-del" onClick={()=>setCashForm(f=>f.filter(x=>x.id!==c.id))} style={{marginTop:"1.4rem"}}>✕</button>
              </div>
            ))}
            <button className="btn-gho" style={{fontSize:".73rem",padding:".35rem .75rem",marginBottom:".85rem"}} onClick={()=>setCashForm(f=>[...f,{id:Date.now(),label:"",amount:""}])}>+ Add Account</button>
            <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end"}}>
              <button className="btn-gho" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-pri" onClick={()=>{setData(d=>({...d,cash:cashForm.map(c=>({...c,amount:parseFloat(c.amount)||0}))}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}

        {modal==="editDebt" && (
          <Modal title="Edit Debt" onClose={()=>setModal(null)}>
            {debtForm.map((d,i)=>(
              <div key={d.id} style={{background:"var(--bg)",borderRadius:"10px",padding:".85rem",marginBottom:".65rem",border:"1px solid var(--border)"}}>
                <div style={{display:"flex",gap:".5rem",alignItems:"flex-start"}}>
                  <div style={{flex:2}}><Field label="Name" value={d.label} onChange={v=>setDebtForm(f=>f.map((x,j)=>j===i?{...x,label:v}:x))} placeholder="Car Loan"/></div>
                  <button className="btn-del" onClick={()=>setDebtForm(f=>f.filter(x=>x.id!==d.id))} style={{marginTop:"1.4rem"}}>✕</button>
                </div>
                <div style={{display:"flex",gap:".5rem"}}>
                  <div style={{flex:1}}><Field label="Balance ($)" type="number" value={d.balance} onChange={v=>setDebtForm(f=>f.map((x,j)=>j===i?{...x,balance:v}:x))} placeholder="5000"/></div>
                  <div style={{flex:1}}><Field label="Monthly ($)" type="number" value={d.monthly} onChange={v=>setDebtForm(f=>f.map((x,j)=>j===i?{...x,monthly:v}:x))} placeholder="200"/></div>
                </div>
              </div>
            ))}
            <button className="btn-gho" style={{fontSize:".73rem",padding:".35rem .75rem",marginBottom:".85rem"}} onClick={()=>setDebtForm(f=>[...f,{id:Date.now(),label:"",balance:"",monthly:""}])}>+ Add Debt</button>
            <div style={{display:"flex",gap:".5rem",justifyContent:"flex-end"}}>
              <button className="btn-gho" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-pri" onClick={()=>{setData(d=>({...d,debt:debtForm.map(x=>({...x,balance:parseFloat(x.balance)||0,monthly:parseFloat(x.monthly)||0}))}));setModal(null);}}>Save</button>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Root() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(()=>{
    const s = lsGet(SESSION_KEY);
    if (s?.username) { setUsername(s.username); setLoggedIn(true); }
  },[]);

  function handleLogin(u) { setUsername(u); setLoggedIn(true); }
  function handleLogout() { lsSet(SESSION_KEY,{}); setLoggedIn(false); setUsername(""); }

  if (!loggedIn) return <><style>{CSS}</style><LoginScreen onLogin={handleLogin}/></>;
  return <App username={username} onLogout={handleLogout}/>;
}
