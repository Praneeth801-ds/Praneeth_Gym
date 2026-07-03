import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";
import * as api from "./api";


/* ═══════════════════════════════════════════════════════════
   MOCK DATA & STATE
═══════════════════════════════════════════════════════════ */
const INITIAL_CLIENTS = [
  {
    id: "c1", name: "Ananya Krishnan", email: "ananya@email.com", password: "pass",
    role: "client", trainerId: "t1",
    profile: { weight: 72, targetWeight: 62, startDate: "2025-01-15", endDate: "2025-07-15", plan: "Elite", feesPaid: 18000 },
    progressPhotos: [
      { date: "2025-01-15", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop", note: "Day 1 - Let's do this!" },
      { date: "2025-06-01", url: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=800&auto=format&fit=crop", note: "Feeling much stronger now." }
    ],
    weightLog: [
      { date: "2025-06-05", weight: 71.8, sleep: 7, water: 2.8, calories: 1840, note: "Felt strong today" },
      { date: "2025-06-06", weight: 71.5, sleep: 7.5, water: 3.0, calories: 1790, note: "Yoga session" },
      { date: "2025-06-07", weight: 71.2, sleep: 8, water: 3.2, calories: 1820, note: "Rest day" },
      { date: "2025-06-08", weight: 71.0, sleep: 7, water: 2.9, calories: 1850, note: "HIIT + Core" },
    ],
    dietPlan: {
      assigned: true,
      createdAt: "2025-05-20",
      meals: [
        { time: "7:00 AM", label: "Breakfast", items: "Oats with berries + 2 boiled eggs", calories: 380, protein: "28g" },
        { time: "10:30 AM", label: "Mid-Morning", items: "Banana + 10 almonds", calories: 180, protein: "5g" },
        { time: "1:00 PM", label: "Lunch", items: "Brown rice + dal + salad + curd", calories: 520, protein: "22g" },
        { time: "4:00 PM", label: "Snack", items: "Protein shake + apple", calories: 220, protein: "25g" },
        { time: "7:30 PM", label: "Dinner", items: "Grilled chicken + veggies + 2 chapati", calories: 480, protein: "38g" },
      ],
      notes: "Avoid processed sugar. Drink at least 3L water daily. Pre-workout: banana 30min before session.",
    },
    messages: [
      { from: "t1", text: "Hey Ananya! How are you feeling after yesterday's session?", ts: "2025-06-07T09:00:00" },
      { from: "c1", text: "Feeling great! A bit sore in the shoulders though.", ts: "2025-06-07T09:05:00" },
      { from: "t1", text: "That's normal! Take an ice pack tonight. See you tomorrow 💪", ts: "2025-06-07T09:07:00" },
    ],
  },
  {
    id: "c2", name: "Vikram Desai", email: "vikram@email.com", password: "pass",
    role: "client", trainerId: "t1",
    profile: { weight: 85, targetWeight: 78, startDate: "2025-02-01", endDate: "2025-08-01", plan: "Pro", feesPaid: 11994 },
    progressPhotos: [],
    weightLog: [
      { date: "2025-06-06", weight: 84.1, sleep: 6, water: 3.0, calories: 2100, note: "Leg day 🔥" },
      { date: "2025-06-07", weight: 83.8, sleep: 7, water: 3.5, calories: 2050, note: "Push day" },
      { date: "2025-06-08", weight: 83.5, sleep: 6.5, water: 3.2, calories: 2200, note: "Pull day" },
    ],
    dietPlan: {
      assigned: true,
      createdAt: "2025-04-10",
      meals: [
        { time: "7:00 AM", label: "Breakfast", items: "Moong dal chilla + egg whites + black coffee", calories: 420, protein: "35g" },
        { time: "10:30 AM", label: "Mid-Morning", items: "Greek yogurt + walnuts", calories: 200, protein: "12g" },
        { time: "1:00 PM", label: "Lunch", items: "Chicken rice bowl + grilled vegetables", calories: 680, protein: "45g" },
        { time: "4:00 PM", label: "Pre-Workout", items: "Sweet potato + peanut butter", calories: 260, protein: "8g" },
        { time: "7:30 PM", label: "Dinner", items: "Fish curry + brown rice + salad", calories: 560, protein: "42g" },
      ],
      notes: "High protein diet. Post-workout whey shake within 30 mins. Weekly cheat meal allowed Saturday night.",
    },
    messages: [
      { from: "c2", text: "Coach, can I shift tomorrow's session to 8AM?", ts: "2025-06-08T18:00:00" },
      { from: "t1", text: "Sure! 8AM works. Don't skip the warm-up.", ts: "2025-06-08T18:15:00" },
    ],
  },
  {
    id: "c3", name: "Meera Joshi", email: "meera@email.com", password: "pass",
    role: "client", trainerId: "t2",
    profile: { weight: 58, targetWeight: 55, startDate: "2025-03-10", endDate: "2025-09-10", plan: "Elite", feesPaid: 18000 },
    progressPhotos: [],
    weightLog: [
      { date: "2025-06-07", weight: 56.2, sleep: 8, water: 2.5, calories: 1600, note: "Morning yoga ✨" },
      { date: "2025-06-08", weight: 56.0, sleep: 8.5, water: 2.8, calories: 1650, note: "Felt energised" },
    ],
    dietPlan: { assigned: false, createdAt: null, meals: [], notes: "" },
    messages: [],
  },
];

const INITIAL_TRAINERS = [
  { id: "t1", name: "Rohan Mehta", email: "rohan@fit4life.com", password: "pass", role: "trainer", specialization: "Strength & Conditioning", experience: "8 years", rating: 4.9 },
  { id: "t2", name: "Kavya Iyer", email: "kavya@fit4life.com", password: "pass", role: "trainer", specialization: "Yoga & Wellness", experience: "10 years", rating: 4.8 },
];

/* ═══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
═══════════════════════════════════════════════════════════ */
function getClientProgress(client) {
  const startW = client.profile.weight;
  const targetW = client.profile.targetWeight;
  const log = client.weightLog;
  const currentW = log.length > 0 ? log[log.length - 1].weight : startW;
  const lost = +(startW - currentW).toFixed(1);
  const progress = startW === targetW ? 100 : Math.max(0, Math.min(100, Math.round(((startW - currentW) / (startW - targetW)) * 100)));
  return { startW, targetW, currentW, lost, progress };
}

/* ═══════════════════════════════════════════════════════════
   PDF GENERATOR (via print iframe)
═══════════════════════════════════════════════════════════ */
function generateDietPDF(client, dietPlan) {
  const total = dietPlan.meals.reduce((s, m) => s + m.calories, 0);
  const html = `
    <html><head><title>Diet Plan — ${client.name}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;color:#111;padding:40px;max-width:700px;margin:0 auto}
      h1{font-size:28px;font-weight:900;letter-spacing:-1px;margin-bottom:4px}
      .brand{color:#7cfc00;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:32px}
      .meta{display:flex;gap:32px;padding:20px;background:#f7f7f7;border-radius:10px;margin-bottom:32px}
      .meta-item label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#777;display:block}
      .meta-item span{font-size:15px;font-weight:700}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{text-align:left;padding:10px 14px;background:#111;color:#7cfc00;font-size:12px;letter-spacing:1px;text-transform:uppercase}
      td{padding:12px 14px;border-bottom:1px solid #eee;font-size:14px}
      tr:nth-child(even) td{background:#fafafa}
      .total-row td{font-weight:700;background:#f0f0f0}
      .notes{padding:20px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;font-size:14px;line-height:1.7}
      .footer{margin-top:40px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:20px}
    </style></head><body>
    <div class="brand">FIT4LIFE</div>
    <h1>Personalised Diet Plan</h1>
    <p style="color:#666;margin-bottom:24px">Prepared specifically for ${client.name}</p>
    <div class="meta">
      <div class="meta-item"><label>Client</label><span>${client.name}</span></div>
      <div class="meta-item"><label>Plan</label><span>${client.profile.plan}</span></div>
      <div class="meta-item"><label>Created</label><span>${dietPlan.createdAt}</span></div>
      <div class="meta-item"><label>Total Daily Calories</label><span>${total} kcal</span></div>
    </div>
    <table>
      <thead><tr><th>Time</th><th>Meal</th><th>Food Items</th><th>Calories</th><th>Protein</th></tr></thead>
      <tbody>
        ${dietPlan.meals.map(m => `<tr><td>${m.time}</td><td><strong>${m.label}</strong></td><td>${m.items}</td><td>${m.calories} kcal</td><td>${m.protein}</td></tr>`).join("")}
        <tr class="total-row"><td colspan="3" style="text-align:right">Total</td><td>${total} kcal</td><td>—</td></tr>
      </tbody>
    </table>
    ${dietPlan.notes ? `<div class="notes"><strong>📝 Trainer Notes:</strong><br/>${dietPlan.notes}</div>` : ""}
    <div class="footer">Fit4Life · Confidential Diet Plan for ${client.name} · Do not distribute</div>
    </body></html>`;
  const win = window.open("", "_blank");
  if (!win) {
    alert("Pop-up blocked! Please allow pop-ups for this site to generate PDFs.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

/* ═══════════════════════════════════════════════════════════
   STYLES (injected once)
═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#000000;--s1:#111111;--s2:#1A1A1A;--s3:#222222;
  --border:#333333;--border2:#444444;
  --lime:#FF2A5F;--lime2:#FF003C;--teal:#00E676;
  --red:#FF3333;--amber:#FFB800;
  --text:#FFFFFF;--text2:#B3B3B3;--text3:#808080;
  --r:8px;--r2:12px;--r3:16px;
  --shadow:0 8px 30px rgba(0,0,0,.6);
}
html,body{height:100%;background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;font-size:15px;line-height:1.5}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:var(--s1)}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}

/* ── NAV ── */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;background:rgba(0,0,0,.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
.nav-logo{font-family:'Montserrat',sans-serif;font-size:24px;font-weight:900;letter-spacing:-1px;color:var(--text);cursor:pointer;text-transform:uppercase}
.nav-logo span{color:var(--lime)}
.nav-right{display:flex;gap:10px;align-items:center}
.nav-user{display:flex;align-items:center;gap:10px}
.nav-avatar{width:34px;height:34px;border-radius:50%;background:var(--lime);color:#FFF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;font-family:'Montserrat',sans-serif}
.nav-name{font-size:14px;font-weight:600;font-family:'Montserrat',sans-serif}
.nav-role{font-size:11px;color:var(--text2);font-family:'JetBrains Mono',monospace;letter-spacing:.5px}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;gap:7px;padding:12px 24px;border-radius:9999px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .2s;font-family:'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:1px}
.btn-primary{background:var(--lime);color:#FFF}
.btn-primary:hover{background:var(--lime2);transform:scale(1.02)}
.btn-ghost{background:transparent;border:2px solid var(--border2);color:var(--text)}
.btn-ghost:hover{border-color:var(--lime);color:var(--lime)}
.btn-danger{background:rgba(255,51,51,.1);border:1px solid rgba(255,51,51,.3);color:var(--red)}
.btn-danger:hover{background:rgba(255,51,51,.2)}
.btn-teal{background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.3);color:var(--teal)}
.btn-teal:hover{background:rgba(0,230,118,.2)}
.btn-sm{padding:8px 16px;font-size:11px}
.btn-icon{width:34px;height:34px;padding:0;justify-content:center;border-radius:50%}
.btn:disabled{opacity:.4;pointer-events:none}

/* ── FORMS ── */
.form-group{margin-bottom:18px}
.form-label{display:block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text2);margin-bottom:7px;font-family:'Montserrat',sans-serif}
.form-input,.form-textarea,.form-select{width:100%;padding:12px 16px;background:var(--s3);border:1.5px solid var(--border);border-radius:var(--r);color:var(--text);font-size:14px;font-family:'Inter',sans-serif;outline:none;transition:border-color .15s}
.form-input:focus,.form-textarea:focus,.form-select:focus{border-color:var(--lime)}
.form-textarea{resize:vertical;min-height:90px}
.form-select option{background:var(--s3)}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}

/* ── LAYOUT ── */
.page{padding-top:64px;min-height:100vh}
.container{max-width:1160px;margin:0 auto;padding:0 24px}
.dash-layout{display:grid;grid-template-columns:240px 1fr;min-height:calc(100vh - 64px)}

/* ── SIDEBAR ── */
.sidebar{background:var(--s1);border-right:1px solid var(--border);padding:28px 16px;position:sticky;top:64px;height:calc(100vh - 64px);overflow-y:auto}
.sidebar-section{margin-bottom:28px}
.sidebar-label{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--text3);padding:0 12px;margin-bottom:12px;font-family:'Montserrat',sans-serif}
.sidebar-item{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:var(--r);cursor:pointer;font-size:14px;font-weight:600;color:var(--text2);transition:all .15s;border:none;background:none;width:100%;text-align:left;font-family:'Inter',sans-serif}
.sidebar-item:hover{background:var(--s3);color:var(--text)}
.sidebar-item.active{background:rgba(255,42,95,.1);color:var(--lime);border:1px solid rgba(255,42,95,.2)}
.sidebar-item .icon{font-size:16px;width:20px;text-align:center}
.sidebar-badge{margin-left:auto;background:var(--lime);color:#FFF;font-size:10px;font-weight:800;padding:2px 8px;border-radius:100px}

/* ── MAIN CONTENT ── */
.main{padding:28px 32px;overflow-y:auto}
.page-header{margin-bottom:32px}
.page-title{font-family:'Montserrat',sans-serif;font-size:28px;font-weight:900;letter-spacing:-0.5px;color:var(--text);text-transform:uppercase}
.page-sub{font-size:14px;color:var(--text2);margin-top:6px;font-weight:500}

/* ── CARDS ── */
.card{background:var(--s2);border:1px solid var(--border);border-radius:var(--r2);padding:24px;box-shadow:var(--shadow)}
.card-sm{padding:18px}
.card-title{font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text);margin-bottom:16px;font-family:'Montserrat',sans-serif}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}

/* ── METRICS ── */
.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.metric{background:var(--s2);border:1px solid var(--border);border-radius:var(--r2);padding:20px;transition:transform .2s}
.metric:hover{transform:translateY(-2px);border-color:var(--border2)}
.metric-label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text2);margin-bottom:8px;font-family:'Montserrat',sans-serif}
.metric-value{font-family:'Montserrat',sans-serif;font-size:36px;font-weight:900;letter-spacing:-1px;line-height:1;color:var(--text)}
.metric-sub{font-size:12px;color:var(--text3);margin-top:8px;font-weight:500}

/* ── TABLE ── */
.table-wrap{overflow-x:auto;border-radius:var(--r2);border:1px solid var(--border);background:var(--s2)}
table{width:100%;border-collapse:collapse}
thead tr{background:var(--s3)}
th{text-align:left;padding:14px 16px;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--text2);white-space:nowrap;font-family:'Montserrat',sans-serif}
td{padding:16px;border-top:1px solid var(--border);font-size:14px;vertical-align:middle}
tbody tr{transition:background .15s}
tbody tr:hover{background:var(--s3);cursor:pointer}
.row-avatar{width:36px;height:36px;border-radius:50%;background:var(--s1);border:2px solid var(--lime);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;font-family:'Montserrat',sans-serif;color:#FFF;flex-shrink:0}

/* ── BADGE / CHIP ── */
.badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:100px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;font-family:'Montserrat',sans-serif}
.badge-green{background:rgba(255,42,95,.15);color:var(--lime);border:1px solid rgba(255,42,95,.3)}
.badge-teal{background:rgba(0,230,118,.15);color:var(--teal);border:1px solid rgba(0,230,118,.3)}
.badge-red{background:rgba(255,51,51,.15);color:var(--red);border:1px solid rgba(255,51,51,.3)}
.badge-amber{background:rgba(255,184,0,.15);color:var(--amber);border:1px solid rgba(255,184,0,.3)}
.badge-gray{background:var(--s3);color:var(--text2);border:1px solid var(--border)}

