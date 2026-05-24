import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

/* ─── scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`landing-reveal ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ─── data ─── */
const FEATURES = [
  { icon: 'face_retouching_natural', color: 'blue', title: 'AI-Powered Proctoring', desc: 'Real-time face detection and tab-switch monitoring keep every exam honest — automatically.' },
  { icon: 'quiz', color: 'green', title: 'Rich Question Bank', desc: 'MCQ, MSQ, True/False, Fill-in-the-Blank with a rich-text editor, image support, and LaTeX.' },
  { icon: 'monitoring', color: 'navy', title: 'Real-Time Analytics', desc: 'Live performance dashboards, question-level accuracy heatmaps, and exportable reports.' },
  { icon: 'groups', color: 'blue', title: 'Batch Management', desc: 'Organise students into cohorts, assign exams to batches, and track group performance.' },
  { icon: 'auto_awesome', color: 'green', title: 'Instant Auto-Grading', desc: 'Results published the moment students submit — with detailed score breakdowns.' },
  { icon: 'encrypted', color: 'navy', title: 'Enterprise Security', desc: 'AES-256 encrypted tunnels, randomised question order, and tamper-proof answer storage.' },
];

const STEPS = [
  { num: 1, icon: 'edit_note', title: 'Create', desc: 'Build exams with our intuitive split-screen question editor and rich formatting.' },
  { num: 2, icon: 'send', title: 'Invite', desc: 'Enrol students individually or in batches — they get instant email invites.' },
  { num: 3, icon: 'insights', title: 'Analyse', desc: 'Get proctored results with AI integrity scores and deep analytics — in real time.' },
];

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, color: '#64748b', icon: 'token',
    features: ['Up to 25 students', '1 admin account', 'Basic proctoring', 'Email support', '5 exams/month'],
  },
  {
    id: 'starter', name: 'Starter', price: 499, color: '#3b82f6', icon: 'rocket_launch', featured: true,
    features: ['Up to 200 students', '5 admin accounts', 'AI proctoring + face detection', 'Priority support', 'Unlimited exams'],
  },
  {
    id: 'pro', name: 'Pro', price: 1499, color: '#8b5cf6', icon: 'diamond',
    features: ['Unlimited students', '25 admin accounts', 'Advanced analytics', 'Custom branding', 'API access'],
  },
];

