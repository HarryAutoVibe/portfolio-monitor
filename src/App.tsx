import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  MoreVertical,
  ArrowLeft,
  Sparkles,
  Send,
  Download,
  ChevronDown,
  X,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  CalendarPlus,
  StickyNote,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Joyride, STATUS, EVENTS, ACTIONS, type Step, type EventData } from "react-joyride";

// Types
type RiskStatus = "At Risk" | "Needs Attention" | "On Track";

interface CompanyData {
  id: number;
  name: string;
  status: RiskStatus;
  revenueGrowth: number;   // QoQ %
  runway: number;          // months
  burnMultiple: number;    // net burn / net new ARR (higher = worse)
  owner: string;
  ownerAvatar: string;
  lastUpdated: string;
}

interface Notification {
  id: number;
  companyName: string;
  description: string;
  severity: "red" | "yellow" | "green";
  timestamp: string;
  isRead: boolean;
}

// Mock data
const companiesData: CompanyData[] = [
  { id: 1, name: "Acme Industries Ltd.", status: "At Risk", revenueGrowth: -4.2, runway: 4.1, burnMultiple: 4.8, owner: "Sarah Chen", ownerAvatar: "SC", lastUpdated: "12 min ago" },
  { id: 2, name: "Northwind Trading Co.", status: "At Risk", revenueGrowth: -1.8, runway: 5.6, burnMultiple: 3.9, owner: "Marcus Lee", ownerAvatar: "ML", lastUpdated: "23 min ago" },
  { id: 3, name: "Globex Logistics", status: "At Risk", revenueGrowth: 2.1, runway: 6.2, burnMultiple: 3.1, owner: "Sarah Chen", ownerAvatar: "SC", lastUpdated: "1 hr ago" },
  { id: 4, name: "Apex Software", status: "Needs Attention", revenueGrowth: 8.4, runway: 9.3, burnMultiple: 2.4, owner: "Priya Sharma", ownerAvatar: "PS", lastUpdated: "2 hrs ago" },
  { id: 5, name: "Helios Capital", status: "Needs Attention", revenueGrowth: 12.6, runway: 10.8, burnMultiple: 2.1, owner: "Marcus Lee", ownerAvatar: "ML", lastUpdated: "3 hrs ago" },
  { id: 6, name: "Riverstone Partners", status: "On Track", revenueGrowth: 34.2, runway: 22, burnMultiple: 0.9, owner: "Priya Sharma", ownerAvatar: "PS", lastUpdated: "5 hrs ago" },
];

// Per-metric threshold status
const growthStatus = (g: number): RiskStatus => (g < 0 ? "At Risk" : g < 10 ? "Needs Attention" : "On Track");
const runwayStatus = (r: number): RiskStatus => (r < 6 ? "At Risk" : r < 12 ? "Needs Attention" : "On Track");
const burnStatus = (b: number): RiskStatus => (b > 3 ? "At Risk" : b > 2 ? "Needs Attention" : "On Track");

const chartDataFor = (company: CompanyData) => {
  const isHealthy = company.status === "On Track";
  const isWatch = company.status === "Needs Attention";
  const start = isHealthy ? 6.4 : 9.3;
  const end = isHealthy ? 9.6 : isWatch ? 8.4 : 7.4;
  return Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    const base = start + (end - start) * (t * t * 0.6 + t * 0.4);
    const noise = (((i * 13 + 7) % 17) - 8) * 0.008;
    const hasAlert = company.status === "At Risk" ? (i === 10 || i === 23) : isWatch ? i === 20 : false;
    return { day: i + 1, balance: Math.round((base + noise) * 100) / 100, hasAlert };
  });
};

const chartDomainFor = (company: CompanyData): [number, number] => {
  if (company.status === "On Track") return [6.0, 10.0];
  if (company.status === "Needs Attention") return [8.0, 9.5];
  return [7.2, 9.5];
};

const alertDetailsFor = (company: CompanyData) => {
  if (company.status === "On Track") return [];
  if (company.status === "Needs Attention") {
    return [{ day: 21, title: "Runway approached 12-month threshold", timestamp: "Sep 25, 2026 at 10:00 AM", severity: "Critical" }];
  }
  return [
    { day: 11, title: "Runway crossed 6-month threshold", timestamp: "Sep 12, 2026 at 3:42 PM", severity: "Critical" },
    { day: 24, title: "Net burn accelerated 40% WoW", timestamp: "Sep 25, 2026 at 9:15 AM", severity: "Critical" },
  ];
};

