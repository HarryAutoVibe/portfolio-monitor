import { useState } from "react";
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
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

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

const chartData = Array.from({ length: 30 }, (_, i) => {
  const t = i / 29;
  const base = 9.3 - 1.7 * (t * t * 0.6 + t * 0.4);
  const noise = [0, 0.04, -0.03, 0.05, -0.02, 0.06, -0.04, 0.03, -0.05, 0.02, -0.06, 0.04, -0.03, 0.05, -0.07, 0.03, -0.04, 0.06, -0.05, 0.02, -0.08, 0.03, -0.06, 0.04, -0.09, 0.02, -0.07, 0.03, -0.05, 0][i];
  return { day: i + 1, balance: Math.round((base + noise) * 100) / 100, hasAlert: i === 10 || i === 23 };
});

const alertDetails = [
  { day: 11, title: "Runway crossed 6-month threshold", timestamp: "Sep 12, 2026 at 3:42 PM", severity: "Critical" },
  { day: 24, title: "Net burn accelerated 40% WoW", timestamp: "Sep 25, 2026 at 9:15 AM", severity: "Critical" },
];

const notificationsData: Notification[] = [
  { id: 1, companyName: "Acme Industries Ltd.", description: "Runway dropped below 6 months (now 4.1 mo)", severity: "red", timestamp: "2 hours ago", isRead: false },
  { id: 2, companyName: "Northwind Trading Co.", description: "Burn multiple climbed to 3.9x this quarter", severity: "red", timestamp: "3 hours ago", isRead: false },
  { id: 3, companyName: "Apex Software", description: "Net revenue retention slipped for a second quarter", severity: "yellow", timestamp: "5 hours ago", isRead: false },
  { id: 4, companyName: "Helios Capital", description: "Approaching 12-month runway threshold", severity: "yellow", timestamp: "1 day ago", isRead: true },
  { id: 5, companyName: "Riverstone Partners", description: "ARR growth accelerated to +34% QoQ", severity: "green", timestamp: "1 day ago", isRead: true },
  { id: 6, companyName: "Acme Industries Ltd.", description: "New cohort churn exceeded 5% threshold", severity: "red", timestamp: "2 days ago", isRead: true },
];