/* ── PROGRESS ── */
.progress-wrap{display:flex;align-items:center;gap:10px}
.progress-bar{height:6px;background:var(--s1);border-radius:10px;flex:1;overflow:hidden;border:1px solid var(--border)}
.progress-fill{height:100%;border-radius:10px;transition:width .4s}
.progress-label{font-size:12px;font-weight:700;width:34px;text-align:right;font-family:'JetBrains Mono',monospace;color:var(--text)}

/* ── MODAL ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);padding:20px}
.modal{background:var(--s1);border:1px solid var(--border);border-radius:var(--r3);padding:0;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow)}
.modal-lg{max-width:780px}
.modal-head{padding:32px 32px 0;display:flex;justify-content:space-between;align-items:flex-start}
.modal-body{padding:24px 32px 32px}
.modal-title{font-family:'Montserrat',sans-serif;font-size:24px;font-weight:900;text-transform:uppercase}
.modal-sub{font-size:14px;color:var(--text2);margin-top:4px;font-weight:500}
.modal-close{background:var(--s3);border:none;color:var(--text);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:.2s;flex-shrink:0}
.modal-close:hover{background:var(--lime);color:#FFF}
.modal-tabs{display:flex;border-bottom:1px solid var(--border);margin:24px 0}
.modal-tab{flex:1;padding:14px;text-align:center;cursor:pointer;font-size:13px;font-weight:700;color:var(--text2);border-bottom:3px solid transparent;background:none;border-left:none;border-right:none;border-top:none;font-family:'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:1px;transition:.2s}
.modal-tab.active{color:var(--lime);border-bottom-color:var(--lime)}

/* ── AUTH ── */
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden;background:var(--bg)}
.auth-bg{position:absolute;inset:0;background:radial-gradient(circle at top right, rgba(255,42,95,0.15) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(0,230,118,0.05) 0%, transparent 50%)}
.auth-card{background:var(--s1);border:1px solid var(--border);border-radius:var(--r3);padding:48px;width:100%;max-width:480px;position:relative;z-index:1;box-shadow:0 12px 40px rgba(0,0,0,0.8)}
.auth-logo{font-family:'Montserrat',sans-serif;font-size:32px;font-weight:900;color:var(--text);text-align:center;margin-bottom:8px;text-transform:uppercase;letter-spacing:-1px}
.auth-logo span{color:var(--lime)}
.auth-tagline{text-align:center;font-size:14px;color:var(--text2);margin-bottom:32px;letter-spacing:.5px;font-weight:500;text-transform:uppercase}
.role-toggle{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px}
.role-btn{padding:16px;border:2px solid var(--border);border-radius:var(--r2);text-align:center;cursor:pointer;transition:all .2s;background:var(--s2)}
.role-btn:hover{border-color:var(--border2);background:var(--s3)}
.role-btn.selected{border-color:var(--lime);background:rgba(255,42,95,.08)}
.role-btn .role-icon{font-size:28px;display:block;margin-bottom:8px}
.role-btn .role-title{font-size:14px;font-weight:800;color:var(--text);font-family:'Montserrat',sans-serif;text-transform:uppercase}
.role-btn .role-desc{font-size:12px;color:var(--text3);margin-top:4px}
.role-btn.selected .role-title{color:var(--lime)}
.auth-divider{text-align:center;font-size:12px;color:var(--text3);margin:24px 0;position:relative}
.auth-divider::before{content:'';position:absolute;top:50%;left:0;right:0;height:1px;background:var(--border)}
.auth-divider span{background:var(--s1);padding:0 16px;position:relative;font-weight:600;text-transform:uppercase;letter-spacing:1px}
.auth-switch{text-align:center;font-size:14px;color:var(--text2);margin-top:24px}
.auth-switch button{background:none;border:none;color:var(--lime);font-weight:700;cursor:pointer;font-size:14px;text-transform:uppercase;letter-spacing:.5px}
.error-msg{background:rgba(255,51,51,.1);border:1px solid rgba(255,51,51,.3);border-radius:var(--r);padding:12px 16px;font-size:13px;font-weight:600;color:var(--red);margin-bottom:20px;text-align:center}

