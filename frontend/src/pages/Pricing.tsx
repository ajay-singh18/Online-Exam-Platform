import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { getPlans, getSubscriptionStatus, createOrder, verifyPayment } from '../api/paymentApi';
import LoadingSpinner from '../components/LoadingSpinner';

declare global { interface Window { Razorpay: any; } }

const PLAN_FEATURES: Record<string, string[]> = {
  free:    ['50 Students', '2 Admins', 'All Proctoring Features', 'Basic Analytics', 'Email Support'],
  starter: ['500 Students', '5 Admins', 'All Proctoring Features', 'Advanced Analytics', 'Report Cards', 'Priority Support'],
  pro:     ['2,000 Students', '20 Admins', 'All Proctoring Features', 'Full Analytics Suite', 'Report Cards', 'Team Management', 'Dedicated Support'],
};

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b',
  starter: '#3b82f6',
  pro: '#8b5cf6',
};

export default function Pricing() {
  const user = useAuthStore((s: any) => s.user);
  const addToast = useToastStore((s: any) => s.addToast);

  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [plansRes, statusRes] = await Promise.all([getPlans(), getSubscriptionStatus()]);
        setPlans(plansRes.data.plans || []);
        setCurrentPlan(statusRes.data.plan || 'free');
      } catch {
        addToast('Failed to load plans', 'error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  /* Load Razorpay script */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free' || planId === currentPlan) return;

    setProcessing(planId);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        addToast('Failed to load Razorpay. Check your internet connection.', 'error');
        setProcessing(null);
        return;
      }

      const { data } = await createOrder(planId);

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Online Exam Platform',
        description: `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        order_id: data.order.id,
        handler: async (response: any) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId,
            });
            setCurrentPlan(planId);
            addToast(`Successfully upgraded to ${planId} plan!`, 'success');
          } catch {
            addToast('Payment verification failed. Contact support.', 'error');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: PLAN_COLORS[planId] || '#3b82f6' },
        modal: {
          ondismiss: () => setProcessing(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        addToast(`Payment failed: ${resp.error.description}`, 'error');
      });
      rzp.open();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create order', 'error');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading plans..." />;

  return (
    <div style={{ padding: '2rem', maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-container)' }}>
          Choose Your Plan
        </h2>
        <p style={{ color: 'var(--on-secondary-container)', fontWeight: 500, fontSize: '1.0625rem', maxWidth: '36rem', margin: '0.5rem auto 0' }}>
          Scale your institute with the right plan. All plans include full proctoring features.
        </p>
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
        {plans.map((plan: any) => {
          const isCurrent = plan.id === currentPlan;
          const isDowngrade = plans.findIndex((p: any) => p.id === currentPlan) > plans.findIndex((p: any) => p.id === plan.id);
          const color = PLAN_COLORS[plan.id] || '#3b82f6';
          const features = PLAN_FEATURES[plan.id] || [];
          const isPopular = plan.id === 'starter';

          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--surface-container-lowest)',
                borderRadius: 'var(--radius-2xl)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative',
                boxShadow: isCurrent
                  ? `0 0 0 2px ${color}, 0 8px 32px ${color}20`
                  : '0 4px 20px rgba(30,58,138,0.04)',
                transition: 'box-shadow 0.3s',
              }}
            >
              {/* Popular badge */}
              {isPopular && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  color: '#fff', padding: '0.25rem 1rem', borderRadius: '999px',
                  fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em',
                }}>
                  POPULAR
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: '-12px', right: '1rem',
                  background: '#10b981',
                  color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '999px',
                  fontSize: '0.6875rem', fontWeight: 800,
                }}>
                  CURRENT
                </div>
              )}

              {/* Plan Name + Price */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color }}>
                      {plan.id === 'free' ? 'token' : plan.id === 'starter' ? 'rocket_launch' : 'diamond'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--on-surface)' }}>{plan.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color }}>
                    {plan.id === 'free' ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.id !== 'free' && (
                    <span style={{ color: 'var(--on-secondary-container)', fontWeight: 600 }}>/month</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--surface-container-high)' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {features.map((f: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9375rem', color: 'var(--on-surface)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color }}>check_circle</span>
                    <span style={{ fontWeight: 600 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || isDowngrade || processing !== null}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: 'none',
                  borderRadius: 'var(--radius-xl)',
                  fontWeight: 800,
                  fontSize: '0.9375rem',
                  cursor: isCurrent || isDowngrade ? 'not-allowed' : 'pointer',
                  background: isCurrent
                    ? 'var(--surface-container-high)'
                    : isDowngrade
                      ? 'var(--surface-container)'
                      : `linear-gradient(135deg, ${color}, ${color}cc)`,
                  color: isCurrent || isDowngrade ? 'var(--on-secondary-container)' : '#fff',
                  opacity: isCurrent || isDowngrade ? 0.6 : 1,
                  transition: 'transform 0.15s, opacity 0.15s',
                }}
              >
                {processing === plan.id
                  ? 'Processing...'
                  : isCurrent
                    ? 'Current Plan'
                    : isDowngrade
                      ? 'Downgrade N/A'
                      : plan.id === 'free'
                        ? 'Get Started'
                        : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div style={{
        background: 'var(--surface-container-lowest)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        boxShadow: '0 4px 20px rgba(30,58,138,0.04)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#3b82f6' }}>info</span>
        <p style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem', fontWeight: 600 }}>
          All plans include AI proctoring, tab-switch detection, question randomization, and real-time analytics.
          Upgrade only adds more student & admin capacity.
        </p>
      </div>
    </div>
  );
}