const summaryFor = (c: CompanyData): string => {
  const growthStr = `${c.revenueGrowth > 0 ? "+" : ""}${c.revenueGrowth.toFixed(1)}%`;
  if (c.status === "On Track") {
    return `Revenue growth strong at ${growthStr} QoQ. Cash runway ${c.runway.toFixed(1)} months provides a comfortable buffer. Burn multiple ${c.burnMultiple.toFixed(1)}x means the company generates $${(1 / c.burnMultiple).toFixed(2)} of net new ARR for every $1 of burn. Tracking well.`;
  }
  if (c.status === "Needs Attention") {
    return `Revenue growth at ${growthStr} QoQ, slower than target. Cash runway ${c.runway.toFixed(1)} months, watching closely. Burn multiple ${c.burnMultiple.toFixed(1)}x is above the efficient range. Recommend follow-up with CFO this month.`;
  }
  return `Revenue growth ${growthStr} QoQ. Cash runway now at ${c.runway.toFixed(1)} months. Burn multiple climbed to ${c.burnMultiple.toFixed(1)}x, meaning the company is spending $${c.burnMultiple.toFixed(2)} for every $1 of net new ARR. Recommend immediate review.`;
};

const notesFor = (c: CompanyData) => {
  if (c.status === "On Track") {
    return [
      { by: c.owner, date: "Sep 22", text: "Board update: expansion into two new regions ahead of plan." },
      { by: c.owner, date: "Sep 15", text: "Q3 pipeline healthy; NRR trending above 120%." },
    ];
  }
  if (c.status === "Needs Attention") {
    return [
      { by: c.owner, date: "Sep 22", text: "Spoke to CFO. Cost discipline plan in place, revisit in 30 days." },
      { by: c.owner, date: "Sep 18", text: "Watching pipeline conversion; October forecast key." },
    ];
  }
  return [
    { by: c.owner, date: "Sep 22", text: "Spoke to CFO. Cost-reduction plan targets a 30% burn cut by Q4." },
    { by: c.owner, date: "Sep 20", text: "Flagged Q2 growth deceleration, watching pipeline conversion." },
  ];
};

const recentAlertsFor = (c: CompanyData): { severity: "red" | "yellow"; title: string; timestamp: string }[] => {
  if (c.status === "On Track") return [];
  if (c.status === "Needs Attention") {
    return [
      { severity: "yellow", title: "Runway approaching 12-month threshold", timestamp: "2 hours ago" },
      { severity: "yellow", title: "Q3 growth guidance revised down", timestamp: "2 days ago" },
    ];
  }
  return [
    { severity: "red", title: "Runway crossed 6-month threshold", timestamp: "2 hours ago" },
    { severity: "red", title: "Net burn accelerated 40% WoW", timestamp: "1 day ago" },
    { severity: "yellow", title: "New cohort churn exceeded 5%", timestamp: "3 days ago" },
  ];
};

const statusBorderClass = (status: RiskStatus): string => {
  if (status === "At Risk") return "border-l-4 border-l-red-500";
  if (status === "Needs Attention") return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-green-500";
};

const notificationsData: Notification[] = [
  { id: 1, companyName: "Acme Industries Ltd.", description: "Runway dropped below 6 months (now 4.1 mo)", severity: "red", timestamp: "2 hours ago", isRead: false },
  { id: 2, companyName: "Northwind Trading Co.", description: "Burn multiple climbed to 3.9x this quarter", severity: "red", timestamp: "3 hours ago", isRead: false },
  { id: 3, companyName: "Apex Software", description: "Net revenue retention slipped for a second quarter", severity: "yellow", timestamp: "5 hours ago", isRead: false },
  { id: 4, companyName: "Helios Capital", description: "Approaching 12-month runway threshold", severity: "yellow", timestamp: "1 day ago", isRead: true },
  { id: 5, companyName: "Riverstone Partners", description: "ARR growth accelerated to +34% QoQ", severity: "green", timestamp: "1 day ago", isRead: true },
  { id: 6, companyName: "Acme Industries Ltd.", description: "New cohort churn exceeded 5% threshold", severity: "red", timestamp: "2 days ago", isRead: true },
];