/* ── CLIENT LIST ── */
.client-row{cursor:pointer}
.client-name{font-weight:700;font-size:15px}
.client-email{font-size:13px;color:var(--text3);margin-top:2px}

/* ── CLIENT DETAIL ── */
.detail-header{display:flex;gap:24px;align-items:center;margin-bottom:32px;flex-wrap:wrap}
.detail-avatar{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--lime),#FF003C);color:#FFF;display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-size:26px;font-weight:900;flex-shrink:0;box-shadow:0 4px 12px rgba(255,42,95,0.4)}
.detail-info{flex:1}
.detail-name{font-family:'Montserrat',sans-serif;font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase}
.detail-meta{font-size:14px;color:var(--text2);margin-top:6px;font-weight:500}
.detail-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:32px}
.ds{background:var(--s2);border:1px solid var(--border);border-radius:var(--r2);padding:20px}
.ds-label{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:8px;font-family:'Montserrat',sans-serif}
.ds-value{font-family:'Montserrat',sans-serif;font-size:32px;font-weight:900;letter-spacing:-1px}
.ds-unit{font-size:14px;font-family:'Inter',sans-serif;font-weight:600;color:var(--text2)}
.detail-tabs{display:flex;gap:4px;background:var(--s2);border-radius:9999px;padding:6px;margin-bottom:28px;border:1px solid var(--border)}
.detail-tab{flex:1;padding:12px;text-align:center;border-radius:9999px;cursor:pointer;font-size:12px;font-weight:800;color:var(--text2);border:none;background:none;transition:.2s;font-family:'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:1px}
.detail-tab.active{background:var(--s3);color:var(--text);box-shadow:0 2px 8px rgba(0,0,0,0.3)}

/* ── WEIGHT LOG ── */
.log-grid{display:flex;flex-direction:column;gap:12px}
.log-item{display:grid;grid-template-columns:90px repeat(5,1fr);gap:16px;align-items:center;padding:16px;background:var(--s2);border:1px solid var(--border);border-radius:var(--r2);transition:transform .15s}
.log-item:hover{transform:translateY(-2px);border-color:var(--border2)}
.log-date{font-size:13px;font-weight:700;color:var(--lime);font-family:'JetBrains Mono',monospace}
.log-field{font-size:14px}
.log-field .lf-val{font-weight:700}
.log-field .lf-key{font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;display:block;margin-top:4px;font-weight:600}

/* ── DIET ── */
.meal-row{display:grid;grid-template-columns:90px 100px 1fr 80px 60px;gap:16px;align-items:center;padding:16px;border-bottom:1px solid var(--border)}
.meal-row:last-child{border-bottom:none}
.meal-time{font-size:13px;font-family:'JetBrains Mono',monospace;color:var(--lime);font-weight:600}
.meal-label{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text);font-family:'Montserrat',sans-serif}
.meal-items{font-size:14px;color:var(--text2)}
.meal-cal{font-size:13px;font-weight:700;font-family:'JetBrains Mono',monospace}
.meal-protein{font-size:13px;color:var(--teal);font-family:'JetBrains Mono',monospace;font-weight:700}
.diet-total{display:flex;gap:32px;padding:18px 24px;background:var(--s2);border-radius:0 0 var(--r2) var(--r2);border-top:1px solid var(--border)}
.diet-total-item{font-size:14px;font-weight:800;font-family:'Montserrat',sans-serif;text-transform:uppercase}
.diet-total-item span{color:var(--text3);font-weight:600;margin-right:6px}
.diet-notes{margin-top:20px;padding:20px;background:rgba(255,184,0,.08);border:1px solid rgba(255,184,0,.2);border-radius:var(--r2);font-size:14px;line-height:1.7;color:var(--text2)}
.diet-notes strong{color:var(--amber);font-weight:700;text-transform:uppercase;font-family:'Montserrat',sans-serif;font-size:12px;letter-spacing:1px}

