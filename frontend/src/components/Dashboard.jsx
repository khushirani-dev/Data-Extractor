import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  FaSearch,
  FaDownload,
  FaBookOpen,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaChevronDown,
  FaPlay,
} from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ThemeToggle from './ThemeToggle';
import ResultsTable from './ResultsTable';
import Statistics from './Statistics';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Design tokens — "Field Ledger" theme
// An academic archive / catalog-card aesthetic: ink navy, parchment, and a
// brass accent, with a serif display face for headers and monospace for
// figures — as if the scraped data were being logged into a research ledger.
// ---------------------------------------------------------------------------
const INK = '#1B2A4A';
const INK_SOFT = '#33456B';
const PARCHMENT = '#FAF6EC';
const BRASS = '#C9A227';
const TEAL = '#2F6F62';
const RUST = '#A2492B';
const SLATE = '#5B647A';

const PIE_COLORS = [BRASS, TEAL, RUST, INK_SOFT, '#7A8A5A', '#8C6A9C'];

const FONT_LINK_ID = 'field-ledger-fonts';

// ---------------------------------------------------------------------------
// Search engine picker — lettermark badges in each engine's signature color.
// Abstracted monograms rather than literal wordmarks keep the picker crisp
// at small sizes with no extra logo assets required.
// ---------------------------------------------------------------------------
const EngineBadge = ({ engine, size = 20 }) => {
  const common = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700,
    fontSize: size * 0.5,
    flexShrink: 0,
    lineHeight: 1,
  };

  switch (engine) {
    case 'google':
      return (
        <span
          style={{
            ...common,
            background:
              'conic-gradient(from -45deg, #4285F4 0deg 90deg, #34A853 90deg 180deg, #FBBC05 180deg 270deg, #EA4335 270deg 360deg)',
            color: '#fff',
          }}
        >
          <span
            style={{
              width: size * 0.62,
              height: size * 0.62,
              borderRadius: '50%',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4285F4',
              fontSize: size * 0.42,
            }}
          >
            G
          </span>
        </span>
      );
    case 'bing':
      return <span style={{ ...common, background: '#008373', color: '#fff' }}>b</span>;
    case 'yahoo':
      return (
        <span style={{ ...common, background: '#5F01D1', color: '#fff', fontSize: size * 0.38 }}>
          Y!
        </span>
      );
    case 'duckduckgo':
      return (
        <span style={{ ...common, background: '#DE5833', color: '#fff', fontSize: size * 0.44 }}>
          D
        </span>
      );
    default:
      return null;
  }
};

const ENGINES = [
  { id: 'google', label: 'Google' },
  { id: 'bing', label: 'Bing' },
  { id: 'yahoo', label: 'Yahoo' },
  { id: 'duckduckgo', label: 'DuckDuckGo' },
];

// ---------------------------------------------------------------------------
// Scraper control bar — location input, search-engine picker, scrape button.
// Kept as an inner component (rather than a separate file) per the merge
// request, but still self-contained so it's easy to split back out later.
// ---------------------------------------------------------------------------
const INSTITUTION_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'school', label: 'Schools' },
  { id: 'coaching', label: 'Coaching Centers' },
  { id: 'institution', label: 'Institutes' },
];