function TopBar({ onNotificationClick, onLogoClick, onStartTour, showHelpHint, onDismissHelpHint }: { onNotificationClick?: () => void; onLogoClick?: () => void; onStartTour?: () => void; showHelpHint?: boolean; onDismissHelpHint?: () => void }) {
  return (
    <div className="h-16 border-b border-gray-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-2">
      <button onClick={onLogoClick} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
        <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-sm" />
        </div>
        <span className="hidden sm:inline text-lg font-semibold text-gray-900 whitespace-nowrap">Portfolio Monitor</span>
      </button>
      <div className="hidden md:block flex-1 min-w-0 max-w-xl mx-3 sm:mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search companies..." className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>
      </div>
      <div className="flex-1 md:hidden" />
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative">
          <button
            data-tour="restart-tour"
            onClick={onStartTour}
            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Take the guided tour"
            aria-label="Take the guided tour"
          >
            <HelpCircle className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Take the tour</span>
          </button>
          {showHelpHint && (
            <div
              onClick={onDismissHelpHint}
              className="absolute right-0 top-full mt-2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-40 cursor-pointer"
              role="tooltip"
            >
              <div className="absolute -top-1.5 right-4 w-3 h-3 bg-gray-900 rotate-45" />
              Take the tour from here anytime.
            </div>
          )}
        </div>
        <div className="relative" data-tour="bell">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={onNotificationClick}>
            <Bell className="w-5 h-5 text-gray-700" />
          </button>
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">3</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">HS</div>
          <span className="hidden md:inline text-sm font-medium text-gray-900">Harmeet Singh</span>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: RiskStatus | string }) {
  const colors: Record<string, string> = {
    "At Risk": "bg-red-50 text-red-700 border-red-200",
    "Needs Attention": "bg-amber-50 text-amber-700 border-amber-200",
    "On Track": "bg-green-50 text-green-700 border-green-200",
    "Critical": "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {status}
    </span>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-7 h-7 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-medium">{initials}</div>
  );
}

