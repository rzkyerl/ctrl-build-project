import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  Layers,
  Plus,
  ExternalLink,
  Globe,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { sanityClient } from "../../../backend/lib/sanity";

interface RecentPortfolio {
  _id: string;
  title: string;
  category: string;
  slug: { current: string };
  image?: { asset?: { url: string } };
}

interface Stats {
  portfolioCount: number;
  stackCount: number;
  recentPortfolios: RecentPortfolio[];
}

const FALLBACK_STATS: Stats = {
  portfolioCount: 0,
  stackCount: 0,
  recentPortfolios: [],
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>(FALLBACK_STATS);
  const [cmsError, setCmsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Pertahankan query Sanity existing — GAGAL -> fallback
        const [portfolioCount, stackCount, recentPortfolios] =
          await Promise.all([
            sanityClient.fetch<number>(`count(*[_type == "portfolio"])`),
            sanityClient.fetch<number>(`count(*[_type == "stack"])`),
            sanityClient.fetch<RecentPortfolio[]>(`
            *[_type == "portfolio"] | order(_createdAt desc) [0...3] {
              _id, title, category,
              slug,
              "image": image { asset->{ url } }
            }
          `),
          ]);
        setStats({ portfolioCount, stackCount, recentPortfolios });
      } catch {
        // Halaman tetap render — hanya inform bahwa data CMS gagal dimuat
        setCmsError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="ad-loading">LOADING...</div>;

  return (
    <div>
      {/* Page Header */}
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Dashboard</h1>
          <p className="ad-page-subtitle">
            Manage and monitor your CTRLBuild website content.
          </p>
        </div>
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

      {/* Subtle CMS notice (not a blocking error banner) */}
      {cmsError && (
        <div className="ad-note">
          <Globe size={12} />
          CMS data unavailable. Showing fallback data.
        </div>
      )}

      {/* Welcome / Overview Card */}
      <div className="ad-welcome-card">
        <div className="ad-welcome-title">Welcome back, Admin.</div>
        <div className="ad-welcome-desc">
          Manage your portfolio, technology stack, and website content from one
          place.
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="ad-stats-grid">
        <div className="ad-stat-card">
          <div className="ad-stat-label">
            <FolderOpen
              size={12}
              style={{ display: "inline", marginRight: 4 }}
            />
            Portfolios
          </div>
          <div className="ad-stat-value">{stats.portfolioCount}</div>
          <div className="ad-stat-desc">Published projects</div>
        </div>

        <div className="ad-stat-card">
          <div className="ad-stat-label">
            <Layers size={12} style={{ display: "inline", marginRight: 4 }} />
            Tech Stacks
          </div>
          <div className="ad-stat-value">{stats.stackCount}</div>
          <div className="ad-stat-desc">Technologies used</div>
        </div>
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
          <Link
            to="/admin/portfolios"
            className="ad-btn ad-btn-ghost ad-btn-sm"
          >
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {stats.recentPortfolios.length === 0 ? (
          <div className="ad-empty-compact">
            <div className="ad-empty-icon">📂</div>
            <p className="ad-empty-text">No portfolios yet</p>
            <p className="ad-empty-sub">
              Create your first portfolio to showcase your work.
            </p>
            <Link
              to="/admin/portfolios/create"
              className="ad-btn ad-btn-primary"
            >
              <Plus size={14} /> Create Portfolio
            </Link>
          </div>
        ) : (
          <div className="ad-recent-grid">
            {stats.recentPortfolios.map((p) => (
              <Link
                key={p._id}
                to={`/admin/portfolios/${p._id}`}
                className="ad-recent-card"
              >
                {p.image?.asset?.url ? (
                  <img
                    src={p.image.asset.url}
                    alt={p.title}
                    className="ad-recent-card-img"
                  />
                ) : (
                  <div
                    className="ad-recent-card-img"
                    style={{
                      background: "var(--ad-surface2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--ad-text-muted)",
                      fontSize: 12,
                    }}
                  >
                    No image
                  </div>
                )}
                <div className="ad-recent-card-info">
                  <div className="ad-recent-card-title">{p.title}</div>
                  <div className="ad-recent-card-cat">{p.category}</div>
                </div>
              </Link>
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
                <div className="ad-overview-type">
                  Manage and organize showcased projects
                </div>
              </div>
            </div>
            <ChevronRight size={15} className="ad-overview-arrow" />
          </Link>

          <Link to="/admin/stacks" className="ad-overview-row ad-overview-link">
            <div className="ad-overview-info">
              <Layers size={15} className="ad-overview-icon" />
              <div>
                <div className="ad-overview-name">Tech Stack</div>
                <div className="ad-overview-type">
                  Manage technologies displayed on the website
                </div>
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
                <div className="ad-overview-type">
                  Open the public CTRLBuild website
                </div>
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
