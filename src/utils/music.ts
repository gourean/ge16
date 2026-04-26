/**
 * Background Music Manager using HTMLAudioElement.
 * Plays high-quality MP3 tracks hosted on Cloudflare R2.
 */
const TRACK_URLS: Record<string, string> = {
  campaign: 'https://pub-566c893fac974012a477dd59a32fb62e.r2.dev/audio/campaign.mp3',
  intro: 'https://pub-566c893fac974012a477dd59a32fb62e.r2.dev/audio/intro.mp3',
  result: 'https://pub-566c893fac974012a477dd59a32fb62e.r2.dev/audio/result.mp3'
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

