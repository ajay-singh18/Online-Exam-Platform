import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamSummary } from '../api/analyticsApi';
import { getExams } from '../api/examApi';
import { useToastStore } from '../store/toastStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = ['#0053db', '#00174b', '#4EDEA3', '#F59E0B', '#6366F1', '#EC4899'];

export default function ExamAnalytics() {
  const { examId: routeExamId } = useParams();
  const navigate = useNavigate();
  const addToast = useToastStore((s: any) => s.addToast);

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState(routeExamId || '');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await getExams();
        const all = data.exams || data || [];
        setExams(all);
        if (!selectedExamId && all.length > 0) setSelectedExamId(all[0]._id);
      } catch { addToast('Failed to load exams', 'error'); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const { data } = await getExamSummary(selectedExamId);
        setSummary(data.summary || data);
      } catch { setSummary(null); }
      finally { setLoadingSummary(false); }
    };
    fetchSummary();
  }, [selectedExamId]);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  const scoreDistribution = summary?.scoreDistribution || [];
  const questionAccuracy = summary?.questionAccuracy || [];
  const timePerQuestion = summary?.avgTimePerQuestion || [];

  return (
    <div style={{ padding: '2rem', maxWidth: '80rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>Exam Analytics</h2>
          <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500 }}>Performance insights and detailed statistics</p>
        </div>
        <select className="ghost-input" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} style={{ borderRadius: 'var(--radius-sm)', width: 'auto', minWidth: '16rem', paddingLeft: '1rem' }}>
          {exams.map((e: any) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
      </div>

      {loadingSummary ? <LoadingSpinner message="Computing analytics..." /> : !summary ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--on-secondary-container)', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)' }}>
          <p style={{ fontWeight: 600 }}>No analytics data available for this exam yet.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { label: 'Total Attempts', value: summary.totalAttempts ?? 0, icon: 'group' },
              { label: 'Avg Score', value: `${summary.avgScore ?? 0}%`, icon: 'trending_up' },
              { label: 'Pass Rate', value: `${summary.passRate ?? 0}%`, icon: 'check_circle' },
              { label: 'Highest Score', value: `${summary.highestScore ?? 0}%`, icon: 'emoji_events' },
            ].map(stat => (
              <div key={stat.label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="label-xs" style={{ color: 'var(--on-secondary-container)' }}>{stat.label}</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary-container)', fontSize: '1.25rem' }}>{stat.icon}</span>
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-container)' }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Score Distribution */}
          {scoreDistribution.length > 0 && (
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--primary-container)', fontSize: '1rem', marginBottom: '1.5rem' }}>Score Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-container-high)" />
                  <XAxis dataKey="range" stroke="var(--on-secondary-container)" fontSize={12} fontWeight={600} />
                  <YAxis stroke="var(--on-secondary-container)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {scoreDistribution.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-Question Accuracy */}
          {questionAccuracy.length > 0 && (
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--primary-container)', fontSize: '1rem', marginBottom: '1.5rem' }}>Per-Question Accuracy (%)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-container-high)" />
                  <XAxis dataKey="label" stroke="var(--on-secondary-container)" fontSize={11} fontWeight={600} />
                  <YAxis stroke="var(--on-secondary-container)" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} />
                  <Bar dataKey="accuracy" fill="#4EDEA3" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Avg Time Per Question */}
          {timePerQuestion.length > 0 && (
            <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)' }}>
              <h3 style={{ fontWeight: 800, color: 'var(--primary-container)', fontSize: '1rem', marginBottom: '1.5rem' }}>Avg Time Per Question (seconds)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timePerQuestion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-container-high)" />
                  <XAxis dataKey="label" stroke="var(--on-secondary-container)" fontSize={11} fontWeight={600} />
                  <YAxis stroke="var(--on-secondary-container)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} />
                  <Bar dataKey="avgTime" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
