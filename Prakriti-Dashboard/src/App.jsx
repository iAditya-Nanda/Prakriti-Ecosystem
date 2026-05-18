import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Leaf,
  Users,
  Building2,
  CheckCircle2,
  LineChart,
  MapPin,
  BadgeCheck,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart,
  Factory,
  SunMedium,
  MoonStar,
  RefreshCw,
} from "lucide-react";

const COLORS = {
  emerald: "#2ECC71",
  forest: "#145A32",
  teal: "#1ABC9C",
  yellow: "#F1C40F",
  coral: "#E74C3C",
};

const mock = {
  asOf: "Nov 06, 2025 11:55 IST",
  totals: {
    ecoActions: 28450,
    activeTourists: 1820,
    certifiedBusinesses: 135,
    complianceRate: 86,
  },
  weeklyActions: [3100, 3220, 3340, 3525, 3440, 3610, 3740, 3925],
  regions: [
    { name: "Kullu", pct: 28 },
    { name: "Shimla", pct: 22 },
    { name: "Kangra", pct: 18 },
    { name: "Lahaul & Spiti", pct: 12 },
    { name: "Kinnaur", pct: 10 },
    { name: "Others", pct: 10 },
  ],
  hotspots: [
    { place: "Rohtang Corridor", status: "Watch", note: "Weekend spikes", risk: "med" },
    { place: "Old Manali", status: "Stable", note: "Good segregation", risk: "low" },
    { place: "Mall Road, Shimla", status: "Improve", note: "Litter reports", risk: "med" },
  ],
  recentCerts: [
    { id: "HST-2191", name: "Pine View Homestay", district: "Kullu", type: "Renewal", ago: "2d" },
    { id: "CAF-1109", name: "Cedar Leaf Café", district: "Shimla", type: "Initial", ago: "4d" },
    { id: "TRK-3302", name: "Dhauladhar Treks", district: "Kangra", type: "Operational", ago: "6d" },
  ],
  complianceBreakdown: [
    { label: "Waste", pct: 40 },
    { label: "Water", pct: 24 },
    { label: "Energy", pct: 22 },
    { label: "Other", pct: 14 },
  ],
  topActions: [
    { label: "Bottle refills", value: 8120 },
    { label: "Segregated handovers", value: 6420 },
    { label: "Shared shuttles", value: 5140 },
  ],
};

const nf = (n) => n.toLocaleString();

function generateInsight({ weeklyActions, regions, totals }) {
  const last = weeklyActions.at(-1);
  const prev = weeklyActions.at(-2) || last;
  const delta = last - prev;
  const deltaPct = (delta / prev) * 100;
  const leader = [...regions].sort((a, b) => b.pct - a.pct)[0];
  const mood = deltaPct > 3 ? "accelerating" : deltaPct < -3 ? "softening" : "stable";
  return `Eco-actions are ${mood} at ${nf(last)} verifications this week `
    + `(${delta >= 0 ? "+" : ""}${nf(delta)} • ${deltaPct.toFixed(1)}%). `
    + `${leader.name} leads participation (${leader.pct}%), `
    + `${nf(totals.activeTourists)} active tourists and `
    + `${nf(totals.certifiedBusinesses)} certified businesses indicate healthy adoption.`;
}