function TopBar({ onNotificationClick, onLogoClick }: { onNotificationClick?: () => void; onLogoClick?: () => void }) {
  return (
    <div className="h-16 border-b border-gray-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-2">
      <button onClick={onLogoClick} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
        <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-sm" />
        </div>
        <span className="text-lg font-semibold text-gray-900">Portfolio Monitor</span>
      </button>
      <div className="flex-1 min-w-0 max-w-xl mx-3 sm:mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search companies..." className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
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
function PortfolioDashboard({ onCompanyClick, onNotificationClick, onLogoClick }: any) {
  return (
    <div className="min-h-screen bg-white">
      <TopBar onNotificationClick={onNotificationClick} onLogoClick={onLogoClick} />
      <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-gray-500">Last updated: 14 minutes ago. All systems operational.</span>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6 overflow-x-auto whitespace-nowrap">
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
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Growth (QoQ)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Runway (mo)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Burn Multiple</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {companiesData.map((company) => (
                <tr key={company.id} className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${company.status === "At Risk" ? "border-l-4 border-l-red-500" : ""}`} onClick={() => onCompanyClick(company)}>
                  <td className="px-4 py-4"><button className="text-sm font-medium hover:underline">{company.name}</button></td>
                  <td className="px-4 py-4"><StatusPill status={company.status} /></td>
                  <td className="px-4 py-4"><span className={`text-sm font-medium ${company.revenueGrowth < 0 ? "text-red-600" : company.revenueGrowth < 10 ? "text-gray-900" : "text-green-600"}`}>{company.revenueGrowth > 0 ? "+" : ""}{company.revenueGrowth.toFixed(1)}%</span></td>
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
function CompanyView({ company, onBack, onNotificationClick, onLogoClick }: any) {
  const [activeAlertPopup, setActiveAlertPopup] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <TopBar onNotificationClick={onNotificationClick} onLogoClick={onLogoClick} />
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
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{company.name}</h1>
              <StatusPill status={company.status} />
              <button className="text-sm text-blue-600 hover:underline">Override Status</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Share Report</button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Schedule Meeting</button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">Add Notes</button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-sm text-gray-500">
            <span>Deal Owner: <span className="font-medium text-gray-900">{company.owner}</span></span>
            <span>Last batch processed: Sep 28, 2026 2:14 PM</span>
          </div>
        </div>

        {/* AI Summary - highlighted */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">AI Summary</p>
              <p className="text-sm leading-relaxed text-gray-800">
                Revenue growth turned negative in Q2 (-4.2% QoQ). Cash runway now at 4.1 months. Burn multiple climbed to 4.8x — the company is spending $4.80 for every $1 of net new ARR. Recommend immediate review.
              </p>
            </div>
          </div>
        </div>

        {/* NL Query Bar */}
        <div className="mb-6">
          <div className="relative">
            <input type="text" placeholder="Ask a question about this company..." className="w-full h-12 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg">
              <Send className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">e.g. What is the monthly burn rate? Which cohorts are churning?</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <MetricCard title="Revenue Growth (QoQ)" value="-4.2%" status="At Risk" trend="down" />
          <MetricCard title="Runway" value="4.1 mo" status="At Risk" trend="down" />
          <MetricCard title="Burn Multiple" value="4.8x" status="At Risk" trend="up" />
        </div>

        {/* Chart */}
        <div className="border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 relative">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cash Position — Last 30 Days</h3>
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
                <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} domain={[7.2, 9.5]} tickFormatter={(value) => `$${value.toFixed(1)}M`} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, index, payload } = props;
                    if (payload.hasAlert) {
                      return (
                        <circle
                          key={index}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#fb923c"
                          stroke="#fff"
                          strokeWidth={2}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAlertPopup(activeAlertPopup === payload.day ? null : payload.day);
                          }}
                        />
                      );
                    }
                    return <circle key={index} cx={cx} cy={cy} r={0} fill="none" />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Alert popup tooltip */}
          {activeAlertPopup && (
            <div className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72 max-w-[calc(100vw-2rem)] z-10" style={{ top: activeAlertPopup === 11 ? "80px" : "140px", left: activeAlertPopup === 11 ? "280px" : "580px" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Alert Detail</span>
                <button onClick={() => setActiveAlertPopup(null)} className="p-0.5 hover:bg-gray-100 rounded">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {alertDetails.find(a => a.day === activeAlertPopup)?.title}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                {alertDetails.find(a => a.day === activeAlertPopup)?.timestamp}
              </p>
              <div className="mb-3">
                <StatusPill status="Critical" />
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 font-medium">Acknowledge</button>
                <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50 font-medium flex items-center gap-1">
                  Dismiss <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              {/* Arrow pointing to dot */}
              <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
            </div>
          )}

          <p className="text-xs text-gray-400 mt-2">Click orange dots to view alert details</p>
        </div>

        {/* Notes & History */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes &amp; History</h3>
          <div className="space-y-3">
            <div className="border-l-2 border-gray-200 pl-4 py-2">
              <p className="text-sm"><span className="font-medium">Sarah Chen</span>, Sep 22: Spoke to CFO. Cost-reduction plan targets a 30% burn cut by Q4.</p>
            </div>
            <div className="border-l-2 border-gray-200 pl-4 py-2">
              <p className="text-sm"><span className="font-medium">Marcus Lee</span>, Sep 20: Flagged Q2 growth deceleration, watching pipeline conversion.</p>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Alerts</h3>
          <div className="space-y-3">
            <AlertItem severity="red" title="Runway crossed 6-month threshold" timestamp="2 hours ago" />
            <AlertItem severity="red" title="Net burn accelerated 40% WoW" timestamp="1 day ago" />
            <AlertItem severity="yellow" title="New cohort churn exceeded 5%" timestamp="3 days ago" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, status, trend }: { title: string; value: string; status: string; trend: string }) {
  const trendData = trend === "up" ? [4, 5, 4.5, 6, 7, 6.5, 8] : trend === "down" ? [8, 7, 7.5, 6, 5, 5.5, 4] : [5, 5.5, 5, 6, 5.5, 6, 5.5];
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className="flex items-end justify-between mb-2">
        <div className={`text-2xl font-bold ${status === "At Risk" ? "text-red-600" : "text-gray-900"}`}>{value}</div>
        <div className="h-8 w-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.map((v, i) => ({ value: v, index: i }))}>
              <Line type="monotone" dataKey="value" stroke={status === "At Risk" ? "#dc2626" : "#16a34a"} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <StatusPill status={status as RiskStatus} />
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

// Main App
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "company">("dashboard");
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const goToDashboard = () => { setCurrentScreen("dashboard"); setShowNotifications(false); };

  return (
    <div className="w-full max-w-[1440px] mx-auto bg-white shadow-2xl relative">
      {currentScreen === "dashboard" && (
        <PortfolioDashboard
          onCompanyClick={(company: CompanyData) => { setSelectedCompany(company); setCurrentScreen("company"); }}
          onNotificationClick={() => setShowNotifications(true)}
          onLogoClick={goToDashboard}
        />
      )}
      {currentScreen === "company" && selectedCompany && (
        <CompanyView
          company={selectedCompany}
          onBack={() => setCurrentScreen("dashboard")}
          onNotificationClick={() => setShowNotifications(true)}
          onLogoClick={goToDashboard}
        />
      )}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
