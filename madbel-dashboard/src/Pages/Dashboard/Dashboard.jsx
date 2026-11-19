import { useEffect, useMemo, useState } from "react";
import { Users, DollarSign, CreditCard, Clock, UserX, UserCheck } from "lucide-react";
import RecentUsersTable from "../../Components/Dashboard/RecentUsersTable";
import UserRatioChart from "../../Components/Dashboard/UserRatioChart";
import {
  getDashboardOverview,
  getSuperGlobalGrowth,
  getSuperPlatformSummary,
  getUserGrowth,
  getMyProfile,
  listUsersSafe,
} from "../../services/adminApi";

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const firstFinite = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
};

const extractItems = (payload) => {
  const data = payload?.data ?? payload;
  const visited = new Set();

  const findFirstArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return null;
    if (visited.has(value)) return null;
    visited.add(value);

    const priorityKeys = ["users", "items", "rows", "results", "docs", "data", "list"];
    for (const key of priorityKeys) {
      if (Array.isArray(value[key])) return value[key];
    }

    for (const key of Object.keys(value)) {
      const found = findFirstArray(value[key]);
      if (found) return found;
    }

    return null;
  };

  return findFirstArray(data) || [];
};

const normalizeMonthData = (analytics) => {
  const source =
    analytics?.monthlyUsers ||
    analytics?.userRatio ||
    analytics?.monthly ||
    analytics?.chart ||
    analytics?.chart_data ||
    analytics?.chartData ||
    [];

  if (!Array.isArray(source) || source.length === 0) return [];

  return source.map((item, index) => ({
    month:
      item?.month ||
      item?.label ||
      item?.name ||
      item?.x ||
      `M${index + 1}`,
    users: toNumber(item?.users ?? item?.value ?? item?.count, 0),
  }));
};

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, index) => String(currentYear - index)),
    [currentYear]
  );

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        
        // Load profile to verify role
        const profilePayload = await getMyProfile().catch(() => null);
        const profile = profilePayload?.data || profilePayload;
        const userRole = profile?.primary_role || profile?.role;
        const superAdminFlag = userRole === "super_admin" || userRole === "admin";
        
        if (mounted) {
          setIsSuperAdmin(superAdminFlag);
        }

        const [overviewPayload, usersPayload] = await Promise.all([
          superAdminFlag ? getSuperPlatformSummary() : getDashboardOverview(),
          listUsersSafe({ page: 1, limit: 5 }),
        ]);

        if (!mounted) return;

        setOverview(overviewPayload?.data || overviewPayload);

        const users = extractItems(usersPayload);
        setRecentUsers(users);
      } catch {
        if (mounted) {
          setOverview(null);
          setAnalytics(null);
          setRecentUsers([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      try {
        const analyticsPayload = isSuperAdmin
          ? await getSuperGlobalGrowth()
          : await getUserGrowth();
        if (!mounted) return;
        setAnalytics(analyticsPayload?.data || analyticsPayload);
      } catch {
        if (mounted) {
          setAnalytics(null);
        }
      }
    };

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, [selectedYear, isSuperAdmin]);

  // Extract stat items by matching labels
  const getStatByLabel = (labelToFind) => {
    if (overview?.stats && Array.isArray(overview.stats)) {
      const found = overview.stats.find(
        (s) => s.label?.toLowerCase() === labelToFind.toLowerCase()
      );
      if (found) {
        const strVal = String(found.value).replace(/[$,]/g, "");
        const numVal = parseFloat(strVal);
        return isNaN(numVal) ? found.value : numVal;
      }
    }
    return null;
  };

  const totalUsers = firstFinite(
    getStatByLabel("Total Users"),
    getStatByLabel("Total Platform Users"),
    overview?.totalUsers,
    overview?.usersCount,
    overview?.users,
    0
  );
  
  const totalRevenue = firstFinite(
    getStatByLabel("Organization Revenue"),
    getStatByLabel("Platform Revenue"),
    overview?.totalRevenue,
    overview?.revenueBreakdown?.totalRevenue,
    overview?.eventPlatformFeeRevenue + overview?.subscriptionRevenue,
    overview?.payments?.platformFee + overview?.subscriptionRevenue,
    overview?.payments?.platformFee,
    overview?.revenue,
    overview?.earnings,
    0
  );

  const payingCustomers = firstFinite(
    getStatByLabel("Paying Customers"),
    overview?.payingCustomers,
    overview?.customerCounts?.paying,
    overview?.paying_customers,
    0
  );

  const nonPayingUsers = firstFinite(
    getStatByLabel("Non-Paying Customers"),
    getStatByLabel("Non-Paying Users"),
    overview?.nonPayingUsers,
    overview?.customerCounts?.non_paying,
    overview?.non_paying,
    0
  );

  const activeTrials = firstFinite(
    getStatByLabel("Active Free-Trial Customers"),
    getStatByLabel("Active Trials"),
    overview?.activeTrials,
    overview?.customerCounts?.trial,
    overview?.active_trials,
    0
  );

  const expiredTrials = firstFinite(
    getStatByLabel("Expired Trials"),
    getStatByLabel("Total Registered Customers"),
    overview?.expiredTrials,
    overview?.totalRegistered,
    overview?.customerCounts?.total,
    0
  );

  const usersGrowth = overview?.usersGrowth ?? overview?.userGrowthPercent ?? null;
  const revenueGrowth = overview?.revenueGrowth ?? overview?.revenueGrowthPercent ?? null;

  const chartData = useMemo(() => normalizeMonthData(analytics), [analytics]);

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Total Platform Users */}
        <div className="p-5 bg-white border shadow-xs rounded-2xl border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users size={18} />
            </span>
            {usersGrowth !== undefined && usersGrowth !== null ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {usersGrowth > 0 ? "+" : ""}{usersGrowth}%
              </span>
            ) : null}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : totalUsers.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
              {isSuperAdmin ? "Total Platform Users" : "Total Users"}
            </p>
          </div>
        </div>

        {/* Card 2: Platform Revenue */}
        <div className="p-5 bg-white border shadow-xs rounded-2xl border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign size={18} />
            </span>
            {revenueGrowth !== undefined && revenueGrowth !== null ? (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                {revenueGrowth > 0 ? "+" : ""}{revenueGrowth}%
              </span>
            ) : null}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 truncate">
              {loading ? "..." : typeof totalRevenue === "number" ? `$${totalRevenue.toLocaleString()}` : totalRevenue}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
              {isSuperAdmin ? "Platform Revenue" : "Total Revenue"}
            </p>
          </div>
        </div>

        {/* Card 3: Paying Customers */}
        <div className="p-5 bg-white border shadow-xs rounded-2xl border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard size={18} />
            </span>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700 tracking-wider">
              Paid
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : payingCustomers.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
              Paying Customers
            </p>
          </div>
        </div>

        {/* Card 4: Active Free Trials */}
        <div className="p-5 bg-white border shadow-xs rounded-2xl border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock size={18} />
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 tracking-wider">
              Trial
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : activeTrials.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
              Active Trials
            </p>
          </div>
        </div>

        {/* Card 5: Non-Paying Users */}
        <div className="p-5 bg-white border shadow-xs rounded-2xl border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <UserX size={18} />
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 tracking-wider">
              Free
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : nonPayingUsers.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
              Non-Paying Users
            </p>
          </div>
        </div>

        {/* Card 6: Registered / Expired Trials */}
        <div className="p-5 bg-white border shadow-xs rounded-2xl border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <UserCheck size={18} />
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 tracking-wider">
              {isSuperAdmin ? "Total" : "Expired"}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900">
              {loading ? "..." : expiredTrials.toLocaleString()}
            </p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
              {isSuperAdmin ? "Registered Customers" : "Expired Trials"}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2 pr-1">
        <UserRatioChart
          data={chartData}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          yearOptions={yearOptions}
        />
        <div className="pb-2">
          <RecentUsersTable users={recentUsers} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