export default function PrakritiInsightDashboardPro() {
  const [dark, setDark] = useState(false);
  const [totals, setTotals] = useState(mock.totals);
  const insight = useMemo(() => generateInsight({ ...mock, totals }), [totals]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/v1/dashboard/stats");
        const json = await res.json();
        if (json.totals) {
          setTotals(json.totals);
        }
      } catch (err) {
        console.log("Failed to fetch live dashboard stats:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("prakriti_theme");
    if (saved) setDark(saved === "dark");
  }, []);
  useEffect(() => {
    localStorage.setItem("prakriti_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/60 border-b border-black/10 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-2xl grid place-items-center text-white shadow"
                style={{ background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.teal})` }}
              >
                <Leaf size={18} />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Prakriti Insight Dashboard</h1>
                <p className="text-xs opacity-70">Live Feed • As of {mock.asOf}</p>
              </div>
            </div>

            <button
              onClick={() => setDark((v) => !v)}
              className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            >
              {dark ? <SunMedium size={14} /> : <MoonStar size={14} />}
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 grid gap-6">
          {/* KPI STRIP */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPI icon={Leaf} title="Verified Eco-Actions" value={nf(totals.ecoActions)} grad={[COLORS.emerald, COLORS.teal]} />
            <KPI icon={Users} title="Active Tourists" value={nf(totals.activeTourists)} grad={[COLORS.teal, COLORS.emerald]} />
            <KPI icon={Building2} title="Green-Stamped Businesses" value={nf(totals.certifiedBusinesses)} grad={[COLORS.forest, COLORS.teal]} />
            <KPI icon={CheckCircle2} title="Compliance Rate" value={`${totals.complianceRate}%`} grad={[COLORS.yellow, COLORS.emerald]} />
          </section>


          {/* TREND + BREAKDOWN */}
          <section className="grid lg:grid-cols-3 gap-6">
            <Panel className="lg:col-span-2" title="Weekly Verified Eco-Actions" subtitle="Last 8 weeks • Read-only" icon={LineChart}>
              <MiniArea values={mock.weeklyActions} from={COLORS.emerald} to={COLORS.yellow} />
            </Panel>

            <Panel title="Compliance Breakdown" subtitle="Weighted share by category" icon={PieChart}>
              <Donut breakdown={mock.complianceBreakdown} />
            </Panel>
          </section>

          {/* REGIONS + HOTSPOTS + CERTS */}
          <section className="grid xl:grid-cols-3 gap-6">
            <Panel title="Regional Share" subtitle="Share of verified actions by district" icon={BarChart3}>
              <div className="grid gap-2">
                {mock.regions.map((r) => (
                  <RegionRow key={r.name} name={r.name} pct={r.pct} color={COLORS.forest} />
                ))}
              </div>
            </Panel>

            <Panel title="Hotspots" subtitle="Attention areas (non-blocking)" icon={MapPin}>
              <div className="grid gap-2">
                {mock.hotspots.map((h) => (
                  <HotspotItem key={h.place} place={h.place} status={h.status} note={h.note} risk={h.risk} />
                ))}
              </div>
            </Panel>

            <Panel title="Recent Certifications" subtitle="Latest Green-Stamp activity" icon={BadgeCheck}>
              <div className="grid gap-2">
                {mock.recentCerts.map((c) => (
                  <CertItem key={c.id} id={c.id} name={c.name} district={c.district} type={c.type} ago={c.ago} />
                ))}
              </div>
            </Panel>
          </section>

          {/* AI INSIGHTs */}
          <section>
            <Panel title="AI Insight Summary" subtitle="Plain-language sustainability trend" icon={TrendingUp}>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl grid place-items-center text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${COLORS.teal}, ${COLORS.emerald})` }}
                >
                  <LineChart size={18} />
                </div>
                <p className="leading-relaxed opacity-90">{insight}</p>
              </div>
            </Panel>
          </section>

          <footer className="text-xs opacity-70 flex flex-wrap items-center gap-2">
            <Factory size={14} />
            <span>Read-only dashboard for policy monitoring & environmental planning in Himachal Pradesh.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

/* UI-COMPONENTS */
function KPI({ icon: Icon, title, value, grad }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 shadow-sm p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-70">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl grid place-items-center text-white"
          style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
        >
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}

function Panel({ title, subtitle, icon: Icon, className = "", children }) {
  return (
    <div className={`rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 shadow-sm p-5 ${className}`}>
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Icon size={18} /> {title}
        </h2>
        {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function MiniArea({ values, from, to }) {
  const max = Math.max(...values);
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ");
  return (
    <div className="h-40">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={from} stopOpacity="0.6" />
            <stop offset="100%" stopColor={to} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <polygon points={`0,100 ${points} 100,100`} fill="url(#g1)" />
        <polyline points={points} fill="none" stroke={from} strokeWidth="1.6" />
      </svg>
      <div className="mt-2 text-xs opacity-70 flex justify-between">
        <span>−7w</span><span>−5w</span><span>−3w</span><span>This week</span>
      </div>
    </div>
  );
}

function RegionRow({ name, pct, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{name}</span>
        <span className="opacity-70">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${COLORS.teal})` }} />
      </div>
    </div>
  );
}

function HotspotItem({ place, status, note, risk }) {
  const tone =
    risk === "med"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  const Icon = risk === "med" ? AlertTriangle : CheckCircle2;
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <MapPin className="opacity-70" size={18} />
        <div>
          <div className="font-medium">{place}</div>
          <div className="text-xs opacity-70">{note}</div>
        </div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1 ${tone}`}>
        <Icon size={14} /> {status}
      </span>
    </div>
  );
}

function CertItem({ id, name, district, type, ago }) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <BadgeCheck className="opacity-70" size={18} />
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs opacity-70">{type} • {district} • {id}</div>
        </div>
      </div>
      <span className="text-xs opacity-70">{ago} ago</span>
    </div>
  );
}

function Donut({ breakdown }) {
  const total = breakdown.reduce((s, b) => s + b.pct, 0);
  let cum = 0;
  return (
    <svg viewBox="0 0 42 42" className="w-28 h-28 mx-auto block">
      {breakdown.map((b, i) => {
        const val = (b.pct / total) * 100;
        const dash = `${val} ${100 - val}`;
        const rotate = (cum / 100) * 360;
        cum += val;
        return (
          <circle
            key={b.label}
            r="15.9155"
            cx="21"
            cy="21"
            fill="transparent"
            stroke={[COLORS.emerald, COLORS.teal, COLORS.forest, COLORS.yellow][i % 4]}
            strokeWidth="6"
            strokeDasharray={dash}
            transform={`rotate(${rotate} 21 21)`}
          />
        );
      })}
      <circle r="12" cx="21" cy="21" fill="white" className="dark:fill-gray-900" />
      <text x="21" y="21" textAnchor="middle" dominantBaseline="central" className="text-[7px] fill-gray-700 dark:fill-gray-200 font-semibold">
        Compliance
      </text>
    </svg>
  );
}
