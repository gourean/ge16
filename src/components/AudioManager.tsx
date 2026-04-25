import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { playPopup } from '../utils/sfx';
import { musicSynth } from '../utils/music';

const AudioManager = () => {
  const { gamePhase, audioSettings, activeEvent, exitConfirmationOpen, hasInteractionStarted } = useGameStore();

  useEffect(() => {
    let track = '';
    switch (gamePhase) {
      case 'PRE_CAMPAIGN':
      case 'MANIFESTO':
        track = 'intro';
        break;
      case 'CAMPAIGN':
        track = 'campaign';
        break;
      case 'POST_ELECTION':
      case 'OUTCOME':
        track = 'result';
        break;
    }

    if (hasInteractionStarted && !audioSettings.isMuted) {
      musicSynth.startTrack(track);
    } else {
      musicSynth.stopTrack();
    }
  }, [gamePhase, hasInteractionStarted, audioSettings.isMuted]);

  useEffect(() => {
    musicSynth.setVolume(audioSettings.volume, audioSettings.isMuted);
  }, [audioSettings]);

  useEffect(() => {
    if (activeEvent) playPopup();
  }, [activeEvent]);

  useEffect(() => {
    if (exitConfirmationOpen) playPopup();
  }, [exitConfirmationOpen]);

  return null;
};

export default AudioManager;
