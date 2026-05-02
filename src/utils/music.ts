/**
 * Background Music Manager using HTMLAudioElement.
 * Supports dual modes:
 * 1. Web (Default): Loads from Cloudflare R2.
 * 2. Standalone (VITE_STANDALONE=true): Loads from local public/audio folder.
 */

const IS_STANDALONE = import.meta.env.VITE_STANDALONE === 'true';

const R2_BASE_URL = 'https://pub-566c893fac974012a477dd59a32fb62e.r2.dev/audio';

const TRACK_URLS: Record<string, string> = {
  campaign: IS_STANDALONE ? './audio/campaign.mp3' : `${R2_BASE_URL}/campaign.mp3`,
  intro: IS_STANDALONE ? './audio/intro.mp3' : `${R2_BASE_URL}/intro.mp3`,
  result: IS_STANDALONE ? './audio/result.mp3' : `${R2_BASE_URL}/result.mp3`
};

class MusicSynthesizer {
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrack: string | null = null;
  private volume: number = 50;
  private isMuted: boolean = false;

  public startTrack(trackName: string) {
    if (this.currentTrack === trackName && this.currentAudio && !this.currentAudio.paused) return;

    this.stopTrack();

    const url = TRACK_URLS[trackName];
    if (!url) return;

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = this.isMuted ? 0 : this.volume / 100;
    
    // Play the audio
    audio.play().catch(e => console.warn('Failed to play audio:', e));
    
    this.currentAudio = audio;
    this.currentTrack = trackName;
  }

  public stopTrack() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = ''; // Clean up
      this.currentAudio = null;
    }
    this.currentTrack = null;
  }

  public setVolume(volume: number, isMuted: boolean) {
    this.volume = volume;
    this.isMuted = isMuted;
    if (this.currentAudio) {
      this.currentAudio.volume = isMuted ? 0 : volume / 100;
    }
  }
}

export const musicSynth = new MusicSynthesizer();