/* ─── component ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page">
      {/* ━━━ NAVBAR ━━━ */}
      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <a href="/" className="landing-nav__logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="material-symbols-outlined filled landing-nav__logo-icon">shield_lock</span>
          <span className="landing-nav__logo-text">AcademicPro</span>
        </a>

        <ul className="landing-nav__links">
          <li><a href="#features" onClick={e => { e.preventDefault(); scrollTo('features'); }}>Features</a></li>
          <li><a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>How It Works</a></li>
          <li><a href="#pricing" onClick={e => { e.preventDefault(); scrollTo('pricing'); }}>Pricing</a></li>
        </ul>

        <div className="landing-nav__actions">
          <button className="landing-nav__login" onClick={() => navigate('/login')}>Log In</button>
          <button className="landing-nav__cta" onClick={() => navigate('/register')}>Get Started</button>
        </div>

        <button className="landing-nav__hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>{mobileOpen ? 'close' : 'menu'}</span>
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`landing-nav__mobile-menu${mobileOpen ? ' open' : ''}`}>
        <a href="#features" onClick={e => { e.preventDefault(); scrollTo('features'); }}>Features</a>
        <a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>How It Works</a>
        <a href="#pricing" onClick={e => { e.preventDefault(); scrollTo('pricing'); }}>Pricing</a>
        <a href="/login" onClick={e => { e.preventDefault(); setMobileOpen(false); navigate('/login'); }}>Log In</a>
        <button className="landing-nav__cta" style={{ marginTop: '0.5rem' }} onClick={() => { setMobileOpen(false); navigate('/register'); }}>Get Started Free</button>
      </div>

      {/* ━━━ HERO ━━━ */}
      <section className="landing-hero">
        <div className="landing-hero__orb landing-hero__orb--1" />
        <div className="landing-hero__orb landing-hero__orb--2" />
        <div className="landing-hero__orb landing-hero__orb--3" />

        <div className="landing-hero__badge">
          <span className="material-symbols-outlined filled">verified</span>
          Trusted by 500+ Institutions
        </div>

        <h1 className="landing-hero__title">
          Secure Exams,{' '}
          <span>Smarter Insights</span>
        </h1>

        <p className="landing-hero__subtitle">
          The all-in-one platform for creating, proctoring, and analysing exams.
          AI-powered integrity monitoring meets beautiful analytics — so you can focus on teaching.
        </p>

        <div className="landing-hero__actions">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Start Free Trial
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>arrow_forward</span>
          </button>
          <a href="#how-it-works" className="landing-hero__ghost-btn" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>play_circle</span>
            See How It Works
          </a>
        </div>

        <div className="landing-hero__trust">
          <div className="landing-hero__trust-item">
            <span className="landing-hero__trust-value">1.2M+</span>
            <span className="landing-hero__trust-label">Exams Proctored</span>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--surface-container-high)' }} />
          <div className="landing-hero__trust-item">
            <span className="landing-hero__trust-value">99.9%</span>
            <span className="landing-hero__trust-label">Uptime</span>
          </div>
          <div style={{ width: 1, height: 32, background: 'var(--surface-container-high)' }} />
          <div className="landing-hero__trust-item">
            <span className="landing-hero__trust-value">AES-256</span>
            <span className="landing-hero__trust-label">Encryption</span>
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━ */}
      <section id="features" className="landing-section">
        <RevealSection>
          <div className="landing-section__header">
            <p className="landing-section__label">Features</p>
            <h2 className="landing-section__title">Everything You Need to Run Exams</h2>
            <p className="landing-section__subtitle">
              From question authoring to AI proctoring and deep analytics — it's all built in.
            </p>
          </div>
        </RevealSection>

        <div className="landing-features__grid">
          {FEATURES.map((f, i) => (
            <RevealSection key={f.title} style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="landing-feature-card">
                <div className={`landing-feature-card__icon landing-feature-card__icon--${f.color}`}>
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
                <h3 className="landing-feature-card__title">{f.title}</h3>
                <p className="landing-feature-card__desc">{f.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section id="how-it-works" className="landing-how">
        <div className="landing-how__inner">
          <RevealSection>
            <div className="landing-section__header">
              <p className="landing-section__label">How It Works</p>
              <h2 className="landing-section__title">Up and Running in 3 Steps</h2>
              <p className="landing-section__subtitle">
                No complex setup. Create your first exam in under five minutes.
              </p>
            </div>
          </RevealSection>

          <div className="landing-how__steps">
            {STEPS.map((s, i) => (
              <RevealSection key={s.num} style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="landing-how__step">
                  <div className={`landing-how__step-number landing-how__step-number--${s.num}`}>
                    <span className="material-symbols-outlined landing-how__step-icon">{s.icon}</span>
                  </div>
                  <h3 className="landing-how__step-title">{s.title}</h3>
                  <p className="landing-how__step-desc">{s.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="landing-section">
        <RevealSection>
          <div className="landing-section__header">
            <p className="landing-section__label">Pricing</p>
            <h2 className="landing-section__title">Simple, Transparent Pricing</h2>
            <p className="landing-section__subtitle">
              Start free. Upgrade when you're ready. All plans include full proctoring and analytics.
            </p>
          </div>
        </RevealSection>

        <RevealSection>
          <div className="landing-pricing__grid">
            {PLANS.map(plan => (
              <div key={plan.id} className={`landing-pricing-card${plan.featured ? ' landing-pricing-card--featured' : ''}`}>
                {plan.featured && <div className="landing-pricing-card__badge">Most Popular</div>}

                <div className="landing-pricing-card__header">
                  <div className="landing-pricing-card__icon" style={{ background: `${plan.color}15` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: plan.color }}>{plan.icon}</span>
                  </div>
                  <h3 className="landing-pricing-card__name">{plan.name}</h3>
                </div>

                <div className="landing-pricing-card__price">
                  <span className="landing-pricing-card__amount" style={{ color: plan.color }}>
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.price !== 0 && <span className="landing-pricing-card__period">/month</span>}
                </div>

                <div className="landing-pricing-card__divider" />

                <ul className="landing-pricing-card__features">
                  {plan.features.map((f, i) => (
                    <li key={i}>
                      <span className="material-symbols-outlined" style={{ color: plan.color }}>check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className={`landing-pricing-card__cta ${plan.featured ? 'landing-pricing-card__cta--primary' : 'landing-pricing-card__cta--secondary'}`}
                  onClick={() => navigate('/login')}
                >
                  {plan.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Info note */}
        <RevealSection style={{ marginTop: '2rem' }}>
          <div style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            border: '1px solid var(--surface-container-high)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: '#3b82f6' }}>info</span>
            <p style={{ color: 'var(--on-secondary-container)', fontSize: '0.875rem', fontWeight: 600 }}>
              All plans include AI proctoring, tab-switch detection, question randomisation, and real-time analytics. Upgrades only add capacity.
            </p>
          </div>
        </RevealSection>
      </section>

      {/* ━━━ CTA BANNER ━━━ */}
      <RevealSection>
        <section style={{
          margin: '0 2rem 4rem',
          background: 'var(--auth-gradient)',
          borderRadius: 'var(--radius-2xl)',
          padding: 'clamp(3rem, 6vw, 5rem) 2rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '72rem',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(60px)' }} />
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
            Ready to Transform Your Exams?
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.75)', maxWidth: '32rem', margin: '0 auto 2rem', fontWeight: 500, lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
            Join hundreds of institutions already using AcademicPro to deliver secure, insightful exams.
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: '#fff',
              color: 'var(--primary-container)',
              padding: '0.875rem 2.5rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
          >
            Get Started Free →
          </button>
        </section>
      </RevealSection>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__grid">
            <div>
              <div className="landing-footer__brand-name">
                <span className="material-symbols-outlined filled" style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.7)' }}>shield_lock</span>
                AcademicPro
              </div>
              <p className="landing-footer__brand-desc">
                The modern exam platform for coaching centres, colleges, and schools. Create, proctor, and analyse — all in one place.
              </p>
            </div>

            <div className="landing-footer__col">
              <p className="landing-footer__col-title">Product</p>
              <ul>
                <li><a href="#features" onClick={e => { e.preventDefault(); scrollTo('features'); }}>Features</a></li>
                <li><a href="#pricing" onClick={e => { e.preventDefault(); scrollTo('pricing'); }}>Pricing</a></li>
                <li><a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>How It Works</a></li>
                <li><a href="/register" onClick={e => { e.preventDefault(); navigate('/register'); }}>Get Started</a></li>
              </ul>
            </div>

            <div className="landing-footer__col">
              <p className="landing-footer__col-title">Company</p>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>

            <div className="landing-footer__col">
              <p className="landing-footer__col-title">Legal</p>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Accessibility</a></li>
              </ul>
            </div>
          </div>

          <div className="landing-footer__bottom">
            <p className="landing-footer__copyright">© {new Date().getFullYear()} AcademicPro. All rights reserved.</p>
            <div className="landing-footer__socials">
              <button className="landing-footer__social-btn" aria-label="Twitter">
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>flutter</span>
              </button>
              <button className="landing-footer__social-btn" aria-label="LinkedIn">
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>business_center</span>
              </button>
              <button className="landing-footer__social-btn" aria-label="GitHub">
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>code</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