/* ── CHAT ── */
.chat-wrap{display:flex;flex-direction:column;height:500px}
.chat-messages{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:16px;padding:20px;background:var(--s1);border:1px solid var(--border);border-radius:var(--r2) var(--r2) 0 0}
.msg{max-width:75%;display:flex;flex-direction:column;gap:4px}
.msg.mine{align-self:flex-end;align-items:flex-end}
.msg.theirs{align-self:flex-start;align-items:flex-start}
.msg-bubble{padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.6;word-break:break-word}
.msg.mine .msg-bubble{background:var(--lime);color:#FFF;border-radius:16px 16px 4px 16px;font-weight:500}
.msg.theirs .msg-bubble{background:var(--s2);border:1px solid var(--border);border-radius:16px 16px 16px 4px;font-weight:400}
.msg-ts{font-size:11px;color:var(--text3);font-family:'JetBrains Mono',monospace}
.chat-input-row{display:flex;gap:12px;padding:16px;background:var(--s2);border:1px solid var(--border);border-top:none;border-radius:0 0 var(--r2) var(--r2)}
.chat-input{flex:1;min-width:0;padding:12px 16px;background:var(--s1);border:1.5px solid var(--border);border-radius:9999px;color:var(--text);font-size:14px;font-family:'Inter',sans-serif;outline:none}
.chat-input:focus{border-color:var(--lime)}

/* ── PLAN CARD ── */
.plan-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:28px}
.pi-item{background:var(--s2);border:1px solid var(--border);border-radius:var(--r2);padding:20px}
.pi-label{font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:8px;font-family:'Montserrat',sans-serif}
.pi-value{font-size:18px;font-weight:800;color:var(--text)}
.pi-value.fees{color:var(--lime)}
.pi-value.date{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:600}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .nav{padding:0 16px}
  .dash-layout{grid-template-columns:1fr; padding-bottom:60px}
  .sidebar{display:flex;flex-direction:row;position:fixed;bottom:0;left:0;right:0;height:60px;padding:0;z-index:100;border-right:none;border-top:1px solid var(--border);justify-content:space-around;align-items:center;background:var(--s1);overflow-x:auto;overflow-y:hidden}
  .sidebar-section{display:contents}
  .sidebar-label{display:none}
  .sidebar-item{flex:1;flex-direction:column;padding:8px 4px;justify-content:center;border-radius:0;font-size:10px;gap:4px;text-align:center;height:100%}
  .sidebar-item .icon{font-size:18px}
  .sidebar-item.active{border:none;border-top:2px solid var(--lime);background:rgba(255,42,95,.05)}
  .sidebar-badge{display:none}
  .metrics-grid{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:600px){
  .main{padding:20px 16px}
  .auth-card{padding:24px 20px; border-radius:var(--r2)}
  .auth-page{padding:12px}
  .metrics-grid{grid-template-columns:1fr}
  .form-row,.form-row-3{grid-template-columns:1fr}
  .meal-row{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
  .meal-time{font-size:14px;margin-bottom:4px}
  .meal-label{font-size:15px}
  .diet-total{flex-direction:column;gap:12px}
  .log-item{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
  .log-date{font-size:14px;margin-bottom:4px}
  .log-field{display:flex;justify-content:space-between;width:100%}
  .log-field .lf-key{margin-top:0;font-size:11px}
  .detail-header{flex-direction:column;align-items:center;gap:16px;text-align:center}
  .detail-stats{grid-template-columns:1fr 1fr}
  .modal{max-width:100%;height:100%;border-radius:0;max-height:100vh}
  .overlay{padding:0}
  .modal-head{padding:20px 20px 0}
  .modal-body{padding:20px}
  .hide-desktop{display:block;}
  .hide-mobile{display:none !important;}
}
.hide-desktop{display:none;}

/* ── MISC ── */
.flex-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.flex-end{display:flex;justify-content:flex-end;gap:12px;margin-top:24px}
.text-lime{color:var(--lime)}
.text-teal{color:var(--teal)}
.text-red{color:var(--red)}
.text-amber{color:var(--amber)}
.text-muted{color:var(--text2)}
.mono{font-family:'JetBrains Mono',monospace}
.empty-state{text-align:center;padding:56px 24px;color:var(--text3)}
.empty-state .es-icon{font-size:48px;display:block;margin-bottom:16px;color:var(--text2)}
.toast-container{position:fixed;bottom:32px;right:32px;z-index:999;display:flex;flex-direction:column;gap:12px}
.toast{background:var(--s2);border:1px solid var(--border);border-radius:var(--r2);padding:14px 20px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.5);animation:toast-in .3s cubic-bezier(0.175, 0.885, 0.32, 1.275);display:flex;align-items:center;gap:10px}
@keyframes toast-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.toast.success{border-left:4px solid var(--lime)}
.toast.error{border-left:4px solid var(--red)}

/* ── LANDING PAGE ── */
.landing-page{min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;background:#000}
.landing-bg{position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(255,42,95,.15) 0%,transparent 50%),radial-gradient(circle at 30% 80%,rgba(0,230,118,.1) 0%,transparent 50%);z-index:0}
.landing-nav{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:24px 48px;border-bottom:1px solid rgba(255,255,255,.05)}
.landing-nav-logo{font-family:'Montserrat',sans-serif;font-size:26px;font-weight:900;color:#FFF;letter-spacing:-1px;text-transform:uppercase}
.landing-nav-logo span{color:var(--lime)}
.landing-nav-links{display:flex;gap:36px;align-items:center}
.landing-nav-link{font-size:14px;font-weight:700;color:var(--text2);text-decoration:none;transition:color .2s;text-transform:uppercase;letter-spacing:1px;font-family:'Montserrat',sans-serif}
.landing-nav-link:hover{color:#FFF}
.landing-hero{position:relative;z-index:10;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 24px}
.landing-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 20px;background:rgba(255,42,95,.1);border:1px solid rgba(255,42,95,.3);border-radius:9999px;font-size:12px;font-weight:800;color:var(--lime);margin-bottom:32px;backdrop-filter:blur(10px);text-transform:uppercase;letter-spacing:1px;font-family:'Montserrat',sans-serif}
.landing-title{font-family:'Montserrat',sans-serif;font-size:84px;font-weight:900;line-height:1;letter-spacing:-3px;max-width:1000px;margin-bottom:32px;color:#FFF;text-transform:uppercase}
.landing-title span{color:var(--lime)}
.landing-subtitle{font-size:20px;color:var(--text2);max-width:640px;margin-bottom:56px;line-height:1.6;font-weight:500}
.landing-cta{display:flex;gap:20px;align-items:center}
.btn-landing{padding:20px 40px;font-size:16px;border-radius:9999px;font-weight:800}
.landing-features{position:relative;z-index:10;display:grid;grid-template-columns:repeat(3,1fr);gap:32px;padding:0 48px 100px;max-width:1240px;margin:0 auto}
.landing-feature{background:rgba(20,20,20,.8);border:1px solid rgba(255,255,255,.05);border-radius:24px;padding:40px;backdrop-filter:blur(20px);transition:all .3s}
.landing-feature:hover{transform:translateY(-8px);border-color:rgba(255,42,95,.4);box-shadow:0 12px 40px rgba(255,42,95,.15)}
.lf-icon{width:56px;height:56px;border-radius:16px;background:var(--lime);color:#FFF;display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:24px;box-shadow:0 4px 16px rgba(255,42,95,.4)}
.lf-title{font-family:'Montserrat',sans-serif;font-size:22px;font-weight:900;margin-bottom:12px;text-transform:uppercase;letter-spacing:-0.5px}
.lf-desc{font-size:15px;color:var(--text2);line-height:1.6;font-weight:400}

@media(max-width:900px){
  .landing-title{font-size:42px}
  .landing-hero{padding:60px 16px}
  .landing-features{grid-template-columns:1fr;padding:0 16px 60px}
  .landing-nav{padding:16px 20px; flex-direction:column; gap:16px}
  .landing-nav-links{gap:12px; flex-wrap:wrap; justify-content:center}
  .landing-nav-link{font-size:12px}
  .landing-subtitle{font-size:16px; margin-bottom:40px}
}

/* ── PHOTO GALLERY ── */
.photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px}
.photo-card{position:relative;border-radius:var(--r2);overflow:hidden;background:var(--s2);border:1px solid var(--border);aspect-ratio:3/4;cursor:pointer;transition:all .3s}
.photo-card:hover{transform:translateY(-4px);border-color:var(--lime);box-shadow:0 8px 24px rgba(255,42,95,.2)}
.photo-card img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.photo-card:hover img{transform:scale(1.08)}
.photo-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,0) 60%);display:flex;flex-direction:column;justify-content:flex-end;padding:20px;opacity:0;transition:opacity .3s}
.photo-card:hover .photo-overlay{opacity:1}
.photo-date{font-size:12px;font-family:'JetBrains Mono',monospace;color:var(--lime);font-weight:700;margin-bottom:6px}
.photo-note{font-size:14px;color:var(--text);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-weight:500}
`;

if (typeof document !== 'undefined') {
  let styleEl = document.getElementById('fit4life-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'fit4life-styles';
    styleEl.innerHTML = CSS;
    document.head.appendChild(styleEl);
  } else {
    styleEl.innerHTML = CSS;
  }
}

/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === "success" ? "✓" : "!"}</span> {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════════════════ */
function AuthPage({ onLogin, onRegister, onBack }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("client");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", trainerId: "" });
  const [error, setError] = useState("");
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    if (mode === "register" && role === "client") {
      api.getTrainers().then(setTrainers).catch(console.error);
    }
  }, [mode, role]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    setError("");
    if (mode === "login") {
      const result = await onLogin(form.email.trim(), form.password, role);
      if (!result) setError("Login failed.");
    } else {
      if (!form.name || !form.email || !form.password) { setError("Please fill all fields."); return; }
      if (form.password !== form.confirm) { setError("Passwords don't match."); return; }
      await onRegister({ ...form, role });
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        {onBack && (
          <button className="btn btn-ghost btn-sm" style={{ position: "absolute", top: 16, left: 16, border: "none", padding: "4px 8px" }} onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="auth-logo">FIT<span>4LIFE</span></div>
        <div className="auth-tagline">Train harder. Live better.</div>

        <div className="role-toggle">
          {[
            { id: "client", icon: "🏃", title: "Member", desc: "Track your progress" },
            { id: "trainer", icon: "💪", title: "Trainer", desc: "Manage your clients" },
          ].map(r => (
            <div key={r.id} className={`role-btn ${role === r.id ? "selected" : ""}`} onClick={() => setRole(r.id)}>
              <span className="role-icon">{r.icon}</span>
              <div className="role-title">{r.title}</div>
              <div className="role-desc">{r.desc}</div>
            </div>
          ))}
        </div>

        <div className="modal-tabs" style={{ margin: "0 0 22px" }}>
          <button className={`modal-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
          <button className={`modal-tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setError(""); }}>Create Account</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {mode === "register" && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Arjun Sharma" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
        </div>
          {role === "client" && mode === "register" && (
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Select a Trainer</label>
              <select className="form-input" value={form.trainerId} onChange={e => set("trainerId", e.target.value)}>
                <option value="">No Trainer (Self-Guided)</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
          )}
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Enter password" value={form.password} onChange={e => set("password", e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        {mode === "register" && (
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={e => set("confirm", e.target.value)} />
          </div>
        )}

        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={handleSubmit}>
          {mode === "login" ? "Sign In →" : "Create Account →"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DIET PLAN EDITOR (Trainer only)
═══════════════════════════════════════════════════════════ */
function DietEditorModal({ client, onSave, onClose }) {
  const [meals, setMeals] = useState(
    client.dietPlan.meals.length > 0
      ? client.dietPlan.meals.map(m => ({ ...m }))
      : [
          { time: "7:00 AM", label: "Breakfast", items: "", calories: 0, protein: "0g" },
          { time: "1:00 PM", label: "Lunch", items: "", calories: 0, protein: "0g" },
          { time: "7:30 PM", label: "Dinner", items: "", calories: 0, protein: "0g" },
        ]
  );
  const [notes, setNotes] = useState(client.dietPlan.notes || "");

  const setMeal = (i, k, v) => setMeals(ms => ms.map((m, idx) => idx === i ? { ...m, [k]: k === "calories" ? Number(v) : v } : m));
  const addMeal = () => setMeals(ms => [...ms, { time: "", label: "Snack", items: "", calories: 0, protein: "0g" }]);
  const removeMeal = i => setMeals(ms => ms.filter((_, idx) => idx !== i));

  return (
    <div className="overlay" onClick={e => e.target.classList.contains("overlay") && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-head">
          <div>
            <div className="modal-title">Edit Diet Plan</div>
            <div className="modal-sub">{client.name}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="card-title">Meals</div>
          <div style={{ borderRadius: "var(--r)", overflow: "hidden", border: "1px solid var(--border)", marginBottom: 16 }}>
            <div className="hide-mobile" style={{ display: "grid", gridTemplateColumns: "90px 100px 1fr 70px 60px 32px", gap: 10, padding: "10px 12px", background: "var(--s3)" }}>
              {["Time", "Label", "Food Items", "Calories", "Protein", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text3)" }}>{h}</div>
              ))}
            </div>
            {meals.map((m, i) => (
              <div key={i} className="meal-edit-row">
                <input className="form-input" style={{ fontSize: 12, padding: "7px 10px" }} value={m.time} onChange={e => setMeal(i, "time", e.target.value)} placeholder="7:00 AM" />
                <input className="form-input" style={{ fontSize: 12, padding: "7px 10px" }} value={m.label} onChange={e => setMeal(i, "label", e.target.value)} placeholder="Breakfast" />
                <input className="form-input" style={{ fontSize: 13, padding: "7px 10px" }} value={m.items} onChange={e => setMeal(i, "items", e.target.value)} placeholder="Oats + eggs..." />
                <input className="form-input" style={{ fontSize: 12, padding: "7px 10px" }} type="number" value={m.calories} onChange={e => setMeal(i, "calories", e.target.value)} />
                <input className="form-input" style={{ fontSize: 12, padding: "7px 10px" }} value={m.protein} onChange={e => setMeal(i, "protein", e.target.value)} placeholder="30g" />
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeMeal(i)} style={{ fontSize: 14 }}>✕</button>
              </div>
            ))}
            <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-ghost btn-sm" onClick={addMeal}>+ Add Meal</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Trainer Notes</label>
            <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Hydration tips, supplement timing, cheat meal guidance..." />
          </div>

          <div className="flex-end">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave(meals, notes)}>Save & Assign Diet Plan</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DIET PLAN VIEW (Shared by trainer detail + client view)
═══════════════════════════════════════════════════════════ */
function DietPlanView({ dietPlan, client, isTrainer, onEdit }) {
  if (!dietPlan.assigned || dietPlan.meals.length === 0) {
    return (
      <div className="no-diet">
        <span className="nd-icon">🍽️</span>
        <p>{isTrainer ? "No diet plan assigned yet. Create one for this client." : "Your trainer hasn't assigned a diet plan yet. Check back soon!"}</p>
        {isTrainer && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onEdit}>Create Diet Plan</button>}
      </div>
    );
  }

  const total = dietPlan.meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = dietPlan.meals.reduce((s, m) => s + parseInt(m.protein || "0"), 0);

  return (
    <div>
      <div className="card-header">
        <div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 4 }}>Last updated: {dietPlan.createdAt}</div>
          <div className="flex-row">
            <span className="badge badge-green">Active Plan</span>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>{dietPlan.meals.length} meals · {total} kcal/day</span>
          </div>
        </div>
        <div className="flex-row">
          {isTrainer && <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️ Edit Plan</button>}
          <button className="btn btn-teal btn-sm" onClick={() => generateDietPDF(client, dietPlan)}>⬇ Export PDF</button>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <div className="hide-mobile" style={{ display: "grid", gridTemplateColumns: "90px 100px 1fr 80px 60px", gap: 12, padding: "10px 16px", background: "var(--s3)" }}>
          {["Time", "Meal", "Food Items", "Calories", "Protein"].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text3)" }}>{h}</div>
          ))}
        </div>
        {dietPlan.meals.map((m, i) => (
          <div key={i} className="meal-row">
            <div className="meal-time">{m.time}</div>
            <div className="meal-label">{m.label}</div>
            <div className="meal-items">{m.items}</div>
            <div className="meal-cal">{m.calories} kcal</div>
            <div className="meal-protein">{m.protein}</div>
          </div>
        ))}
        <div className="diet-total">
          <div className="diet-total-item"><span>Total</span>{total} kcal</div>
          <div className="diet-total-item"><span>Protein</span>~{totalProtein}g</div>
          <div className="diet-total-item"><span>Meals</span>{dietPlan.meals.length}</div>
        </div>
      </div>

      {dietPlan.notes && (
        <div className="diet-notes">
          <strong>📝 Trainer Notes: </strong>{dietPlan.notes}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAT COMPONENT  (loads from DB, polls every 5s)
═══════════════════════════════════════════════════════════ */
function ChatBox({ otherUserId, currentUserId, onSend, otherName }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  const loadMsgs = useCallback(async () => {
    if (!otherUserId) return;
    try {
      const data = await api.getMessages(otherUserId);
      // Normalize DB fields to {from, text, ts}
      setMessages(data.map(m => ({ from: m.sender_id, text: m.text, ts: m.created_at })));
    } catch(e) {}
  }, [otherUserId]);

  useEffect(() => {
    loadMsgs();
    const interval = setInterval(loadMsgs, 5000);
    return () => clearInterval(interval);
  }, [loadMsgs]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!text.trim()) return;
    const txt = text.trim();
    setText("");
    await onSend(txt);
    await loadMsgs();
  }

  const fmtTime = ts => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-wrap">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <span className="es-icon">💬</span>
            <p>No messages yet. Say hello to {otherName}!</p>
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.from === currentUserId;
          return (
            <div key={i} className={`msg ${mine ? "mine" : "theirs"}`}>
              {!mine && <div className="chat-sender">{otherName}</div>}
              <div className="msg-bubble">{m.text}</div>
              <div className="msg-ts">{fmtTime(m.ts)}</div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder={`Message ${otherName}...`}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button className="btn btn-primary" onClick={send} disabled={!text.trim()}>Send</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WEIGHT LOG FORM (Client)
═══════════════════════════════════════════════════════════ */
function WeightLogModal({ onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, weight: "", sleep: "", water: "", calories: "", note: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function submit() {
    if (!form.weight) return;
    onSave({
      date: form.date,
      weight: parseFloat(form.weight),
      sleep: parseFloat(form.sleep) || 0,
      water: parseFloat(form.water) || 0,
      calories: parseInt(form.calories) || 0,
      note: form.note,
    });
  }

  return (
    <div className="overlay" onClick={e => e.target.classList.contains("overlay") && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-title">Log Today's Metrics</div>
            <div className="modal-sub">Track your daily progress</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Weight (kg) *</label>
              <input className="form-input" type="number" step="0.1" placeholder="71.5" value={form.weight} onChange={e => set("weight", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Calories Consumed</label>
              <input className="form-input" type="number" placeholder="1800" value={form.calories} onChange={e => set("calories", e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sleep (hours)</label>
              <input className="form-input" type="number" step="0.5" placeholder="7.5" value={form.sleep} onChange={e => set("sleep", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Water Intake (L)</label>
              <input className="form-input" type="number" step="0.1" placeholder="3.0" value={form.water} onChange={e => set("water", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input className="form-input" placeholder="How did you feel? Any workout notes..." value={form.note} onChange={e => set("note", e.target.value)} />
          </div>
          <div className="flex-end">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={!form.weight}>Save Entry</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLIENT DETAIL (Trainer view)
═══════════════════════════════════════════════════════════ */
function ClientDetail({ client, trainer, onBack, onUpdateClient, currentUserId, addToast }) {
  const [tab, setTab] = useState("overview");
  const [showDietEditor, setShowDietEditor] = useState(false);
  const [dietPdfFile, setDietPdfFile] = useState(null);
  const [dietPdfNotes, setDietPdfNotes] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  async function handleDietPdfUpload() {
    if (!dietPdfFile) return;
    setUploadingPdf(true);
    try {
      const result = await api.uploadDietPlan(client.id, dietPdfFile, dietPdfNotes);
      onUpdateClient({ ...client, dietPlan: { ...client.dietPlan, assigned: true, pdf_url: result.pdf_url, notes: dietPdfNotes } });
      setDietPdfFile(null);
      setDietPdfNotes("");
      addToast("Diet plan PDF uploaded ✓", "success");
    } catch(e) {
      addToast("Failed to upload diet plan: " + (e.message || "Unknown error"), "error");
    } finally {
      setUploadingPdf(false);
    }
  }

  const profile = client.profile;
  const { startW, currentW, lost, progress } = getClientProgress(client);

  function saveDiet(meals, notes) {
    const updated = {
      ...client,
      dietPlan: { assigned: true, createdAt: new Date().toISOString().slice(0, 10), meals, notes },
    };
    onUpdateClient(updated);
    setShowDietEditor(false);
    addToast("Diet plan saved and assigned ✓", "success");
  }

  async function sendMessage(text) {
    try {
      await api.sendMessage(client.id, text);
    } catch(e) {
      addToast("Failed to send message", "error");
    }
  }

  return (
    <div>
      {showDietEditor && <DietEditorModal client={client} onSave={saveDiet} onClose={() => setShowDietEditor(false)} />}

      <div className="flex-row" style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Clients</button>
      </div>

      <div className="detail-header">
        <div className="detail-avatar">{client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
        <div className="detail-info">
          <div className="detail-name">{client.name}</div>
          <div className="detail-meta">{client.email} · {profile.plan} Plan</div>
          <div className="flex-row" style={{ marginTop: 10 }}>
            <span className="badge badge-green">Active</span>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>Since {profile.startDate}</span>
          </div>
        </div>
      </div>

      <div className="detail-stats">
        <div className="ds"><div className="ds-label">Start Weight</div><div className="ds-value">{profile.weight}<span className="ds-unit"> kg</span></div></div>
        <div className="ds"><div className="ds-label">Current Weight</div><div className="ds-value" style={{ color: "var(--lime)" }}>{currentW}<span className="ds-unit"> kg</span></div></div>
        <div className="ds"><div className="ds-label">Target</div><div className="ds-value" style={{ color: "var(--teal)" }}>{profile.targetWeight}<span className="ds-unit"> kg</span></div></div>
        <div className="ds"><div className="ds-label">Lost</div><div className="ds-value" style={{ color: lost >= 0 ? "var(--lime)" : "var(--red)" }}>{lost >= 0 ? "-" : "+"}{Math.abs(lost)}<span className="ds-unit"> kg</span></div></div>
        <div className="ds">
          <div className="ds-label">Progress</div>
          <div className="ds-value">{progress}<span className="ds-unit">%</span></div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${Math.max(0, progress)}%`, background: "var(--lime)" }} />
          </div>
        </div>
      </div>

      {/* Plan Info — fees visible to trainer */}
      <div className="plan-info">
        <div className="pi-item"><div className="pi-label">Plan</div><div className="pi-value">{profile.plan}</div></div>
        <div className="pi-item"><div className="pi-label">Start Date</div><div className="pi-value date">{profile.startDate}</div></div>
        <div className="pi-item"><div className="pi-label">End Date</div><div className="pi-value date">{profile.endDate}</div></div>
        <div className="pi-item"><div className="pi-label">Fees Paid</div><div className="pi-value fees">₹{profile.feesPaid.toLocaleString("en-IN")}</div></div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {[["tracking", "📊 Tracking Log"], ["diet", "🥗 Diet Plan"], ["photos", "📸 Photos"], ["chat", "💬 Chat"]].map(([id, label]) => (
          <button key={id} className={`detail-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "tracking" && (
        <div className="card">
          <div className="card-title">Daily Tracking Log</div>
          {client.weightLog.length === 0 ? (
            <div className="empty-state"><span className="es-icon">📋</span><p>No tracking entries yet.</p></div>
          ) : (
            <div className="log-grid">
              <div className="hide-mobile" style={{ display: "grid", gridTemplateColumns: "90px repeat(5,1fr)", gap: 12, padding: "8px 16px" }}>
                {["Date", "Weight", "Calories", "Sleep", "Water", "Notes"].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text3)" }}>{h}</div>
                ))}
              </div>
              {[...client.weightLog].reverse().map((l, i) => (
                <div key={i} className="log-item">
                  <div className="log-date">{l.date}</div>
                  <div className="log-field"><div className="lf-val">{l.weight} kg</div><span className="lf-key hide-desktop">Weight</span></div>
                  <div className="log-field"><div className="lf-val">{l.calories || "—"} kcal</div><span className="lf-key hide-desktop">Calories</span></div>
                  <div className="log-field"><div className="lf-val">{l.sleep || "—"} hrs</div><span className="lf-key hide-desktop">Sleep</span></div>
                  <div className="log-field"><div className="lf-val">{l.water || "—"} L</div><span className="lf-key hide-desktop">Water</span></div>
                  <div className="log-field"><div className="lf-val" style={{ fontSize: 12, color: "var(--text2)" }}>{l.note || "—"}</div><span className="lf-key hide-desktop">Note</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "diet" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">🥗 Diet Plan</div>
          </div>

          {/* Existing meals diet plan */}
          <DietPlanView dietPlan={client.dietPlan} client={client} isTrainer={true} onEdit={() => setShowDietEditor(true)} />

          {/* PDF Diet Plan Upload */}
          <div style={{ marginTop: 24, padding: "20px", background: "var(--s3)", borderRadius: "var(--r)", border: "1.5px dashed var(--border)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text1)", marginBottom: 12 }}>
              📄 Upload PDF Diet Plan
              {client.dietPlan?.pdf_url && <span style={{ marginLeft: 10, color: "var(--lime)", fontSize: 12 }}>✓ PDF already uploaded</span>}
            </div>
            {client.dietPlan?.pdf_url && (
              <div style={{ marginBottom: 12 }}>
                <a href={client.dietPlan.pdf_url} target="_blank" rel="noreferrer"
                  className="btn btn-ghost btn-sm" style={{ marginRight: 8 }}>👁 Preview Current PDF</a>
                <a href={client.dietPlan.pdf_url} download className="btn btn-ghost btn-sm">⬇ Download</a>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Select PDF File</label>
              <input type="file" accept=".pdf" className="form-input"
                onChange={e => setDietPdfFile(e.target.files[0] || null)}
                style={{ padding: "8px" }} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes for {client.name.split(' ')[0]} (optional)</label>
              <input className="form-input" placeholder="e.g. High protein, avoid processed sugar..."
                value={dietPdfNotes} onChange={e => setDietPdfNotes(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleDietPdfUpload}
              disabled={!dietPdfFile || uploadingPdf}>
              {uploadingPdf ? "Uploading..." : "Upload Diet Plan PDF"}
            </button>
          </div>
        </div>
      )}

      {tab === "photos" && (
        <div className="card">
          <div className="card-title">Progress Photos</div>
          {!client.progressPhotos || client.progressPhotos.length === 0 ? (
            <div className="empty-state"><span className="es-icon">📸</span><p>No photos uploaded yet.</p></div>
          ) : (
            <div className="photo-grid">
              {client.progressPhotos.map((p, i) => (
                <div key={i} className="photo-card">
                  <img src={p.url} alt={`Progress on ${p.date}`} />
                  <div className="photo-overlay">
                    <div className="photo-date">{p.date}</div>
                    {p.note && <div className="photo-note">{p.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "chat" && (
        <div className="card">
          <div className="card-title">Chat with {client.name}</div>
          <ChatBox otherUserId={client.id} currentUserId={trainer.id} onSend={sendMessage} otherName={client.name} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRAINER DASHBOARD
═══════════════════════════════════════════════════════════ */
function TrainerDashboard({ trainer, clients, onUpdateClient, addToast }) {
  const [view, setView] = useState("clients");
  const [selectedClientId, setSelectedClientId] = useState(null);

  const myClients = useMemo(() => clients.filter(c => c.trainerId === trainer.id), [clients, trainer.id]);
  const selectedClient = useMemo(() => myClients.find(c => c.id === selectedClientId), [myClients, selectedClientId]);

  const totalFees = useMemo(() => myClients.reduce((s, c) => s + c.profile.feesPaid, 0), [myClients]);
  const avgProgress = useMemo(() => {
    if (myClients.length === 0) return 0;
    const totalProg = myClients.reduce((s, c) => {
      return s + (getClientProgress(c).progress || 0);
    }, 0);
    return Math.round(totalProg / myClients.length);
  }, [myClients]);

  function openClientChat(clientId) {
    setSelectedClientId(clientId);
    setView("client-detail");
  }

  return (
    <div className="dash-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">Overview</div>
          <button className={`sidebar-item ${view === "clients" ? "active" : ""}`} onClick={() => { setView("clients"); setSelectedClientId(null); }}>
            <span className="icon">👥</span> My Clients
            <span className="sidebar-badge">{myClients.length}</span>
          </button>
          <button className={`sidebar-item ${view === "earnings" ? "active" : ""}`} onClick={() => setView("earnings")}>
            <span className="icon">💰</span> Earnings
          </button>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">Clients</div>
          {myClients.map(c => (
            <button key={c.id} className={`sidebar-item ${selectedClientId === c.id ? "active" : ""}`}
              onClick={() => { setSelectedClientId(c.id); setView("client-detail"); }}>
              <span className="icon">🏃</span>
              <span style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="main">
        {view === "clients" && !selectedClient && (
          <>
            <div className="page-header">
              <div className="page-title">My Clients</div>
              <div className="page-sub">Manage training, diet plans, and progress</div>
            </div>

            <div className="metrics-grid">
              <div className="metric"><div className="metric-label">Total Clients</div><div className="metric-value" style={{ color: "var(--lime)" }}>{myClients.length}</div><div className="metric-sub">Active sessions</div></div>
              <div className="metric"><div className="metric-label">Avg Progress</div><div className="metric-value" style={{ color: "var(--teal)" }}>{avgProgress}%</div><div className="metric-sub">Toward goals</div></div>
              <div className="metric"><div className="metric-label">Diet Plans</div><div className="metric-value" style={{ color: "var(--amber)" }}>{myClients.filter(c => c.dietPlan.assigned).length}/{myClients.length}</div><div className="metric-sub">Assigned</div></div>
              <div className="metric"><div className="metric-label">Total Revenue</div><div className="metric-value" style={{ color: "var(--lime)", fontSize: 26 }}>₹{totalFees.toLocaleString("en-IN")}</div><div className="metric-sub">All clients</div></div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Current Weight</th>
                    <th>Target</th>
                    <th>Progress</th>
                    <th>Plan Period</th>
                    <th>Fees Paid</th>
                    <th>Diet</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myClients.map(c => {
                    const { currentW: curr, progress: prog } = getClientProgress(c);
                    return (
                      <tr key={c.id} className="client-row" onClick={() => { setSelectedClientId(c.id); setView("client-detail"); }}>
                        <td>
                          <div className="flex-row" style={{ gap: 10 }}>
                            <div className="row-avatar">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                            <div>
                              <div className="client-name">{c.name}</div>
                              <div className="client-email">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="mono">{curr} kg</td>
                        <td className="mono">{c.profile.targetWeight} kg</td>
                        <td>
                          <div className="progress-wrap">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${prog}%`, background: prog > 70 ? "var(--lime)" : prog > 40 ? "var(--amber)" : "var(--teal)" }} />
                            </div>
                            <span className="progress-label">{prog}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }} className="mono">{c.profile.startDate} → {c.profile.endDate}</td>
                        <td className="text-lime mono" style={{ fontWeight: 700 }}>₹{c.profile.feesPaid.toLocaleString("en-IN")}</td>
                        <td>{c.dietPlan.assigned ? <span className="badge badge-green">Assigned</span> : <span className="badge badge-gray">Pending</span>}</td>
                        <td><span className="badge badge-teal">{c.profile.plan}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === "client-detail" && selectedClient && (
          <ClientDetail
            client={selectedClient}
            trainer={trainer}
            onBack={() => { setView("clients"); setSelectedClientId(null); }}
            onUpdateClient={onUpdateClient}
            currentUserId={trainer.id}
            addToast={addToast}
          />
        )}

        {view === "earnings" && (
          <>
            <div className="page-header">
              <div className="page-title">Earnings</div>
              <div className="page-sub">Fee collection from all active clients</div>
            </div>
            <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              <div className="metric"><div className="metric-label">Total Collected</div><div className="metric-value text-lime" style={{ fontSize: 28 }}>₹{totalFees.toLocaleString("en-IN")}</div></div>
              <div className="metric"><div className="metric-label">Active Clients</div><div className="metric-value">{myClients.length}</div></div>
              <div className="metric"><div className="metric-label">Avg per Client</div><div className="metric-value" style={{ fontSize: 26 }}>₹{myClients.length > 0 ? Math.round(totalFees / myClients.length).toLocaleString("en-IN") : 0}</div></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Client</th><th>Plan</th><th>Start Date</th><th>End Date</th><th>Fees Paid</th></tr>
                </thead>
                <tbody>
                  {myClients.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex-row" style={{ gap: 10 }}>
                          <div className="row-avatar">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                          <div><div className="client-name">{c.name}</div><div className="client-email">{c.email}</div></div>
                        </div>
                      </td>
                      <td><span className="badge badge-teal">{c.profile.plan}</span></td>
                      <td className="mono" style={{ fontSize: 13 }}>{c.profile.startDate}</td>
                      <td className="mono" style={{ fontSize: 13 }}>{c.profile.endDate}</td>
                      <td className="text-lime mono" style={{ fontWeight: 700, fontSize: 15 }}>₹{c.profile.feesPaid.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLIENT DASHBOARD
═══════════════════════════════════════════════════════════ */
function ClientDashboard({ client, trainer, onUpdateClient, addToast }) {
  const [view, setView] = useState("overview");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const profile = client.profile;
  const log = client.weightLog;

  const { currentW, lost, progress, loggedToday } = useMemo(() => {
    const { currentW: curr, lost: l, progress: prog } = getClientProgress(client);
    const today = new Date().toISOString().slice(0, 10);
    const isLogged = log.some(l => l.date === today);
    return { currentW: curr, lost: l, progress: prog, loggedToday: isLogged };
  }, [client, log, profile.weight, profile.targetWeight]);

  async function addLogEntry(entry) {
    try {
      const saved = await api.addLog(entry);
      const updated = { ...client, weightLog: [...client.weightLog, saved] };
      onUpdateClient(updated);
      setShowLogModal(false);
      addToast("Daily log saved ✓", "success");
    } catch (e) {
      addToast("Failed to save log", "error");
    }
  }

  async function addPhotoEntry(entry) {
    try {
      addToast("Uploading photo...", "success");
      let url = entry.url;
      if (entry.file) {
        url = await api.uploadPhoto(entry.file, client.id);
      }
      const saved = await api.addPhotoRecord({ date: entry.date, note: entry.note, url });
      const updated = { ...client, progressPhotos: [...(client.progressPhotos || []), saved] };
      onUpdateClient(updated);
      setShowPhotoModal(false);
      addToast("Photo uploaded successfully ✓", "success");
    } catch (e) {
      console.error("Photo upload error:", e?.message || e?.error_description || JSON.stringify(e));
      addToast("Failed to upload photo: " + (e?.message || e?.error_description || "Unknown error"), "error");
    }
  }

  async function sendMessage(text) {
    if (!trainer?.id) return;
    try {
      await api.sendMessage(trainer.id, text);
    } catch(e) {
      addToast("Failed to send message", "error");
    }
  }

  const trainerName = trainer ? trainer.name : "Your Trainer";

  return (
    <div className="dash-layout">
      {showLogModal && <WeightLogModal onSave={addLogEntry} onClose={() => setShowLogModal(false)} />}
      {showPhotoModal && <PhotoUploadModal onSave={addPhotoEntry} onClose={() => setShowPhotoModal(false)} />}

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">My Dashboard</div>
          <button className={`sidebar-item ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}><span className="icon">📊</span> Overview</button>
          <button className={`sidebar-item ${view === "tracking" ? "active" : ""}`} onClick={() => setView("tracking")}><span className="icon">📋</span> My Log</button>
          <button className={`sidebar-item ${view === "photos" ? "active" : ""}`} onClick={() => setView("photos")}><span className="icon">📸</span> Photos</button>
          <button className={`sidebar-item ${view === "diet" ? "active" : ""}`} onClick={() => setView("diet")}><span className="icon">🥗</span> Diet Plan</button>
          <button className={`sidebar-item ${view === "chat" ? "active" : ""}`} onClick={() => setView("chat")}><span className="icon">💬</span> Chat
            {client.messages.length > 0 && <span className="sidebar-badge">{client.messages.filter(m => m.from !== client.id).length}</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        {view === "overview" && (
          <>
            <div className="page-header flex-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="page-title">Hey, {client.name.split(" ")[0]} 👋</div>
                <div className="page-sub">Trainer: {trainerName} · {profile.plan} Plan</div>
              </div>
              <button className="btn btn-primary" onClick={() => setShowLogModal(true)} disabled={loggedToday}>
                {loggedToday ? "✓ Logged Today" : "+ Log Today"}
              </button>
            </div>

            <div className="metrics-grid">
              <div className="metric"><div className="metric-label">Current Weight</div><div className="metric-value text-lime">{currentW}<span style={{ fontSize: 18, fontWeight: 400 }}> kg</span></div></div>
              <div className="metric"><div className="metric-label">Weight Lost</div><div className="metric-value" style={{ color: lost >= 0 ? "var(--lime)" : "var(--red)" }}>{lost >= 0 ? "-" : "+"}{Math.abs(lost)}<span style={{ fontSize: 18, fontWeight: 400 }}> kg</span></div></div>
              <div className="metric">
                <div className="metric-label">Goal Progress</div>
                <div className="metric-value text-teal">{progress}%</div>
                <div className="progress-bar" style={{ marginTop: 8 }}><div className="progress-fill" style={{ width: `${progress}%`, background: "var(--teal)" }} /></div>
              </div>
              <div className="metric"><div className="metric-label">Days Left</div><div className="metric-value text-amber">{Math.max(0, Math.ceil((new Date(profile.endDate) - new Date()) / 86400000))}</div><div className="metric-sub">Plan ends {profile.endDate}</div></div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">My Subscription</div>
                <span className="badge badge-green">Active</span>
              </div>
              <div className="plan-info" style={{ marginBottom: 0 }}>
                <div className="pi-item"><div className="pi-label">Plan</div><div className="pi-value">{profile.plan}</div></div>
                <div className="pi-item"><div className="pi-label">Start Date</div><div className="pi-value date">{profile.startDate}</div></div>
                <div className="pi-item"><div className="pi-label">End Date</div><div className="pi-value date">{profile.endDate}</div></div>
                <div className="pi-item"><div className="pi-label">Trainer</div><div className="pi-value" style={{ fontSize: 14 }}>{trainerName}</div></div>
              </div>
            </div>

            {log.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-title">Recent Log Entries</div>
                <div className="log-grid">
                  {[...log].reverse().slice(0, 3).map((l, i) => (
                    <div key={i} className="log-item">
                      <div className="log-date">{l.date}</div>
                      <div className="log-field"><div className="lf-val">{l.weight} kg</div><span className="lf-key">Weight</span></div>
                      <div className="log-field"><div className="lf-val">{l.calories || "—"} kcal</div><span className="lf-key">Calories</span></div>
                      <div className="log-field"><div className="lf-val">{l.sleep || "—"} hrs</div><span className="lf-key">Sleep</span></div>
                      <div className="log-field"><div className="lf-val">{l.water || "—"} L</div><span className="lf-key">Water</span></div>
                      <div className="log-field" style={{ gridColumn: "span 1" }}><div className="lf-val" style={{ fontSize: 12, color: "var(--text2)" }}>{l.note || "—"}</div><span className="lf-key">Note</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {view === "tracking" && (
          <>
            <div className="page-header flex-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div className="page-title">My Daily Log</div><div className="page-sub">Track weight, calories, sleep & hydration</div></div>
              <button className="btn btn-primary" onClick={() => setShowLogModal(true)} disabled={loggedToday}>{loggedToday ? "✓ Already logged today" : "+ Log Today"}</button>
            </div>
            <div className="card">
              {log.length === 0 ? (
                <div className="empty-state"><span className="es-icon">📋</span><p>Start logging your daily metrics.</p><button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowLogModal(true)}>Add First Entry</button></div>
              ) : (
                <div className="log-grid">
                  <div className="hide-mobile" style={{ display: "grid", gridTemplateColumns: "90px repeat(5,1fr)", gap: 12, padding: "8px 16px" }}>
                    {["Date", "Weight", "Calories", "Sleep", "Water", "Notes"].map(h => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text3)" }}>{h}</div>
                    ))}
                  </div>
                  {[...log].reverse().map((l, i) => (
                    <div key={i} className="log-item">
                      <div className="log-date">{l.date}</div>
                      <div className="log-field"><div className="lf-val">{l.weight} kg</div><span className="lf-key hide-desktop">Weight</span></div>
                      <div className="log-field"><div className="lf-val">{l.calories || "—"} kcal</div><span className="lf-key hide-desktop">Calories</span></div>
                      <div className="log-field"><div className="lf-val">{l.sleep || "—"} hrs</div><span className="lf-key hide-desktop">Sleep</span></div>
                      <div className="log-field"><div className="lf-val">{l.water || "—"} L</div><span className="lf-key hide-desktop">Water</span></div>
                      <div className="log-field"><div className="lf-val" style={{ fontSize: 12, color: "var(--text2)" }}>{l.note || "—"}</div><span className="lf-key hide-desktop">Note</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === "diet" && (
          <>
            <div className="page-header">
              <div className="page-title">My Diet Plan</div>
              <div className="page-sub">Assigned by {trainerName}</div>
            </div>
            <div className="card">
              <DietPlanView dietPlan={client.dietPlan} client={client} isTrainer={false} onEdit={() => {}} />
            </div>
            {client.dietPlan?.pdf_url && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header">
                  <div className="card-title">📄 Diet Plan PDF</div>
                  <a href={client.dietPlan.pdf_url} download className="btn btn-primary btn-sm">⬇ Download PDF</a>
                </div>
                {client.dietPlan.notes && (
                  <div style={{ padding: "8px 0 16px", color: "var(--text2)", fontSize: 13 }}>
                    <strong>Trainer notes:</strong> {client.dietPlan.notes}
                  </div>
                )}
                <iframe
                  src={client.dietPlan.pdf_url}
                  title="Diet Plan PDF"
                  style={{ width: "100%", height: 600, border: "none", borderRadius: "var(--r)", background: "#fff" }}
                />
              </div>
            )}
          </>
        )}


        {view === "photos" && (
          <>
            <div className="page-header flex-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div><div className="page-title">Progress Gallery</div><div className="page-sub">Your visual fitness journey</div></div>
              <button className="btn btn-primary" onClick={() => setShowPhotoModal(true)}>+ Add Photo</button>
            </div>
            <div className="card">
              {(!client.progressPhotos || client.progressPhotos.length === 0) ? (
                <div className="empty-state"><span className="es-icon">📸</span><p>No photos yet. Start building your timeline!</p><button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setShowPhotoModal(true)}>Upload First Photo</button></div>
              ) : (
                <div className="photo-grid">
                  {client.progressPhotos.map((p, i) => (
                    <div key={i} className="photo-card">
                      <img src={p.url} alt={`Progress on ${p.date}`} />
                      <div className="photo-overlay">
                        <div className="photo-date">{p.date}</div>
                        {p.note && <div className="photo-note">{p.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === "chat" && (
          <>
            <div className="page-header">
              <div className="page-title">Chat with {trainerName}</div>
              <div className="page-sub">Direct messaging with your trainer</div>
            </div>
            <div className="card">
              <ChatBox otherUserId={trainer?.id} currentUserId={client.id} onSend={sendMessage} otherName={trainerName} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════ */
function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">
      <div className="landing-bg" />
      <nav className="landing-nav">
        <div className="landing-nav-logo">FIT<span>4LIFE</span></div>
        <div className="landing-nav-links">
          <a href="#" className="landing-nav-link" onClick={e=>e.preventDefault()}>Features</a>
          <a href="#" className="landing-nav-link" onClick={e=>e.preventDefault()}>Trainers</a>
          <a href="#" className="landing-nav-link" onClick={e=>e.preventDefault()}>Pricing</a>
          <button className="btn btn-ghost btn-sm" onClick={onGetStarted}>Sign In</button>
        </div>
      </nav>
      
      <main className="landing-hero">
        <div className="landing-badge">✨ New: AI-Powered Diet Plans</div>
        <h1 className="landing-title">Transform your body with <span>expert coaching</span></h1>
        <p className="landing-subtitle">Connect with elite trainers, track your daily progress, log your weight and meals, and visualize your transformation with our built-in progress gallery.</p>
        <div className="landing-cta">
          <button className="btn btn-primary btn-landing" onClick={onGetStarted}>Start Your Journey →</button>
          <button className="btn btn-ghost btn-landing" style={{ border: 'none', background: 'rgba(255,255,255,0.05)' }}>Explore Features</button>
        </div>
      </main>

      <div className="landing-features">
        <div className="landing-feature">
          <div className="lf-icon">📊</div>
          <div className="lf-title">Track Progress</div>
          <div className="lf-desc">Log your weight, sleep, hydration, and calories daily. See your progress visually in real-time.</div>
        </div>
        <div className="landing-feature">
          <div className="lf-icon">📸</div>
          <div className="lf-title">Visual Transformation</div>
          <div className="lf-desc">Upload progress photos to build a visual timeline of your fitness journey and stay motivated.</div>
        </div>
        <div className="landing-feature">
          <div className="lf-icon">🥗</div>
          <div className="lf-title">Custom Diet Plans</div>
          <div className="lf-desc">Get personalized meal plans from your trainer and download them as beautiful PDFs.</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PHOTO UPLOAD MODAL
═══════════════════════════════════════════════════════════ */
function PhotoUploadModal({ onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, note: "" });
  const [imgData, setImgData] = useState(null);
  const [fileObj, setFileObj] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileObj(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImgData(ev.target.result);
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!imgData) return;
    onSave({
      date: form.date,
      note: form.note,
      url: imgData,
      file: fileObj
    });
  }

  return (
    <div className="overlay" onClick={e => e.target.classList.contains("overlay") && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-title">Upload Progress Photo</div>
            <div className="modal-sub">Add a picture to your visual timeline</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Photo *</label>
            <div style={{ border: "1.5px dashed var(--border)", borderRadius: "var(--r)", padding: 24, textAlign: "center", cursor: "pointer", background: "var(--s3)" }} onClick={() => document.getElementById("photo-upload").click()}>
              {imgData ? (
                <img src={imgData} alt="Preview" style={{ maxHeight: 200, borderRadius: 8 }} />
              ) : (
                <div style={{ color: "var(--text2)", fontSize: 13 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📸</div>
                  Click to select a photo from your device
                </div>
              )}
              <input id="photo-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <input className="form-input" placeholder="Flexing those biceps..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex-end">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={!imgData}>Save Photo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState("landing");
  const [toasts, setToasts] = useState([]);
  
  const [clients, setClients] = useState([]);
  const [trainer, setTrainer] = useState({ name: "No Trainer Assigned" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadUserData();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserData();
      } else {
        setCurrentUser(null);
        setCurrentView("landing");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData() {
    try {
      let prof;
      try {
        prof = await api.getProfile();
      } catch (e) {
        if (e?.response?.status === 404) {
          // Profile doesn't exist yet — create it from auth user metadata
          const { data: { user } } = await supabase.auth.getUser();
          const meta = user?.user_metadata || {};
          prof = await api.createProfile({
            full_name: meta.full_name || user?.email?.split("@")[0] || "User",
            role: meta.role || "client",
            trainer_id: meta.trainer_id || null,
            weight: 70,
            target_weight: 65
          });
        } else {
          throw e;
        }
      }
      let userObj = {
        id: prof.id, name: prof.full_name, role: prof.role, email: "",
        trainerId: prof.trainer_id,
        profile: {
          weight: prof.weight, targetWeight: prof.target_weight,
          startDate: prof.start_date, endDate: prof.end_date, plan: prof.plan, feesPaid: prof.fees_paid
        },
        progressPhotos: [], weightLog: [], dietPlan: { assigned: false, meals: [], pdf_url: null }, messages: []
      };

      if (prof.role === "trainer") {
        const myClientsRaw = await api.getClients();
        // Fetch logs, photos and diet for each client in parallel
        const clientsWithData = await Promise.all(myClientsRaw.map(async (c) => {
          let weightLog = [], progressPhotos = [], dietPlan = { assigned: false, meals: [], pdf_url: null };
          try { weightLog = await api.getClientLogs(c.id); } catch(e) {}
          try { progressPhotos = await api.getClientPhotos(c.id); } catch(e) {}
          try {
            const diets = await api.getDietPlanForClient(c.id);
            if (diets && diets.length > 0) dietPlan = { ...diets[0], assigned: true };
          } catch(e) {}
          return {
            id: c.id, name: c.full_name, role: c.role, email: c.email || "", trainerId: c.trainer_id,
            profile: { weight: c.weight, targetWeight: c.target_weight, startDate: c.start_date, endDate: c.end_date, plan: c.plan, feesPaid: c.fees_paid },
            progressPhotos, weightLog, dietPlan, messages: []
          };
        }));
        setClients(clientsWithData);
      } else {
        const logs = await api.getLogs();
        const photos = await api.getPhotos();
        let diets = [];
        try { diets = await api.getDietPlan(); } catch(e) {}

        userObj.weightLog = logs || [];
        userObj.progressPhotos = photos || [];
        userObj.dietPlan = (diets && diets.length > 0)
          ? { ...diets[0], assigned: true }
          : { assigned: false, meals: [], pdf_url: null };

        if (prof.trainer_id) {
          try {
            const tInfo = await api.getTrainerInfo(prof.trainer_id);
            setTrainer({ id: tInfo.id, name: tInfo.full_name });
          } catch(e) {}
        }
      }

      setCurrentUser(userObj);
      setCurrentView("app");

    } catch (e) {
      console.error(e);
      setCurrentUser(null);
    }
  }

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }


    async function handleLogin(email, password, role) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      addToast(error.message, "error");
      return false;
    }
    return true;
  }

    async function handleRegister({ name, email, password, role, trainerId }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
          trainer_id: trainerId || null,
        }
      }
    });
    if (error) {
      addToast(error.message, "error");
      return;
    }
    // If session exists (email confirmation disabled), create profile immediately
    if (data?.session && data?.user) {
      try {
        await api.createProfile({
          full_name: name,
          role: role,
          trainer_id: trainerId || null,
          weight: 70,
          target_weight: 65
        });
      } catch (e) {
        console.error("Profile creation error:", e?.response?.data || e.message);
        // Profile might already exist or will be created on first login
      }
      addToast("Registration successful! Welcome to Fit4Life 🎉", "success");
    } else if (data?.user) {
      // Email confirmation is enabled — user created but needs to verify email
      addToast("Account created! Please check your email to confirm your account.", "success");
    }
  }

  const updateClient = useCallback((updated) => {
    setClients(cs => cs.map(c => c.id === updated.id ? updated : c));
    setCurrentUser(curr => (curr?.id === updated.id ? updated : curr));
  }, []);

  const liveClient = currentUser?.role === "client" ? clients.find(c => c.id === currentUser.id) : null;
  // trainer state is loaded from backend via loadUserData -> api.getTrainerInfo
  const clientTrainer = trainer;

  return (
    <>
      <ToastContainer toasts={toasts} />
      {currentView === "landing" && (
        <LandingPage onGetStarted={() => setCurrentView("auth")} />
      )}
      {currentView === "auth" && (
        <AuthPage onLogin={handleLogin} onRegister={handleRegister} onBack={() => setCurrentView("landing")} />
      )}
      {currentView === "app" && currentUser && (
        <div className="page">
          {/* NAV */}
          <nav className="nav">
            <div className="nav-logo">FIT<span>4LIFE</span></div>
            <div className="nav-right">
              <div className="nav-user">
                <div className="nav-avatar">
                  {currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="nav-name">{currentUser.name}</div>
                  <div className="nav-role">{currentUser.role === "trainer" ? "FITNESS TRAINER" : "MEMBER"}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign Out</button>
            </div>
          </nav>

          {currentUser.role === "trainer" && (
            <TrainerDashboard
              trainer={currentUser}
              clients={clients}
              onUpdateClient={updateClient}
              addToast={addToast}
            />
          )}
          {currentUser.role === "client" && (
            <ClientDashboard
              client={liveClient || currentUser}
              trainer={clientTrainer}
              onUpdateClient={updateClient}
              addToast={addToast}
            />
          )}
        </div>
      )}
    </>
  );
}
