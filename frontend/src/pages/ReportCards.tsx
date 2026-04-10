import { useState, useEffect, useMemo } from 'react';
import { getReportCards } from '../api/attemptApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReportCards() {
  const addToast = useToastStore((s: any) => s.addToast);

  const [reportCards, setReportCards] = useState<any[]>([]);
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'avg' | 'exams'>('name');

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await getReportCards();
        setReportCards(data.reportCards || []);
        setBatchNames(data.batchNames || []);
      } catch {
        addToast('Failed to load report cards', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const filtered = useMemo(() => {
    let list = reportCards;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }
    if (batchFilter) {
      list = list.filter((s: any) => s.batches?.includes(batchFilter));
    }
    if (sortBy === 'avg') {
      list = [...list].sort((a, b) => b.avgPercentage - a.avgPercentage);
    } else if (sortBy === 'exams') {
      list = [...list].sort((a, b) => b.totalExams - a.totalExams);
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [reportCards, search, batchFilter, sortBy]);

  const stats = useMemo(() => {
    const total = reportCards.length;
    const withExams = reportCards.filter((s: any) => s.totalExams > 0).length;
    const avgAll = total > 0
      ? Math.round(reportCards.reduce((sum: number, s: any) => sum + s.avgPercentage, 0) / (withExams || 1))
      : 0;
    const topPerformer = reportCards.reduce((best: any, s: any) =>
      !best || s.avgPercentage > best.avgPercentage ? s : best, null);
    return { total, withExams, avgAll, topPerformer };
  }, [reportCards]);

  if (loading) return <LoadingSpinner message="Loading report cards..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', verticalAlign: 'middle', marginRight: '0.5rem' }}>school</span>
          Report Cards
        </h2>
        <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>
          Comprehensive academic records for all students across batches
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Students', value: stats.total, icon: 'group', color: '#3b82f6' },
          { label: 'Attempted Exams', value: stats.withExams, icon: 'assignment_turned_in', color: '#10b981' },
          { label: 'Institute Avg', value: `${stats.avgAll}%`, icon: 'trending_up', color: '#f59e0b' },
          { label: 'Top Performer', value: stats.topPerformer?.name?.split(' ')[0] || '—', icon: 'emoji_events', color: '#ef4444' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-2xl)',
            padding: '1.25rem',
            boxShadow: '0 4px 20px rgba(30,58,138,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.375rem', color: card.color }}>{card.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--on-surface)' }}>{card.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-secondary-container)', fontWeight: 600 }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '16rem' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>search</span>
          <input
            className="ghost-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <select
          className="ghost-input"
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '10rem', paddingLeft: '1rem' }}
        >
          <option value="">All Batches</option>
          {batchNames.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <select
          className="ghost-input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '10rem', paddingLeft: '1rem' }}
        >
          <option value="name">Sort: Name</option>
          <option value="avg">Sort: Avg Score</option>
          <option value="exams">Sort: Most Exams</option>
        </select>
        <span style={{ color: 'var(--on-secondary-container)', fontSize: '0.8125rem', fontWeight: 600 }}>
          {filtered.length} student{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Student Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}>person_search</span>
          <p style={{ fontWeight: 600 }}>No students found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((s: any) => {
            const isOpen = expandedId === s._id;
            const avgColor = s.avgPercentage >= 70 ? '#10b981' : s.avgPercentage >= 40 ? '#f59e0b' : '#ef4444';
            const initial = s.name?.[0]?.toUpperCase() || '?';

            return (
              <div
                key={s._id}
                style={{
                  background: 'var(--surface-container-lowest)',
                  borderRadius: 'var(--radius-2xl)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(30,58,138,0.04)',
                  border: isOpen ? '1px solid var(--primary-container)' : '1px solid transparent',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : s._id)}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    textAlign: 'left',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${avgColor}30, ${avgColor}10)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '1rem', color: avgColor,
                    flexShrink: 0,
                  }}>
                    {initial}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.9375rem' }}>{s.name}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)' }}>
                      {s.email}
                      {s.batches.length > 0 && (
                        <span style={{ marginLeft: '0.5rem' }}>
                          • {s.batches.join(', ')}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Stats pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* Avg */}
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: 900, color: avgColor }}>{s.avgPercentage}%</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--on-secondary-container)', fontWeight: 600 }}>Avg</p>
                    </div>
                    {/* Exams */}
                    <div style={{ textAlign: 'center', minWidth: '40px' }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--primary-container)' }}>{s.totalExams}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--on-secondary-container)', fontWeight: 600 }}>Exams</p>
                    </div>
                    {/* Pass/Fail */}
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>{s.totalPassed} P</span>
                      {s.totalFailed > 0 && (
                        <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>{s.totalFailed} F</span>
                      )}
                    </div>
                    {/* Violations */}
                    {s.totalViolations > 0 && (
                      <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                        ⚠ {s.totalViolations}
                      </span>
                    )}
                    {/* Chevron */}
                    <span className="material-symbols-outlined" style={{
                      fontSize: '1.25rem', color: 'var(--on-secondary-container)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }}>expand_more</span>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isOpen && (
                  <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--surface-container-high)' }}>
                    {s.exams.length === 0 ? (
                      <p style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--on-secondary-container)', fontWeight: 600 }}>
                        No exam attempts yet
                      </p>
                    ) : (
                      <table className="data-table" style={{ marginTop: '0.5rem' }}>
                        <thead>
                          <tr>
                            <th>Exam</th>
                            <th style={{ textAlign: 'center' }}>Score</th>
                            <th style={{ textAlign: 'center' }}>Percentage</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'center' }}>Violations</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.exams.map((exam: any, idx: number) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{exam.examTitle}</td>
                              <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary-container)' }}>
                                {exam.score}/{exam.totalMarks}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 700 }}>{exam.percentage}%</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`badge ${exam.passed ? 'badge-success' : 'badge-danger'}`}>
                                  {exam.passed ? 'Pass' : 'Fail'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {exam.violations > 0 ? (
                                  <span className="badge badge-danger">{exam.violations}</span>
                                ) : (
                                  <span style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem' }}>0</span>
                                )}
                              </td>
                              <td style={{ fontSize: '0.8125rem', color: 'var(--on-secondary-container)' }}>
                                {exam.submittedAt ? new Date(exam.submittedAt).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Performance Bar */}
                    {s.totalExams > 0 && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-container)', borderRadius: 'var(--radius-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--on-surface)' }}>Overall Performance</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: avgColor }}>{s.avgPercentage}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${s.avgPercentage}%`,
                            background: `linear-gradient(90deg, ${avgColor}, ${avgColor}cc)`,
                            borderRadius: '4px',
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