const ScraperControls = ({ onScrape, loading }) => {
  const [location, setLocation] = useState('');
  const [institutionType, setInstitutionType] = useState(INSTITUTION_TYPES[0].id);
  const [engine, setEngine] = useState(ENGINES[0].id);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEngine = ENGINES.find((e) => e.id === engine);

  const handleSubmit = () => {
    if (!location.trim()) return;
    onScrape({ location: location.trim(), institutionType, searchEngine: engine });
  };

  return (
    <div className="fl-card rounded-xl p-5">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        {/* Search + Institution type, side by side */}
        <div className="flex-1 min-w-[280px] flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
              Search
            </label>
            <div className="relative">
              <FaSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: SLATE }}
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., New York, NY"
                className="fl-input w-full pl-9 pr-4 py-2.5 rounded-lg text-sm"
                style={{
                  background: PARCHMENT,
                  border: '1px solid rgba(27,42,74,0.15)',
                  color: INK,
                }}
              />
            </div>
          </div>

          <div className="min-w-[180px]">
            <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
              Institution Type
            </label>
            <select
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value)}
              className="fl-input w-full px-3.5 py-2.5 rounded-lg text-sm"
              style={{
                background: PARCHMENT,
                border: '1px solid rgba(27,42,74,0.15)',
                color: INK,
              }}
            >
              {INSTITUTION_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search engine picker */}
        <div className="min-w-[220px]" ref={menuRef}>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: INK }}>
            Search Engine
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm text-left"
              style={{
                background: PARCHMENT,
                border: `1px solid ${menuOpen ? BRASS : 'rgba(27,42,74,0.15)'}`,
                color: INK,
                boxShadow: menuOpen ? '0 0 0 3px rgba(201,162,39,0.18)' : 'none',
              }}
            >
              <EngineBadge engine={selectedEngine.id} />
              <span className="flex-1">{selectedEngine.label}</span>
              <FaChevronDown
                size={11}
                style={{
                  color: SLATE,
                  transform: menuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {menuOpen && (
              <ul
                className="absolute z-20 mt-1.5 w-full rounded-lg overflow-hidden py-1"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(27,42,74,0.12)',
                  boxShadow: '0 8px 24px rgba(27,42,74,0.14)',
                }}
              >
                {ENGINES.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEngine(e.id);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left"
                      style={{
                        color: INK,
                        background: e.id === engine ? 'rgba(201,162,39,0.10)' : 'transparent',
                      }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = 'rgba(27,42,74,0.05)')}
                      onMouseLeave={(ev) =>
                        (ev.currentTarget.style.background =
                          e.id === engine ? 'rgba(201,162,39,0.10)' : 'transparent')
                      }
                    >
                      <EngineBadge engine={e.id} />
                      <span className="flex-1">{e.label}</span>
                      {e.id === engine && (
                        <span className="fl-tag text-[10px]" style={{ color: BRASS }}>
                          selected
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleSubmit}
          disabled={loading || !location.trim()}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
          style={{
            background: loading || !location.trim() ? 'rgba(27,42,74,0.35)' : INK,
            color: PARCHMENT,
            cursor: loading || !location.trim() ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!loading && location.trim()) e.currentTarget.style.background = INK_SOFT;
          }}
          onMouseLeave={(e) => {
            if (!loading && location.trim()) e.currentTarget.style.background = INK;
          }}
        >
          {loading ? (
            <>
              <span
                className="inline-block w-3.5 h-3.5 rounded-full animate-spin"
                style={{ border: `2px solid ${PARCHMENT}`, borderTopColor: 'transparent' }}
              />
              Scraping…
            </>
          ) : (
            <>
              <FaPlay size={11} />
              Scraping Data
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const Dashboard = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Load display / body / mono fonts once.
  useEffect(() => {
    if (!document.getElementById(FONT_LINK_ID)) {
      const link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
    fetchInstitutions();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await api.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchInstitutions = async (filters = {}) => {
    try {
      const response = await api.getInstitutions(filters);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast.error('Failed to fetch data');
    }
  };

  const handleScrape = async (params) => {
    setLoading(true);
    try {
      const response = await api.scrapeInstitutions(params);
      toast.success(`Scraped ${response.data.length} institutions`);
      await fetchInstitutions();
      fetchStatistics();
    } catch (error) {
      toast.error('Scraping failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await api.exportData(format);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `institutions.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Ledger exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const filteredResults = results.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const statsData = useMemo(
    () =>
      stats || {
        total: results.length,
        byType: [],
        byCity: [],
      },
    [stats, results.length]
  );

  // Derive a type breakdown for the pie chart. Preffer the server-computed
  // stats; fall back to counting the currently loaded results so the chart
  // still renders before the first /statistics response arrives.
  const typeBreakdown = useMemo(() => {
    if (statsData.byType && statsData.byType.length > 0) {
      return statsData.byType.map((entry) => ({
        name: entry.type ?? entry.name ?? 'unspecified',
        value: entry.count ?? entry.value ?? 0,
      }));
    }
    const counts = {};
    results.forEach((item) => {
      const key = item.type || 'unspecified';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [statsData, results]);

  const totalCount = typeBreakdown.reduce((sum, d) => sum + d.value, 0) || statsData.total || 0;
  const cityCount = statsData.byCity?.length || new Set(results.map((r) => r.city).filter(Boolean)).size;

  return (
    <div
      className="min-h-screen"
      style={{
        background: PARCHMENT,
        fontFamily: "'Inter', sans-serif",
        color: INK,
      }}
    >
      <style>{`
        .fl-display { font-family: 'Fraunces', Georgia, serif; }
        .fl-mono { font-family: 'IBM Plex Mono', monospace; }
        .fl-card {
          background: #FFFFFF;
          border: 1px solid rgba(27, 42, 74, 0.10);
          box-shadow: 0 1px 2px rgba(27, 42, 74, 0.04);
        }
        .dark .fl-card {
          background: #1A2338;
          border-color: rgba(250, 246, 236, 0.08);
        }
        .fl-input:focus {
          outline: none;
          border-color: ${BRASS};
          box-shadow: 0 0 0 3px rgba(201, 162, 39, 0.18);
        }
        .fl-btn-primary {
          background: ${INK};
          color: ${PARCHMENT};
        }
        .fl-btn-primary:hover { background: ${INK_SOFT}; }
        .fl-btn-outline {
          background: transparent;
          border: 1px solid rgba(27, 42, 74, 0.25);
          color: ${INK};
        }
        .fl-btn-outline:hover { border-color: ${INK}; background: rgba(27, 42, 74, 0.04); }
        .dark .fl-btn-outline { color: ${PARCHMENT}; border-color: rgba(250,246,236,0.25); }
        .fl-tag {
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.04em;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ---------------------------------------------------------------- */}
        {/* Masthead                                                         */}
        {/* ---------------------------------------------------------------- */}
        <header
          className="flex items-start justify-between gap-6 pb-6 mb-8"
          style={{ borderBottom: `2px solid ${INK}` }}
        >
          <div>
            <div className="fl-tag text-xs uppercase mb-2" style={{ color: BRASS, letterSpacing: '0.18em' }}>
              Field Ledger · Vol. 01
            </div>
            <h1 className="fl-display text-4xl md:text-5xl" style={{ color: INK, fontWeight: 600 }}>
              Education Data Scraper
            </h1>
            <p className="mt-2 text-sm md:text-base" style={{ color: SLATE }}>
              A running catalog of educational institutions — schools, coaching
              centres, and institutes — extracted and cross-referenced.
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Scraper controls (location + search engine + scrape button)      */}
        {/* ---------------------------------------------------------------- */}
        <ScraperControls onScrape={handleScrape} loading={loading} />

        {/* ---------------------------------------------------------------- */}
        {/* Overview: stat cards + pie chart of composition                  */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: numeric summary, styled as catalog entries */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="fl-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(201,162,39,0.14)', color: BRASS }}
                >
                  <FaBookOpen />
                </div>
                <div>
                  <div className="fl-tag text-[11px] uppercase" style={{ color: SLATE }}>
                    Entries logged
                  </div>
                  <div className="fl-mono text-2xl font-semibold" style={{ color: INK }}>
                    {totalCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="fl-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(47,111,98,0.14)', color: TEAL }}
                >
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <div className="fl-tag text-[11px] uppercase" style={{ color: SLATE }}>
                    Cities represented
                  </div>
                  <div className="fl-mono text-2xl font-semibold" style={{ color: INK }}>
                    {cityCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="fl-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(162,73,43,0.14)', color: RUST }}
                >
                  <FaLayerGroup />
                </div>
                <div>
                  <div className="fl-tag text-[11px] uppercase" style={{ color: SLATE }}>
                    Categories tracked
                  </div>
                  <div className="fl-mono text-2xl font-semibold" style={{ color: INK }}>
                    {typeBreakdown.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Keep the existing Statistics component for anything else it renders */}
            <Statistics stats={statsData} />
          </div>

          {/* Right: composition pie chart, presented like a catalog card */}
          <div className="lg:col-span-3 fl-card rounded-xl p-6">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="fl-display text-xl" style={{ color: INK, fontWeight: 600 }}>
                Composition by type
              </h2>
              <span className="fl-tag text-[11px]" style={{ color: SLATE }}>
                n = {totalCount}
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: SLATE }}>
              Share of all logged institutions by category.
            </p>

            {typeBreakdown.length === 0 ? (
              <div
                className="h-64 flex items-center justify-center text-sm rounded-lg"
                style={{ color: SLATE, background: 'rgba(27,42,74,0.03)' }}
              >
                No entries yet — run a scrape to populate the ledger.
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div style={{ width: '100%', maxWidth: 260, height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={typeBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={100}
                        paddingAngle={2}
                        stroke={PARCHMENT}
                        strokeWidth={2}
                      >
                        {typeBreakdown.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} entries`, name]}
                        contentStyle={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 13,
                          borderRadius: 8,
                          border: `1px solid rgba(27,42,74,0.12)`,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend rendered as numbered ledger lines */}
                <div className="flex-1 w-full">
                  <ul className="divide-y" style={{ borderColor: 'rgba(27,42,74,0.08)' }}>
                    {typeBreakdown
                      .slice()
                      .sort((a, b) => b.value - a.value)
                      .map((entry, index) => {
                        const pct = totalCount ? ((entry.value / totalCount) * 100).toFixed(1) : '0.0';
                        const color =
                          PIE_COLORS[typeBreakdown.findIndex((e) => e.name === entry.name) % PIE_COLORS.length];
                        return (
                          <li key={entry.name} className="flex items-center gap-3 py-2.5">
                            <span className="fl-tag text-xs w-6" style={{ color: SLATE }}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                            <span className="capitalize flex-1 text-sm" style={{ color: INK }}>
                              {entry.name}
                            </span>
                            <span className="fl-mono text-sm" style={{ color: SLATE }}>
                              {entry.value}
                            </span>
                            <span className="fl-mono text-sm w-14 text-right font-semibold" style={{ color: INK }}>
                              {pct}%
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Results ledger                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-8 fl-card rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="fl-display text-xl" style={{ color: INK, fontWeight: 600 }}>
                Catalog
              </h2>
              <p className="text-xs" style={{ color: SLATE }}>
                Showing {filteredResults.length} of {results.length} entries
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: SLATE }} />
                <input
                  type="text"
                  placeholder="Search name, city, or email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="fl-input pl-9 pr-4 py-2 rounded-lg text-sm min-w-[220px]"
                  style={{
                    background: PARCHMENT,
                    border: '1px solid rgba(27,42,74,0.15)',
                    color: INK,
                  }}
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="fl-input px-3 py-2 rounded-lg text-sm"
                style={{
                  background: PARCHMENT,
                  border: '1px solid rgba(27,42,74,0.15)',
                  color: INK,
                }}
              >
                <option value="all">All types</option>
                <option value="coaching">Coaching</option>
                <option value="school">School</option>
                <option value="institution">Institution</option>
              </select>

              <button
                onClick={() => handleExport('csv')}
                className="fl-btn-outline px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <FaDownload size={12} /> CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="fl-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <FaDownload size={12} /> JSON
              </button>
            </div>
          </div>

          <ResultsTable data={filteredResults} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;


