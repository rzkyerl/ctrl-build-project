import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  Layers,
  Plus,
  ExternalLink,
  Globe,
  ArrowUpRight,
  ChevronRight,
  RefreshCw,
  Image,
  Tag,
  Smile,
  Frown,
  Activity,
} from "lucide-react";

interface RecentPortfolio {
  _id: string;
  title: string;
  category: string;
  slug: { current: string };
  imageUrl?: string;
  _updatedAt?: string;
  _createdAt?: string;
}

interface Stack {
  _id: string;
  name: string;
  slug: { current: string };
  iconUrl?: string;
  _updatedAt?: string;
  _createdAt?: string;
}

interface Portfolio {
  _id: string;
  title: string;
  category: string;
  slug: { current: string };
  imageUrl?: string;
  _updatedAt?: string;
  _createdAt?: string;
}

type ActivityItem = {
  id: string;
  type: "portfolio" | "stack";
  action: "created" | "updated";
  title: string;
  timestamp: string;
};

const FALLBACK_STATS = {
  portfolioCount: 0,
  stackCount: 0,
  recentPortfolios: [] as RecentPortfolio[],
};

const FALLBACK_ALL = {
  allPortfolios: [] as Portfolio[],
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  if (diffWeek < 5)
    return `${diffWeek} week${diffWeek > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function buildActivity(
  portfolios: Portfolio[],
  stacks: Stack[]
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const p of portfolios) {
    const timestamp = p._updatedAt || p._createdAt || "";
    if (!timestamp) continue;
    const isCreated = !!p._createdAt && p._updatedAt && p._createdAt === p._updatedAt;
    items.push({
      id: `portfolio-${p._id}`,
      type: "portfolio",
      action: isCreated ? "created" : "updated",
      title: p.title,
      timestamp,
    });
  }

  for (const s of stacks) {
    const timestamp = s._updatedAt || s._createdAt || "";
    if (!timestamp) continue;
    items.push({
      id: `stack-${s._id}`,
      type: "stack",
      action: "updated",
      title: s.name,
      timestamp,
    });
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
}

function computeHealth(portfolios: Portfolio[], stacks: Stack[]) {
  const total = portfolios.length;
  const withImage = portfolios.filter((p) => p.imageUrl).length;
  const withCategory = portfolios.filter((p) => p.category && p.category.trim().length > 0).length;
  const stacksWithIcon = stacks.filter((s) => s.iconUrl).length;

  const issues: string[] = [];
  if (total > 0 && withImage < total) issues.push(`${total - withImage} portfolio image${total - withImage > 1 ? "s" : ""} missing`);
  if (total > 0 && withCategory < total) issues.push(`${total - withCategory} portfolio categor${total - withCategory > 1 ? "ies" : "y"} missing`);
  if (stacks.length > 0 && stacksWithIcon < stacks.length) issues.push(`${stacks.length - stacksWithIcon} stack icon${stacks.length - stacksWithIcon > 1 ? "s" : ""} missing`);

  const healthy = issues.length === 0;
  const label = healthy ? "Healthy" : "Needs attention";
  const Icon = healthy ? Smile : Frown;
  const color = healthy ? "var(--ad-success)" : "var(--ad-warning)";

  return {
    label,
    Icon,
    color,
    portfolioImages: `${withImage}/${total}`,
    portfolioCategories: `${withCategory}/${total}`,
    stackIcons: `${stacksWithIcon}/${stacks.length}`,
    issues,
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [allPortfolios, setAllPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState(false);
  const [stackError, setStackError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setPortfolioError(false);
    setStackError(false);

    try {
      const [portfolioRes, stackRes] = await Promise.allSettled([
        fetch("/api/portfolios"),
        fetch("/api/stacks"),
      ]);

      if (portfolioRes.status === "fulfilled" && portfolioRes.value.ok) {
        const portfolioJson = await portfolioRes.value.json();
        if (portfolioJson.success) {
          const portfolioData: Portfolio[] = portfolioJson.data || [];
          setAllPortfolios(portfolioData);
          const sorted = [...portfolioData].sort((a, b) => {
            const ta = new Date(a._updatedAt || a._createdAt || 0).getTime();
            const tb = new Date(b._updatedAt || b._createdAt || 0).getTime();
            return tb - ta;
          });
          setStats((s) => ({
            ...s,
            portfolioCount: portfolioData.length,
            recentPortfolios: sorted.slice(0, 3).map((p) => ({
              _id: p._id,
              title: p.title,
              category: p.category,
              slug: p.slug,
              imageUrl: p.imageUrl,
              _updatedAt: p._updatedAt,
              _createdAt: p._createdAt,
            })),
          }));
        } else {
          setPortfolioError(true);
        }
      } else {
        setPortfolioError(true);
      }

      if (stackRes.status === "fulfilled" && stackRes.value.ok) {
        const stackJson = await stackRes.value.json();
        if (stackJson.success) {
          setStacks(stackJson.data || []);
          setStats((s) => ({
            ...s,
            stackCount: stackJson.data.length,
          }));
        } else {
          setStackError(true);
        }
      } else {
        setStackError(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activity = useMemo(() => buildActivity(stats.recentPortfolios, stacks), [stats.recentPortfolios, stacks]);
  const health = useMemo(() => computeHealth(allPortfolios, stacks), [allPortfolios, stacks]);

  if (loading) {
    return (
      <div>
        <div className="ad-page-header">
          <div>
            <h1 className="ad-page-title">Dashboard</h1>
            <p className="ad-page-subtitle">Manage your CTRLBuild website content from one place.</p>
          </div>
        </div>
        <div className="cb-dashboard-skeleton-grid">
          <div className="cb-dashboard-skeleton-card" />
          <div className="cb-dashboard-skeleton-card" />
        </div>
        <div className="cb-dashboard-skeleton-card" style={{ height: 120 }} />
        <div className="cb-dashboard-skeleton-card" style={{ height: 160 }} />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Dashboard</h1>
          <p className="ad-page-subtitle">
            {getGreeting()}, Admin. Manage your CTRLBuild website content from one place.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="ad-btn ad-btn-ghost ad-btn-sm"
            title="Refresh dashboard"
          >
            <RefreshCw size={14} style={refreshing ? { animation: "spin 1s linear infinite" } : undefined} />
          </button>
          <a
            href="https://www.ctrl-build.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="ad-btn ad-btn-ghost"
          >
            <ExternalLink size={14} />
            Visit Site
          </a>
        </div>
      </div>

      {/* Independent subtle notices */}
      {(portfolioError || stackError) && (
        <div className="ad-note">
          <Globe size={12} />
          {portfolioError && stackError
            ? "Portfolio and Stack data unavailable. Showing partial data."
            : portfolioError
            ? "Portfolio data unavailable. Showing partial data."
            : "Tech Stack data unavailable. Showing partial data."}
        </div>
      )}

      {/* Statistics */}
      <div className="cb-dashboard-stats">
        <Link to="/admin/portfolios" className="cb-dashboard-stat">
          <div className="cb-dashboard-stat-label">
            <FolderOpen size={14} />
            <span>Portfolios</span>
          </div>
          <div className="cb-dashboard-stat-value">{stats.portfolioCount}</div>
          <div className="cb-dashboard-stat-desc">Published projects</div>
        </Link>

        <Link to="/admin/stacks" className="cb-dashboard-stat">
          <div className="cb-dashboard-stat-label">
            <Layers size={14} />
            <span>Tech Stacks</span>
          </div>
          <div className="cb-dashboard-stat-value">{stats.stackCount}</div>
          <div className="cb-dashboard-stat-desc">Technologies used</div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="cb-section">
        <h2 className="cb-section-title">Quick Actions</h2>
        <div className="ad-quick-actions">
          <Link to="/admin/portfolios/create" className="ad-quick-action">
            <Plus size={14} />
            <span className="ad-quick-action-label">New Portfolio</span>
            <ArrowUpRight size={14} className="ad-quick-action-arrow" />
          </Link>
          <Link to="/admin/stacks/create" className="ad-quick-action">
            <Plus size={14} />
            <span className="ad-quick-action-label">New Tech Stack</span>
            <ArrowUpRight size={14} className="ad-quick-action-arrow" />
          </Link>
        </div>
      </div>

      {/* Recent Portfolios */}
      <div className="cb-section">
        <div className="cb-section-head">
          <h2 className="cb-section-title">Recent Portfolios</h2>
          <Link to="/admin/portfolios" className="ad-btn ad-btn-ghost ad-btn-sm">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {stats.recentPortfolios.length === 0 ? (
          <div className="ad-empty-compact">
            <div className="ad-empty-icon">📂</div>
            <p className="ad-empty-text">No portfolios yet</p>
            <p className="ad-empty-sub">Create your first portfolio to showcase your work.</p>
            <Link to="/admin/portfolios/create" className="ad-btn ad-btn-primary">
              <Plus size={14} /> Create Portfolio
            </Link>
          </div>
        ) : (
          <div className="ad-recent-grid">
            {stats.recentPortfolios.map((p) => {
              const relTime = formatRelativeTime(p._updatedAt || p._createdAt);
              return (
                <Link
                  key={p._id}
                  to={`/admin/portfolios/${p._id}`}
                  className="ad-recent-card"
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="ad-recent-card-img" />
                  ) : (
                    <div className="ad-recent-card-img ad-recent-card-img-placeholder">
                      <Image size={18} />
                    </div>
                  )}
                  <div className="ad-recent-card-info">
                    <div className="ad-recent-card-title">{p.title}</div>
                    <div className="ad-recent-card-meta">
                      <span className="ad-recent-card-cat">{p.category}</span>
                      {relTime && <span className="ad-recent-card-time">Updated {relTime}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="cb-section">
        <div className="cb-section-head">
          <h2 className="cb-section-title">Recent Activity</h2>
          <Activity size={14} style={{ color: "var(--ad-text-muted)" }} />
        </div>

        {activity.length === 0 ? (
          <div className="ad-empty-compact">
            <div className="ad-empty-icon">📭</div>
            <p className="ad-empty-text">No recent activity</p>
            <p className="ad-empty-sub">Create or update content to see activity here.</p>
          </div>
        ) : (
          <div className="cb-dashboard-activity">
            {activity.map((item) => (
              <div key={item.id} className="cb-dashboard-activity-item">
                <div className="cb-dashboard-activity-icon">
                  {item.type === "portfolio" ? <FolderOpen size={14} /> : <Layers size={14} />}
                </div>
                <div className="cb-dashboard-activity-body">
                  <div className="cb-dashboard-activity-title">
                    {item.type === "portfolio" ? "Portfolio" : "Tech Stack"} {item.action}
                  </div>
                  <div className="cb-dashboard-activity-name">{item.title}</div>
                </div>
                <div className="cb-dashboard-activity-time">
                  {formatRelativeTime(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Health */}
      <div className="cb-section">
        <div className="cb-section-head">
          <h2 className="cb-section-title">Content Health</h2>
          <span className="cb-dashboard-health-pill" style={{ color: health.color, borderColor: health.color }}>
            <health.Icon size={12} />
            {health.label}
          </span>
        </div>

        <div className="cb-dashboard-health-grid">
          <div className="cb-dashboard-health-item">
            <div className="cb-dashboard-health-label">Portfolio images</div>
            <div className="cb-dashboard-health-value">{health.portfolioImages}</div>
          </div>
          <div className="cb-dashboard-health-item">
            <div className="cb-dashboard-health-label">Portfolio categories</div>
            <div className="cb-dashboard-health-value">{health.portfolioCategories}</div>
          </div>
          <div className="cb-dashboard-health-item">
            <div className="cb-dashboard-health-label">Tech Stack icons</div>
            <div className="cb-dashboard-health-value">{health.stackIcons}</div>
          </div>
        </div>

        {health.issues.length > 0 && (
          <div className="cb-dashboard-health-issues">
            {health.issues.map((issue, idx) => (
              <div key={idx} className="cb-dashboard-health-issue">
                <span className="cb-dashboard-health-dot" style={{ background: health.color }} />
                {issue}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Management */}
      <div className="cb-section">
        <h2 className="cb-section-title">Content Management</h2>
        <div className="ad-overview-list">
          <Link to="/admin/portfolios" className="ad-overview-row ad-overview-link">
            <div className="ad-overview-info">
              <FolderOpen size={15} className="ad-overview-icon" />
              <div>
                <div className="ad-overview-name">Portfolio</div>
                <div className="ad-overview-type">Manage showcased projects</div>
              </div>
            </div>
            <ChevronRight size={15} className="ad-overview-arrow" />
          </Link>

          <Link to="/admin/stacks" className="ad-overview-row ad-overview-link">
            <div className="ad-overview-info">
              <Layers size={15} className="ad-overview-icon" />
              <div>
                <div className="ad-overview-name">Tech Stack</div>
                <div className="ad-overview-type">Manage technologies used across projects</div>
              </div>
            </div>
            <ChevronRight size={15} className="ad-overview-arrow" />
          </Link>

          <a
            href="https://www.ctrl-build.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="ad-overview-row ad-overview-link"
          >
            <div className="ad-overview-info">
              <ExternalLink size={15} className="ad-overview-icon" />
              <div>
                <div className="ad-overview-name">Public Website</div>
                <div className="ad-overview-type">Open the public CTRLBuild website</div>
              </div>
            </div>
            <ExternalLink size={15} className="ad-overview-arrow" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
