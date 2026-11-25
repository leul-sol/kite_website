"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./landing.module.css";

function scrollProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeProgress(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

export function LandingStage() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const showcase = stage?.parentElement;
    if (!stage || !showcase) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const chapters = Array.from(showcase.querySelectorAll<HTMLElement>("[data-chapter]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = showcase.getBoundingClientRect().top;
      const distance = Math.max(1, top + window.scrollY);
      const progress = scrollProgress(1 - top / distance);
      const reducedMotion = motion.matches;
      const expansion = reducedMotion ? Number(progress === 1) : easeProgress(progress);
      const cardFrames = chapters.map((chapter) => chapter.getBoundingClientRect());

      showcase.style.setProperty("--expansion", String(expansion));
      chapters.slice(0, -1).forEach((chapter, index) => {
        const current = cardFrames[index];
        const next = cardFrames[index + 1];
        const overlap = scrollProgress((current.bottom - next.top) / Math.max(1, current.height));
        const fade = reducedMotion ? Number(overlap === 1) : easeProgress(overlap);
        chapter.style.setProperty("--chapter-opacity", String(1 - fade));
      });
    };

    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    const resize = new ResizeObserver(scheduleUpdate);
    resize.observe(document.body);
    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    motion.addEventListener("change", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      motion.removeEventListener("change", scheduleUpdate);
    };
  }, []);

  return (
    <div ref={stageRef} className={styles.stage}>
      <div className={styles.artworkFrame}>
        <div className={styles.photo}>
          <Image src="/kite-event-still-life.webp" alt="" fill preload sizes="100vw" />
        </div>
      </div>
    </div>
  );
}
