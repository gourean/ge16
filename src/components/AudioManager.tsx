import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { playPopup } from '../utils/sfx';

const AudioManager = () => {
  const { gamePhase, audioSettings, activeEvent, exitConfirmationOpen, hasInteractionStarted } = useGameStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Track the actual filename to avoid restarting music if same track is needed
  const currentTrack = useRef<string>('');

  useEffect(() => {
    if (!audioRef.current) return;

    let track = '';
    switch (gamePhase) {
      case 'PRE_CAMPAIGN':
      case 'MANIFESTO':
        track = '/audio/intro.mp3';
        break;
      case 'CAMPAIGN':
        track = '/audio/campaign.mp3';
        break;
      case 'POST_ELECTION':
        track = '/audio/result.mp3';
        break;
    }

    if (currentTrack.current !== track) {
      currentTrack.current = track;
      audioRef.current.src = track;
      audioRef.current.loop = true;
      
      // Try to play - might fail due to browser auto-play policy
      audioRef.current.play().catch(e => {
        console.warn('Audio play auto-play blocked. Waiting for user interaction or settings change.', e);
      });
    }
  }, [gamePhase]);

  useEffect(() => {
    if (!audioRef.current) return;

    // Volume is 0-1 range in audio element
    audioRef.current.volume = audioSettings.volume / 100;
    audioRef.current.muted = audioSettings.isMuted;

    // If the user unmutes or increases volume, we take that as an interaction intent to play
    if (!audioSettings.isMuted && audioRef.current.paused) {
      audioRef.current.play().catch(() => {
        // Still blocked, nothing we can do until a direct click
      });
    }
  }, [audioSettings]);

  useEffect(() => {
    if (hasInteractionStarted && audioRef.current && audioRef.current.paused && !audioSettings.isMuted) {
      audioRef.current.play().catch(e => {
        console.warn('BGM start after splash failed:', e);
      });
    }
  }, [hasInteractionStarted, audioSettings.isMuted]);

  useEffect(() => {
    if (activeEvent) playPopup();
  }, [activeEvent]);

  useEffect(() => {
    if (exitConfirmationOpen) playPopup();
  }, [exitConfirmationOpen]);

  return <audio ref={audioRef} style={{ display: 'none' }} />;
};

export default AudioManager;