// Screen 1: Portfolio Dashboard
function PortfolioDashboard({ onCompanyClick, onNotificationClick, onLogoClick, onStartTour, showHelpHint, onDismissHelpHint }: any) {
  return (
    <div className="min-h-screen bg-white">
      <TopBar onNotificationClick={onNotificationClick} onLogoClick={onLogoClick} onStartTour={onStartTour} showHelpHint={showHelpHint} onDismissHelpHint={onDismissHelpHint} />
      <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-gray-500">Last updated: 14 minutes ago. All systems operational.</span>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div data-tour="risk-tabs" className="flex gap-6 overflow-x-auto whitespace-nowrap">
          <button className="text-sm font-semibold text-gray-900 border-b-2 border-gray-900 pb-1">All (47)</button>
          <button className="text-sm text-gray-500 hover:text-gray-900 pb-1">On Track (38)</button>
          <button className="text-sm text-gray-500 hover:text-gray-900 pb-1">Needs Attention (6)</button>
          <button className="text-sm text-gray-500 hover:text-gray-900 pb-1">At Risk (3)</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Viewing:</span>
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
            All Deals <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {/* Mobile: card view */}
        <div data-tour="companies-table" className="md:hidden space-y-3">
          {companiesData.map((company) => (
            <button
              key={company.id}
              data-tour={company.id === 1 ? "acme-row" : undefined}
              onClick={() => onCompanyClick(company)}
              className={`w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 ${statusBorderClass(company.status)}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate">{company.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{company.owner} · {company.lastUpdated}</div>
                </div>
                <StatusPill status={company.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-[10px] text-gray-500">Growth</div>
                  <div className={`inline-flex items-center gap-0.5 text-sm font-semibold ${company.revenueGrowth < 0 ? "text-red-600" : company.revenueGrowth < 10 ? "text-gray-900" : "text-green-600"}`}>
                    {company.revenueGrowth > 0 ? "+" : ""}{company.revenueGrowth.toFixed(1)}%
                    {company.revenueGrowth < 0 ? <ArrowDownRight className="w-3 h-3" strokeWidth={2.5} /> : company.revenueGrowth >= 10 ? <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} /> : null}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Runway</div>
                  <div className={`text-sm font-semibold ${company.runway < 6 ? "text-red-600" : company.runway < 12 ? "text-amber-600" : "text-gray-900"}`}>{company.runway.toFixed(1)} mo</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Burn</div>
                  <div className={`text-sm font-semibold ${company.burnMultiple > 3 ? "text-red-600" : company.burnMultiple > 2 ? "text-amber-600" : "text-gray-900"}`}>{company.burnMultiple.toFixed(1)}x</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop: table view */}
        <div data-tour="companies-table" className="hidden md:block border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Status</th>
                <th data-tour="metric-cols" className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Growth (QoQ)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Runway (mo)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Burn Multiple</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {companiesData.map((company) => (
                <tr key={company.id} data-tour={company.id === 1 ? "acme-row" : undefined} className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${statusBorderClass(company.status)}`} onClick={() => onCompanyClick(company)}>
                  <td className="px-4 py-4"><button className="text-sm font-medium hover:underline">{company.name}</button></td>
                  <td className="px-4 py-4"><StatusPill status={company.status} /></td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-0.5 text-sm font-medium ${company.revenueGrowth < 0 ? "text-red-600" : company.revenueGrowth < 10 ? "text-gray-900" : "text-green-600"}`}>
                      {company.revenueGrowth > 0 ? "+" : ""}{company.revenueGrowth.toFixed(1)}%
                      {company.revenueGrowth < 0 ? <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2.5} /> : company.revenueGrowth >= 10 ? <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} /> : null}
                    </span>
                  </td>
                  <td className="px-4 py-4"><span className={`text-sm font-medium ${company.runway < 6 ? "text-red-600" : company.runway < 12 ? "text-amber-600" : "text-gray-900"}`}>{company.runway.toFixed(1)} mo</span></td>
                  <td className="px-4 py-4"><span className={`text-sm font-medium ${company.burnMultiple > 3 ? "text-red-600" : company.burnMultiple > 2 ? "text-amber-600" : "text-gray-900"}`}>{company.burnMultiple.toFixed(1)}x</span></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar initials={company.ownerAvatar} />
                      <span className="text-sm">{company.owner}</span>
                      <button className="ml-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded">Assign</button>
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className="text-sm text-gray-500">{company.lastUpdated}</span></td>
                  <td className="px-4 py-4"><button className="p-1 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}><MoreVertical className="w-4 h-4 text-gray-400" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <span className="text-sm text-gray-500">Showing 1-6 of 47</span>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">2</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">3</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Screen 2: Company View
function CompanyView({ company, onBack, onNotificationClick, onLogoClick, onStartTour }: { company: CompanyData; onBack: () => void; onNotificationClick: () => void; onLogoClick: () => void; onStartTour: () => void }) {
  const [activeAlertPopup, setActiveAlertPopup] = useState<number | null>(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<number>>(new Set());
  const chartData = chartDataFor(company);
  const alertDetails = alertDetailsFor(company);
  const recentAlerts = recentAlertsFor(company);
  const notes = notesFor(company);
  const chartDomain = chartDomainFor(company);
  const activeAlert = activeAlertPopup === null ? null : alertDetails.find(a => a.day === activeAlertPopup) ?? null;
  const chartLineColor = company.status === "At Risk" ? "#dc2626" : company.status === "Needs Attention" ? "#d97706" : "#16a34a";

  return (
    <div className="min-h-screen bg-white">
      <TopBar onNotificationClick={onNotificationClick} onLogoClick={onLogoClick} onStartTour={onStartTour} />
      <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Portfolio &gt; {company.name}</span>
        </button>
      </div>

      <div className="p-4 sm:p-6">
        {/* Header with actions */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-3xl font-bold text-gray-900">{company.name}</h1>
              <StatusPill status={company.status} />
              <button className="text-xs sm:text-sm text-blue-600 hover:underline">Override Status</button>
            </div>
            <div data-tour="actions" className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <button className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 text-gray-700">
                <Share2 className="w-4 h-4" />
                <span>Share<span className="hidden sm:inline"> Report</span></span>
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 text-gray-700">
                <CalendarPlus className="w-4 h-4" />
                <span><span className="sm:hidden">Meet</span><span className="hidden sm:inline">Schedule Meeting</span></span>
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 text-gray-700">
                <StickyNote className="w-4 h-4" />
                <span><span className="sm:hidden">Notes</span><span className="hidden sm:inline">Add Notes</span></span>
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-sm text-gray-500">
            <span>Deal Owner: <span className="font-medium text-gray-900">{company.owner}</span></span>
            <span data-tour="ingestion">Last batch processed: Sep 28, 2026 2:14 PM</span>
          </div>
        </div>

        {/* AI Summary - highlighted */}
        <div data-tour="ai-summary" className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">AI Summary</p>
              <p className="text-sm leading-relaxed text-gray-800">
                {summaryFor(company)}
              </p>
            </div>
          </div>
        </div>

        {/* NL Query Bar */}
        <div data-tour="nl-query" className="mb-6">
          <div className="relative">
            <input type="text" placeholder="Ask the AI assistant about this company" className="w-full h-12 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg">
              <Send className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">e.g. What is the monthly burn rate? Which cohorts are churning?</p>
        </div>

        {/* Metric Cards */}
        <div data-tour="metric-tiles" className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <MetricCard
            title="Revenue Growth"
            value={`${company.revenueGrowth > 0 ? "+" : ""}${company.revenueGrowth.toFixed(1)}%`}
            status={growthStatus(company.revenueGrowth)}
            trend={company.revenueGrowth < 0 ? "down" : "up"}
            direction={company.revenueGrowth < 0 ? "down" : "up"}
          />
          <MetricCard
            title="Runway"
            value={`${company.runway.toFixed(1)} mo`}
            status={runwayStatus(company.runway)}
            trend={company.runway < 12 ? "down" : "up"}
            direction={company.runway < 12 ? "down" : "up"}
            dataTour="runway-tile"
            highlight
            highlightNote="See chart"
          />
          <MetricCard
            title="Burn Multiple"
            value={`${company.burnMultiple.toFixed(1)}x`}
            status={burnStatus(company.burnMultiple)}
            trend={company.burnMultiple > 2 ? "up" : "down"}
            direction={company.burnMultiple > 2 ? "up" : "down"}
          />
        </div>

        {/* Chart */}
        <div data-tour="chart" className="border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 relative">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cash Position, Last 30 Days</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button className="text-sm font-medium text-gray-900">Chart</button>
                <span className="text-gray-300">|</span>
                <button className="text-sm text-gray-500 hover:text-gray-900">Raw Data</button>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg" title="Download CSV/XLSX">
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="day" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} domain={chartDomain} tickFormatter={(value) => `$${value.toFixed(1)}M`} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={chartLineColor}
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, index, payload } = props;
                    if (!payload.hasAlert) return <circle key={index} cx={cx} cy={cy} r={0} fill="none" />;
                    const isAck = acknowledgedAlerts.has(payload.day);
                    const openAlert = (e: any) => {
                      e.stopPropagation();
                      setActiveAlertPopup(activeAlertPopup === payload.day ? null : payload.day);
                    };
                    return (
                      <g key={index} style={{ cursor: "pointer" }}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={22}
                          fill="transparent"
                          onClick={openAlert}
                          onTouchStart={openAlert}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={10}
                          fill={isAck ? "#9ca3af" : "#fb923c"}
                          stroke="#fff"
                          strokeWidth={2.5}
                          pointerEvents="none"
                        />
                      </g>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {alertDetails.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">Tap orange dots to view alert details</p>
          )}
        </div>

        {/* Notes & History */}
        <div data-tour="notes" className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes &amp; History</h3>
          <div className="space-y-3">
            {notes.map((note, i) => (
              <div key={i} className="border-l-2 border-gray-200 pl-4 py-2">
                <p className="text-sm"><span className="font-medium">{note.by}</span>, {note.date}: {note.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Alerts</h3>
            <div className="space-y-3">
              {recentAlerts.map((a, i) => (
                <AlertItem key={i} severity={a.severity} title={a.title} timestamp={a.timestamp} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alert detail modal */}
      {activeAlert && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setActiveAlertPopup(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-sm bg-white border border-gray-200 rounded-xl shadow-2xl p-5 z-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alert Detail</span>
              <button onClick={() => setActiveAlertPopup(null)} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">{activeAlert.title}</p>
            <p className="text-xs text-gray-500 mb-3">{activeAlert.timestamp}</p>
            <div className="mb-4">
              <StatusPill status="Critical" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAcknowledgedAlerts(prev => new Set(prev).add(activeAlertPopup!));
                  setActiveAlertPopup(null);
                }}
                className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Acknowledge
              </button>
              <button
                onClick={() => setActiveAlertPopup(null)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, status, trend, dataTour, direction, highlight, highlightNote }: { title: string; value: string; status: RiskStatus; trend: string; dataTour?: string; direction: "up" | "down"; highlight?: boolean; highlightNote?: string }) {
  const trendData = trend === "up" ? [4, 5, 4.5, 6, 7, 6.5, 8] : trend === "down" ? [8, 7, 7.5, 6, 5, 5.5, 4] : [5, 5.5, 5, 6, 5.5, 6, 5.5];
  const isRisk = status === "At Risk";
  const isWatch = status === "Needs Attention";
  const valueColor = isRisk ? "text-red-600" : isWatch ? "text-amber-600" : "text-green-600";
  const arrowColor = valueColor;
  const strokeColor = isRisk ? "#dc2626" : isWatch ? "#d97706" : "#16a34a";
  const ringClass = highlight
    ? isRisk ? "border-red-300 ring-2 ring-red-100"
      : isWatch ? "border-amber-300 ring-2 ring-amber-100"
      : "border-green-300 ring-2 ring-green-100"
    : "border-gray-200";
  const noteColor = isRisk ? "text-red-600" : isWatch ? "text-amber-600" : "text-green-600";
  const Arrow = direction === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div data-tour={dataTour} className={`border rounded-lg p-3 sm:p-4 ${ringClass}`}>
      <div className="text-[10px] sm:text-xs text-gray-500 mb-1 truncate">{title}</div>
      <div className="flex items-end justify-between mb-2">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          <div className={`text-lg sm:text-2xl font-bold truncate ${valueColor}`}>{value}</div>
          <Arrow className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${arrowColor}`} strokeWidth={2.5} />
        </div>
        <div className="hidden sm:block h-8 w-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.map((v, i) => ({ value: v, index: i }))}>
              <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <StatusPill status={status} />
      {highlightNote && (
        <div className={`mt-2 flex items-center gap-1 text-[10px] sm:text-xs ${noteColor} font-medium`}>
          {highlightNote}
          <ArrowDownRight className="w-3 h-3" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
}

function AlertItem({ severity, title, timestamp }: { severity: string; title: string; timestamp: string }) {
  const severityColors: Record<string, string> = { red: "bg-red-500", yellow: "bg-amber-500", green: "bg-green-500" };
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityColors[severity]}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 font-medium">Acknowledge</button>
        <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 font-medium flex items-center gap-1">Dismiss <ChevronDown className="w-3 h-3" /></button>
      </div>
    </div>
  );
}

// Notification Panel
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("unread");
  const displayed = activeTab === "all" ? notificationsData : notificationsData.filter((n) => !n.isRead);
  const severityColors: Record<string, string> = { red: "bg-red-500", yellow: "bg-amber-500", green: "bg-green-500" };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-6 px-6 border-b border-gray-200 flex-shrink-0">
          <button className={`text-sm py-3 border-b-2 transition-colors ${activeTab === "all" ? "font-semibold text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-900"}`} onClick={() => setActiveTab("all")}>All (12)</button>
          <button className={`text-sm py-3 border-b-2 transition-colors ${activeTab === "unread" ? "font-semibold text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-900"}`} onClick={() => setActiveTab("unread")}>Unread (3)</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {displayed.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 p-4 border border-gray-200 rounded-lg ${!n.isRead ? "bg-blue-50/40" : ""}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityColors[n.severity]}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{n.companyName}</p>
                  <p className="text-sm text-gray-500 mb-1">{n.description}</p>
                  <p className="text-xs text-gray-400">{n.timestamp}</p>
                </div>
                <button className="text-sm text-blue-600 hover:underline">View</button>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button className="text-sm text-blue-600 hover:underline">Mark all as read</button>
        </div>
      </div>
    </>
  );
}

// Guided tour steps
const stepBody = (title: string, body: string) => (
  <div style={{ textAlign: "left" }}>
    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: "#111827" }}>{title}</div>
    <div style={{ fontSize: 14, lineHeight: 1.55, color: "#374151" }}>{body}</div>
  </div>
);

