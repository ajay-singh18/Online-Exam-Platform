import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function Help() {
  const user = useAuthStore((s: any) => s.user);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getFaqs = () => {
    if (user?.role === 'superAdmin') {
      return [
        { q: "How do I onboard a new Institute?", a: "Navigate to the Institutes tab, click Add New Institute, and set up the Admin access." },
        { q: "How do I review Platform Analytics?", a: "The Platform Analytics tab aggregates usage and violation metrics across all institutions." },
        { q: "Where can I find API Documentation?", a: "The REST API documentation is hosted internally on your IT portal for secure integrations." }
      ];
    } else if (user?.role === 'admin') {
      return [
        { q: "How do I create a new exam?", a: "Go to the Exams tab and click 'Create Exam'. You can add questions from the Question Bank." },
        { q: "How do I handle proctoring flags?", a: "Navigate to the Results section of an exam to review individual attempts. False positives can be manually overridden." },
        { q: "How do I add students to a Batch?", a: "Under the Batches tab, you can assign users by email or upload a CSV." }
      ];
    } else {
      // Student
      return [
        { q: "What should I do if my internet disconnects during an exam?", a: "The exam will auto-pause. Reconnect as soon as possible to resume. Excessive disconnections may be flagged." },
        { q: "How does the proctoring work?", a: "The AI proctor monitors your webcam, tab switches, and audio environment. Ensure you stay in full-screen mode." },
        { q: "Where do I see my results?", a: "Once your institute releases the grades, they will appear in the Results tab on your sidebar." }
      ];
    }
  };

  const getTitle = () => {
    switch (user?.role) {
      case 'superAdmin': return "Platform Documentation & Support";
      case 'admin': return "Admin Guides & Help Center";
      default: return "Student Support Desk";
    }
  };

  const faqs = getFaqs();

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem', maxWidth: '60rem', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-container)' }}>{getTitle()}</h1>
        <p style={{ color: 'var(--on-secondary-container)' }}>Find answers to common questions or reach out to support.</p>
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="hover:bg-surface-container-low transition-colors"
                style={{ 
                  background: 'var(--surface-container-lowest)', 
                  borderRadius: 'var(--radius-lg)', 
                  boxShadow: '0 4px 15px rgba(30,58,138,0.02)',
                  overflow: 'hidden'
                }}
              >
                <button 
                  onClick={() => toggleFaq(idx)}
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1.25rem', 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--on-surface)'
                  }}>
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined" style={{ 
                    transform: openFaq === idx ? 'rotate(180deg)' : 'none', 
                    transition: 'transform 0.2s',
                    color: 'var(--primary)'
                  }}>
                    expand_more
                  </span>
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', color: 'var(--secondary)', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-2xl)', padding: '2rem', boxShadow: '0 8px 32px rgba(30,58,138,0.05)', alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1.125rem' }}>Contact Support</h3>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Still need help? Send us a message.</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); alert('We have received your message. Support will contact you shortly!'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Subject</label>
              <input type="text" className="ghost-input" placeholder="What is this regarding?" style={{ borderRadius: 'var(--radius-sm)' }} required />
              <div className="input-underline" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="label-xs" style={{ color: 'var(--secondary)' }}>Message</label>
              <textarea className="ghost-input" placeholder="Describe your issue..." rows={4} style={{ borderRadius: 'var(--radius-sm)', resize: 'vertical' }} required />
              <div className="input-underline" />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
