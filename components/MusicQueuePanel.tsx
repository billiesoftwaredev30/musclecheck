"use client";

import React, { useState, useEffect } from "react";
import styles from "./MusicQueuePanel.module.css";
import GlassCard from "./GlassCard";
import { Music, Play, Trash2, SkipForward } from "lucide-react";
import { fetchMusicQueue, updateSongStatus, deleteSongRequest, SongRequestResponse } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function MusicQueuePanel() {
  const [queue, setQueue] = useState<SongRequestResponse[]>([]);
  const [playingSong, setPlayingSong] = useState<SongRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const toast = useToast();

  const loadQueue = async () => {
    try {
      const data = await fetchMusicQueue();
      const activeQueue = data.filter(s => s.status === "queued" || s.status === "playing");
      setQueue(activeQueue);
      
      const currentlyPlaying = activeQueue.find(s => s.status === "playing");
      if (currentlyPlaying) {
        setPlayingSong(currentlyPlaying);
      } else if (!playingSong && activeQueue.length > 0) {
        // Auto start the first queued song if nothing is playing
        handlePlayNext(activeQueue);
      }
    } catch (err: any) {
      toast.error("Failed to load queue", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadQueue();
    const interval = setInterval(loadQueue, 3000); // Poll every 3s for near-instant updates

    const handleMessage = (event: MessageEvent) => {
      // Ensure the message is from a YouTube iframe
      if (event.origin !== "https://www.youtube-nocookie.com" && event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        // playerState 0 means ENDED in YouTube Iframe API
        if (data.event === "infoDelivery" && data.info && data.info.playerState === 0) {
          // Video ended! But we need to call handleSongEnded
          // Since handleSongEnded uses playingSong state, it's better to trigger a state flag
          // Or we can use a ref for the current playing song ID to avoid closure staleness
          setPlayingSong((currentPlaying) => {
            if (currentPlaying) {
              // We call the API to mark it played, then update queue
              updateSongStatus(currentPlaying.id, "played")
                .then(() => {
                   setQueue(prev => prev.filter(s => s.id !== currentPlaying.id));
                   loadQueue(); // Fetch next
                })
                .catch(err => console.error("Failed to mark played", err));
            }
            return null; // clear playing song temporarily so it loads the next one
          });
        }
      } catch (e) {
        // Not a JSON message or not from YouTube, ignore
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handlePlayNext = async (currentQueue: SongRequestResponse[]) => {
    const nextSong = currentQueue.find(s => s.status === "queued");
    if (nextSong) {
      try {
        await updateSongStatus(nextSong.id, "playing");
        setPlayingSong(nextSong);
        setQueue(prev => prev.map(s => s.id === nextSong.id ? { ...s, status: "playing" } : s));
      } catch (err) {
        console.error("Failed to update status", err);
      }
    } else {
      setPlayingSong(null);
    }
  };

  const handleSongEnded = async () => {
    if (playingSong) {
      try {
        await updateSongStatus(playingSong.id, "played");
        setQueue(prev => prev.filter(s => s.id !== playingSong.id));
        loadQueue();
      } catch (err) {
        console.error("Failed to mark played", err);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSongRequest(id);
      if (playingSong?.id === id) {
        setPlayingSong(null);
        handleSongEnded();
      } else {
        setQueue(prev => prev.filter(s => s.id !== id));
      }
      toast.success("Song removed from queue");
    } catch (err: any) {
      toast.error("Failed to remove song", err.message);
    }
  };

  const handleForcePlay = async (song: SongRequestResponse) => {
    if (playingSong) {
      await updateSongStatus(playingSong.id, "queued"); // or skipped
    }
    try {
      await updateSongStatus(song.id, "playing");
      setPlayingSong(song);
      loadQueue();
    } catch (err) {
      console.error(err);
    }
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const videoId = playingSong ? getYouTubeId(playingSong.title) : null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Music size={20} style={{ color: "var(--accent-fuchsia)" }} />
          Gym Music Player
        </h3>
        <span style={{ fontSize: "0.85rem", color: "var(--foreground-muted)" }}>
          Share <strong style={{ color: "var(--foreground)" }}>/dj</strong> for clients to request songs
        </span>
      </div>

      <GlassCard>
        {isMounted && playingSong && videoId ? (
          <div className={styles.playerWrapper}>
            <iframe
              id="youtube-player-iframe"
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{ border: "none" }}
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement;
                if (iframe.contentWindow) {
                  iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: "youtube-player-iframe" }), "*");
                }
              }}
            />
            <div style={{ textAlign: "center", marginTop: "12px", background: "var(--glass-bg)", padding: "12px" }}>
              <p style={{ fontSize: "0.9rem", marginBottom: "8px" }}>Currently Playing: {playingSong.title}</p>
              <button onClick={handleSongEnded} style={{ padding: "8px 16px", background: "var(--gradient-purple)", border: "none", color: "white", borderRadius: "8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Next Song <SkipForward size={14} />
              </button>
            </div>
          </div>
        ) : playingSong ? (
          <div className={styles.playerWrapper} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--glass-bg)" }}>
            <div style={{ textAlign: "center" }}>
              <Music size={48} style={{ color: "var(--foreground-muted)", marginBottom: "12px", opacity: 0.5 }} />
              <p>Not a valid YouTube link</p>
              <p style={{ fontSize: "0.85rem", color: "var(--foreground-muted)" }}>{playingSong.title}</p>
              <button onClick={handleSongEnded} style={{ marginTop: "16px", padding: "8px 16px", background: "var(--gradient-purple)", border: "none", color: "white", borderRadius: "8px", cursor: "pointer" }}>
                Skip <SkipForward size={14} style={{ display: "inline", verticalAlign: "middle" }}/>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.playerWrapper} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--glass-bg)" }}>
            <span style={{ color: "var(--foreground-muted)" }}>No song playing</span>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h4 style={{ marginBottom: "12px", fontSize: "1rem" }}>Up Next</h4>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>Loading queue...</div>
        ) : queue.length === 0 ? (
          <div className={styles.emptyState}>
            <Music size={32} />
            <p>The queue is empty.</p>
          </div>
        ) : (
          <div className={styles.queueList}>
            {queue.map((song) => (
              <div key={song.id} className={styles.queueItem} style={{ borderLeft: song.status === "playing" ? "4px solid var(--success)" : "none" }}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>{song.title}</span>
                  <span className={styles.itemRequester}>Requested by: {song.requested_by}</span>
                </div>
                <div className={styles.itemActions}>
                  <span className={`${styles.statusBadge} ${song.status === "playing" ? styles.statusPlaying : styles.statusQueued}`}>
                    {song.status.toUpperCase()}
                  </span>
                  {song.status === "queued" && (
                    <button className={styles.playBtn} onClick={() => handleForcePlay(song)} title="Play Now">
                      <Play size={16} style={{ marginLeft: "2px" }} />
                    </button>
                  )}
                  <button className={styles.deleteBtn} onClick={() => handleDelete(song.id)} title="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