// Pick the first VISIBLE element matching a data-tour attribute. Needed because
// we render mobile and desktop layouts side by side and toggle their visibility.
const pickVisibleTarget = (name: string) => (): HTMLElement | null => {
  const els = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const el of Array.from(els)) {
    if (el.offsetParent !== null) return el;
  }
  return els[0] ?? null;
};

const tourSteps: Step[] = [
  {
    target: "body",
    placement: "center",
    skipBeacon: true,
    content: stepBody(
      "Welcome to Portfolio Monitor",
      "A dashboard for institutional investors and analysts to see how companies in the existing portfolio are performing on the metrics that matter. Take 90 seconds for the tour."
    ),
  },
  {
    target: '[data-tour="risk-tabs"]',
    placement: "bottom",
    skipBeacon: true,
    content: stepBody(
      "Triage by risk",
      "Companies auto-segment into three tiers by threshold rules. Analysts start each day on At Risk, the ones needing intervention."
    ),
  },
  {
    target: pickVisibleTarget("companies-table"),
    placement: "top",
    skipBeacon: true,
    content: stepBody(
      "Three signals up top",
      "The three signals that matter are surfaced at the top. This dashboard is configurable from settings to add or remove metrics. For now it shows Revenue Growth, Runway, and Burn Multiple. All color coded by threshold."
    ),
  },
  {
    target: pickVisibleTarget("acme-row"),
    placement: "bottom",
    skipBeacon: true,
    content: stepBody(
      "Sorted by risk",
      "The model ranks companies by how urgently they need intervention. Acme sits at the top. Click Next to drill into it."
    ),
  },
  {
    target: '[data-tour="ingestion"]',
    placement: "bottom",
    skipBeacon: true,
    content: stepBody(
      "How the data gets here",
      "APIs pull data from company databases in near real time, normalize it, and write it to the local store. The timestamp shows when the last batch ran."
    ),
  },
  {
    target: '[data-tour="ai-summary"]',
    placement: "bottom",
    skipBeacon: true,
    content: stepBody(
      "One-sentence briefing",
      "The model reads the underlying signals and writes a plain-English summary. Analysts land on the page and know the situation in five seconds."
    ),
  },
  {
    target: '[data-tour="actions"]',
    placement: "bottom",
    skipBeacon: true,
    content: stepBody(
      "Act without leaving the page",
      "Share Report generates a PDF and emails it. Schedule Meeting books a call with the company. Add Notes captures follow-ups against the company record."
    ),
  },
  {
    target: '[data-tour="nl-query"]',
    placement: "bottom",
    skipBeacon: true,
    content: stepBody(
      "Ask the AI assistant",
      "Learn more about the company in natural language. What changed in Q2? Which cohort is churning? No pinging the data team."
    ),
  },
  {
    target: '[data-tour="metric-tiles"]',
    placement: "top",
    skipBeacon: true,
    content: stepBody(
      "The three signals up close",
      "Each metric with its trailing sparkline and a directional arrow. Down for Revenue Growth and Runway, up for Burn Multiple. All three fire on this company."
    ),
  },
  {
    target: '[data-tour="runway-tile"]',
    placement: "bottom",
    skipBeacon: true,
    content: stepBody(
      "Runway explains the chart",
      "Runway sits at 4.1 months. The Cash Position chart below shows why: 30 days of accelerating burn. Orange pins mark the moments thresholds tripped; click a pin for the alert detail."
    ),
  },
  {
    target: '[data-tour="notes"]',
    placement: "top",
    skipBeacon: true,
    content: stepBody(
      "Team memory",
      "What the deal owner heard on the last call. Portfolio decisions live and die on this context. The same alerts can also fire to WhatsApp and email for the analyst and deal owner."
    ),
  },
  {
    target: '[data-tour="bell"]',
    placement: "bottom",
    skipBeacon: true,
    content: stepBody(
      "Push, don't pull",
      "Alerts fire as thresholds trip. Analysts don't need to check the dashboard to know something changed."
    ),
  },
  {
    target: "body",
    placement: "center",
    skipBeacon: true,
    content: stepBody(
      "Take a look around",
      "Every threshold, metric, and alert type is configurable. Restart this tour anytime from the Take the tour button up top."
    ),
  },
];

