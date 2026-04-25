import { useNavigate } from 'react-router-dom';
import { playClick } from '../utils/sfx';

export default function Credits() {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{
      background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1), transparent 70%)',
      justifyContent: 'center'
    }}>
      <div className="animate-fade-in glass-panel" style={{
        maxWidth: '700px',
        width: '100%',
        padding: '3rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '3rem',
            marginBottom: '0.5rem',
            background: 'var(--grad-highlight)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            CREDITS
          </h1>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '4px' }}>
            GE16 Election Simulator
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>

          <section className="credit-section">
            <h3 className="section-header">Developer</h3>
            <p className="credit-name">Wong GR</p>
          </section>

          <section className="credit-section">
            <h3 className="section-header">Historical Data</h3>
            <p className="credit-detail">
              GE15 Election and Population Census data from <strong>Thevesh Theva</strong>.
              <br />
              <a
                href="https://github.com/Thevesh"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
              >
                github.com/Thevesh
              </a>
            </p>
          </section>

          <section className="credit-section">
            <h3 className="section-header">Map</h3>
            <p className="credit-detail">
              Parliament map modified from <strong>Malaysia parliament blank map 2022</strong> by <strong>
                Derkommander0916</strong>.
            </p>
          </section>

          <section className="credit-section">
            <h3 className="section-header">Musical Score</h3>
            <ul className="music-list">
              <li>Dvořák — Symphony No. 9, 4th Mvt</li>
              <li>Beethoven — Ode to Joy</li>
            </ul>
          </section>

        </div>

        <div style={{ marginTop: '1rem' }}>
          <button
            className="glass-button active"
            style={{ padding: '0.8rem 2.5rem', fontSize: '0.9rem', borderRadius: '50px', letterSpacing: '1px' }}
            onClick={() => {
              playClick();
              navigate('/outcome');
            }}
          >
            BACK TO RESULTS
          </button>
        </div>
      </div>

      <style>{`
        .section-header {
          color: var(--accent-blue);
          margin-bottom: 0.5rem;
          fontSize: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          opacity: 0.8;
        }
        .credit-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }
        .credit-detail {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--text-primary);
          opacity: 0.9;
        }
        .github-link {
          color: var(--accent-teal);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .github-link:hover {
          text-decoration: underline;
          filter: brightness(1.2);
        }
        .music-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .music-list li {
          font-size: 1rem;
          color: var(--text-primary);
          opacity: 0.9;
          position: relative;
          padding-left: 1.2rem;
        }
        .music-list li::before {
          content: "♪";
          position: absolute;
          left: 0;
          color: var(--accent-blue);
        }
        .credit-section {
          animation: slideIn 0.6s ease forwards;
          opacity: 0;
        }
        .credit-section:nth-child(1) { animation-delay: 0.1s; }
        .credit-section:nth-child(2) { animation-delay: 0.2s; }
        .credit-section:nth-child(3) { animation-delay: 0.3s; }
        .credit-section:nth-child(4) { animation-delay: 0.4s; }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
