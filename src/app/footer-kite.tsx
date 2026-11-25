"use client";

import { useEffect, useRef } from "react";
import styles from "./landing.module.css";

export function FooterKite() {
  const artwork = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const frame = artwork.current;
    const surface = canvas.current;
    if (!frame || !surface) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;
    // Load the renderer only when the visitor approaches the footer.
    const nearFooter = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      nearFooter.disconnect();
      void import("./footer-kite-scene").then(({ flyKite }) => {
        if (!cancelled) dispose = flyKite(frame, surface);
      }).catch(() => {
        // The static artwork also covers browsers without WebGL.
      });
    }, { rootMargin: "280px" });
    nearFooter.observe(frame);

    return () => {
      cancelled = true;
      nearFooter.disconnect();
      dispose?.();
    };
  }, []);

  return (
    <div ref={artwork} className={styles.footerKite} aria-hidden="true">
      <div className={styles.footerKiteFallback}>
        <svg focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 99 C 22 86 69 27 100 0" fill="none" stroke="#a4b698" strokeOpacity=".65" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <svg focusable="false" viewBox="0 0 210 322">
          <defs>
            <linearGradient id="kite-lime" x2=".8" y2="1">
              <stop stopColor="#e5f79d" />
              <stop offset="1" stopColor="#81a345" />
            </linearGradient>
            <linearGradient id="kite-green" x2="0" y2="1">
              <stop stopColor="#669a72" />
              <stop offset="1" stopColor="#183a2d" />
            </linearGradient>
          </defs>
          <path d="M106 207 C 118 233 62 235 73 257 S 49 282 36 312" fill="none" stroke="#a9cb76" strokeWidth="5" />
          <path d="M120 8 Q 157 48 205 75 Q 140 132 106 207 Q 69 120 5 81 Q 79 45 120 8 Z" fill="url(#kite-green)" stroke="#233e2a" strokeWidth="1.5" />
          <path d="M120 8 Q 157 48 205 75 Q 149 86 111 78 Z M111 78 Q 48 89 5 81 Q 69 120 106 207 Z" fill="url(#kite-lime)" />
          <path d="M120 8 Q 108 98 106 207 M5 81 Q 89 68 205 75" fill="none" stroke="#234731" strokeWidth="1.8" />
        </svg>
      </div>
      <canvas ref={canvas} />
    </div>
  );
}
