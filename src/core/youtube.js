/*
 * Anschluss an den YouTube-Player: lädt einmal das Skript von YouTube
 * (IFrame-API) und setzt damit ein Video in ein Element. YouTube zeigt seine
 * eigene Bedienung (Abspielen, Spulen, Ton); die App stellt darüber nur das
 * Tempo ein (src/ui/video-player.js). Kennt keinen Bereich der App, nur das
 * Skript und den Player.
 * Pfad: src/core/youtube.js
 *
 * ANPASSBARE WERTE IN DIESER DATEI
 * -----------------------------------
 * API_URL     -> woher das Skript von YouTube kommt
 * PLAYER_HOST -> Adresse des eingebetteten Players (nocookie: setzt keine
 *                Cookies, bis das Video läuft)
 * playerVars  -> was YouTube im Player zeigt: controls 1 = YouTubes eigene
 *                Bedienung, rel 0 = am Ende nur eigene Videos vorschlagen,
 *                playsinline 1 = am Handy im Player statt im Vollbild starten,
 *                fs 0 = kein YouTube-Vollbild (die App hat ihren eigenen Knopf)
 */

const API_URL = "https://www.youtube.com/iframe_api";
const PLAYER_HOST = "https://www.youtube-nocookie.com";
const playerVars = { controls: 1, rel: 0, playsinline: 1, modestbranding: 1, fs: 0, iv_load_policy: 3 };

let apiPromise = null;

/* Das Skript einmal holen; YouTube ruft danach onYouTubeIframeAPIReady auf. */
function loadApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    /* script: die API lässt sich nur als Skript von YouTube laden, nicht als Modul */
    const script = document.createElement("script");
    script.src = API_URL;
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube-Skript nicht geladen"));
    };
    document.head.append(script);
  });
  return apiPromise;
}

/**
 * Ein Video in `host` einsetzen (das Element wird durch den Player ersetzt).
 * Löst auf, sobald der Player bereit ist.
 */
export async function createYouTubePlayer(host, videoId) {
  const YT = await loadApi();
  return new Promise((resolve) => {
    const player = new YT.Player(host, {
      videoId,
      host: PLAYER_HOST,
      playerVars: { ...playerVars, origin: location.origin },
      events: { onReady: () => resolve(player) },
    });
  });
}