const TOUR_STORAGE_KEY = "pm-tour-seen-v1";

// Main App
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "company">("dashboard");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showHelpHint, setShowHelpHint] = useState(false);

  const goToDashboard = () => { setCurrentScreen("dashboard"); setShowNotifications(false); };

  useEffect(() => {
    let seen = false;
    try { seen = !!localStorage.getItem(TOUR_STORAGE_KEY); } catch { /* private mode */ }
    if (!seen) {
      const t = setTimeout(() => setRunTour(true), 600);
      return () => clearTimeout(t);
    }
    // Returning visitor: nudge the help icon for a few seconds
    const showT = setTimeout(() => setShowHelpHint(true), 400);
    const hideT = setTimeout(() => setShowHelpHint(false), 3400);
    return () => { clearTimeout(showT); clearTimeout(hideT); };
  }, []);

  const startTour = () => {
    setShowNotifications(false);
    setCurrentScreen("dashboard");
    setSelectedCompany(null);
    setTourStep(0);
    setRunTour(false);
    setTimeout(() => setRunTour(true), 100);
  };

  const finishTour = () => {
    setRunTour(false);
    setTourStep(0);
    try { localStorage.setItem(TOUR_STORAGE_KEY, "1"); } catch { /* private mode */ }
  };

  const handleTourEvent = (data: EventData) => {
    const { action, index, status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE || action === ACTIONS.SKIP) {
      finishTour();
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const next = index + (action === ACTIONS.PREV ? -1 : 1);

      // Cross-screen transitions
      // Leaving step 3 (Acme row) forward -> navigate into company view
      if (index === 3 && action === ACTIONS.NEXT) {
        setSelectedCompany(companiesData[0]);
        setCurrentScreen("company");
      }
      // Going back from step 4 (AI summary) -> return to dashboard
      if (index === 4 && action === ACTIONS.PREV) {
        setCurrentScreen("dashboard");
      }

      // Pause briefly on screen changes so the next target mounts
      const needsScreenChange = (index === 3 && action === ACTIONS.NEXT) || (index === 4 && action === ACTIONS.PREV);
      if (needsScreenChange) {
        setRunTour(false);
        setTimeout(() => {
          setTourStep(next);
          setRunTour(true);
        }, 300);
      } else {
        setTourStep(next);
      }
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-white shadow-2xl relative">
      <Joyride
        steps={tourSteps}
        run={runTour}
        stepIndex={tourStep}
        continuous
        scrollToFirstStep
        onEvent={handleTourEvent}
        locale={{ back: "Back", close: "Close", last: "Done", next: "Next", skip: "Skip tour" }}
        options={{
          primaryColor: "#111827",
          textColor: "#111827",
          zIndex: 10000,
          arrowColor: "#ffffff",
          overlayClickAction: false,
          scrollOffset: 80,
          showProgress: true,
          buttons: ["back", "skip", "primary"],
          skipBeacon: true,
        }}
        styles={{
          tooltip: { borderRadius: 12, padding: 20 },
          tooltipContent: { fontSize: 14, lineHeight: 1.55, padding: 0, textAlign: "left" as const },
          buttonNext: { backgroundColor: "#111827", borderRadius: 6, fontSize: 13, padding: "8px 14px" },
          buttonBack: { color: "#6b7280", fontSize: 13, marginRight: 8 },
          buttonSkip: { color: "#9ca3af", fontSize: 13 },
        }}
      />
      {currentScreen === "dashboard" && (
        <PortfolioDashboard
          onCompanyClick={(company: CompanyData) => { setSelectedCompany(company); setCurrentScreen("company"); }}
          onNotificationClick={() => setShowNotifications(true)}
          onLogoClick={goToDashboard}
          onStartTour={startTour}
          showHelpHint={showHelpHint}
          onDismissHelpHint={() => setShowHelpHint(false)}
        />
      )}
      {currentScreen === "company" && selectedCompany && (
        <CompanyView
          company={selectedCompany}
          onBack={() => setCurrentScreen("dashboard")}
          onNotificationClick={() => setShowNotifications(true)}
          onLogoClick={goToDashboard}
          onStartTour={startTour}
        />
      )}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
