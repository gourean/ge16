import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from './store/gameStore';
import PreCampaign from './pages/PreCampaign';
import Manifesto from './pages/Manifesto';
import Campaign from './pages/Campaign';
import PostElection from './pages/PostElection';
import Outcome from './pages/Outcome';
import Credits from './pages/Credits';
import ConfirmationModal from './components/ConfirmationModal';
import AudioManager from './components/AudioManager';
import SettingsMenu from './components/SettingsMenu';
import NotificationModal from './components/NotificationModal';
import IntroSplash from './components/IntroSplash';
import type { Seat } from './store/gameStore';

// Scroll to top on every route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// A component to handle route switching based on game state
const PhaseRouter = () => {
  const gamePhase = useGameStore(state => state.gamePhase);
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent redirect if we are on the credits page
    if (window.location.hash === '#/credits') return;

    if (gamePhase === 'PRE_CAMPAIGN') navigate('/');
    else if (gamePhase === 'MANIFESTO') navigate('/manifesto');
    else if (gamePhase === 'CAMPAIGN') navigate('/campaign');
    else if (gamePhase === 'POST_ELECTION') navigate('/post-election');
    else if (gamePhase === 'OUTCOME') navigate('/outcome');
  }, [gamePhase, navigate]);

  return null;
};

function App() {
  const loadInitialSeats = useGameStore((state) => state.loadInitialSeats);

  useEffect(() => {
    // Fetch initial data
    fetch('./assets/data/initial_state_v2.json')
      .then(res => res.json())
      .then((data: Seat[]) => {
        loadInitialSeats(data);
      })
      .catch(err => console.error("Failed to load initial state:", err));
  }, [loadInitialSeats]);

  return (
    <HashRouter>
      <ScrollToTop />
      <PhaseRouter />
      <Routes>
        <Route path="/" element={<PreCampaign />} />
        <Route path="/manifesto" element={<Manifesto />} />
        <Route path="/campaign" element={<Campaign />} />
        <Route path="/post-election" element={<PostElection />} />
        <Route path="/outcome" element={<Outcome />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ConfirmationModal />
      <NotificationModal />
      <IntroSplash />
      <AudioManager />
      <SettingsMenu />
    </HashRouter>
  );
}

export default App;