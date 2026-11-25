"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import styles from "./rental-gallery.module.css";

type RentalScene = {
  image: string;
  title: string;
  label: string;
  description: string;
};

type RentalGalleryProps = {
  title: string;
  openLabel: string;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
  scenes: readonly RentalScene[];
};

function pageTop(element: HTMLElement) {
  return window.scrollY + element.getBoundingClientRect().top;
}

export function RentalGallery({ title, openLabel, closeLabel, previousLabel, nextLabel, scenes }: RentalGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [isCentered, setIsCentered] = useState(false);
  const [restingOffset, setRestingOffset] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const toggleRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const wheelBlockedUntil = useRef(0);
  const scene = scenes[selected];
  const dockStart = Math.max(0, Math.min(selected - 1, scenes.length - 3));

  useEffect(() => {
    const rail = railRef.current;
    const gallery = galleryRef.current;
    const journey = journeyRef.current;
    if (!rail || !gallery || !journey) return;

    const measureTravel = () => {
      journey.style.setProperty("--gallery-travel", `${Math.max(0, rail.scrollWidth - rail.clientWidth)}px`);
    };

    if (!isOpen) {
      let touchOrigin: { x: number; y: number } | undefined;
      const featuredScrollY = window.scrollY;

      const returnOnWheel = (event: WheelEvent) => {
        if (event.ctrlKey || (!event.deltaX && !event.deltaY)) return;
        event.preventDefault();
        wheelBlockedUntil.current = performance.now() + 140;
        setIsOpen(true);
      };

      const startTouch = (event: TouchEvent) => {
        const touch = event.touches[0];
        touchOrigin = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : undefined;
      };

      const returnOnSwipe = (event: TouchEvent) => {
        if (!touchOrigin || event.touches.length !== 1) return;
        const touch = event.touches[0];
        if (Math.hypot(touch.clientX - touchOrigin.x, touch.clientY - touchOrigin.y) < 14) return;
        event.preventDefault();
        touchOrigin = undefined;
        setIsOpen(true);
      };

      const returnOnPageScroll = () => {
        if (Math.abs(window.scrollY - featuredScrollY) > 2) setIsOpen(true);
      };

      const resize = new ResizeObserver(() => {
        measureTravel();
        setRestingOffset(rail.scrollLeft);
      });
      resize.observe(rail);
      gallery.addEventListener("wheel", returnOnWheel, { passive: false });
      gallery.addEventListener("touchstart", startTouch, { passive: true });
      gallery.addEventListener("touchmove", returnOnSwipe, { passive: false });
      window.addEventListener("scroll", returnOnPageScroll, { passive: true });
      return () => {
        resize.disconnect();
        gallery.removeEventListener("wheel", returnOnWheel);
        gallery.removeEventListener("touchstart", startTouch);
        gallery.removeEventListener("touchmove", returnOnSwipe);
        window.removeEventListener("scroll", returnOnPageScroll);
      };
    }

    const tiles = Array.from(rail.querySelectorAll<HTMLElement>("[data-active]"));
    let frame = 0;
    let lastPageY: number | undefined;
    let lastRailX = rail.scrollLeft;

    const updateRail = () => {
      frame = 0;
      const maximum = rail.scrollWidth - rail.clientWidth;
      const pageY = window.scrollY;
      const entry = pageTop(journey);
      const progress = pageY - entry;
      const pinned = progress >= -1 && progress <= maximum + 1;

      // Vertical page scroll drives the scene. A direct horizontal swipe advances the same timeline.
      if (pageY === lastPageY && pinned && Math.abs(rail.scrollLeft - lastRailX) > 1) {
        window.scrollTo({ top: entry + rail.scrollLeft, behavior: "instant" });
      } else {
        const offset = Math.min(maximum, Math.max(0, progress));
        if (Math.abs(rail.scrollLeft - offset) > 1) rail.scrollLeft = offset;
      }
      lastPageY = window.scrollY;
      lastRailX = rail.scrollLeft;
      setIsCentered(pinned);

      const offset = rail.scrollLeft;
      const start = offset <= 1;
      const end = maximum - offset <= 1;
      setEdges((current) => current.start === start && current.end === end ? current : { start, end });

      const center = offset + rail.clientWidth / 2;
      const positions = tiles.map((tile) => {
        const relative = (tile.offsetLeft + tile.offsetWidth / 2 - center) / (rail.clientWidth / 2);
        return Math.max(-1, Math.min(1, relative));
      });
      tiles.forEach((tile, index) => tile.style.setProperty("--image-position", String(positions[index])));

    };

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateRail);
    };

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && performance.now() < wheelBlockedUntil.current) {
        wheelBlockedUntil.current = performance.now() + 140;
        event.preventDefault();
      }
    };

    const resize = new ResizeObserver(() => {
      measureTravel();
      scheduleUpdate();
    });
    resize.observe(rail);
    measureTravel();
    scheduleUpdate();
    rail.addEventListener("scroll", scheduleUpdate, { passive: true });
    rail.addEventListener("transitionend", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    gallery.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      rail.removeEventListener("scroll", scheduleUpdate);
      rail.removeEventListener("transitionend", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      gallery.removeEventListener("wheel", handleWheel);
    };
  }, [isOpen]);

  function showFeatured(index = selected) {
    const offset = railRef.current?.scrollLeft ?? 0;
    if (journeyRef.current) window.scrollTo({ top: pageTop(journeyRef.current) + offset, behavior: "instant" });
    setRestingOffset(offset);
    setSelected(index);
    setIsOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  }

  function moveRail(direction: number) {
    const rail = railRef.current;
    const journey = journeyRef.current;
    if (!rail || !journey) return;
    const offset = Math.min(rail.scrollWidth - rail.clientWidth, Math.max(0, rail.scrollLeft + direction * rail.clientWidth * 0.72));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: pageTop(journey) + offset, behavior: reduceMotion ? "instant" : "smooth" });
  }

  return (
    <div ref={journeyRef} id="kite-rental-categories" className={styles.galleryJourney}>
      <section
        ref={galleryRef}
        className={styles.gallery}
        data-open={isOpen}
        data-centered={isCentered}
        aria-labelledby="kite-rental-categories-title"
        style={{ "--scene-count": scenes.length, "--resting-offset": `${restingOffset}px` } as CSSProperties}
        onKeyDown={(event) => {
          if (!isOpen) {
            if (["Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"].includes(event.key)) {
              event.preventDefault();
              setIsOpen(true);
            }
            return;
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveRail(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        <div ref={railRef} className={styles.scenes} id="kite-rental-scenes">
          {scenes.map(({ image, label, title: sceneTitle }, index) => {
            const active = selected === index;
            const dockIndex = index - dockStart;
            const docked = dockIndex >= 0 && dockIndex < 3;
            const canChoose = isOpen || (docked && !active);

            return (
              <button
                type="button"
                className={styles.scene}
                data-active={active}
                data-docked={docked}
                disabled={!canChoose}
                aria-hidden={!canChoose}
                aria-label={isOpen ? sceneTitle : `${openLabel} · ${sceneTitle}`}
                style={{ "--scene-index": index, "--dock-index": Math.max(0, Math.min(2, dockIndex)) } as CSSProperties}
                key={image}
                onClick={() => {
                  if (isOpen) showFeatured(index);
                  else setIsOpen(true);
                }}
              >
                <span className={styles.sceneMedia}>
                  <Image src={image} alt="" fill sizes={active ? "100vw" : "(max-width: 700px) 440px, 700px"} />
                </span>
                <span className={styles.sceneLabel}>{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className={styles.currentThumb}
            aria-label={`${openLabel} · ${scene.title}`}
            disabled={isOpen}
            aria-hidden={isOpen}
            style={{ "--dock-index": selected - dockStart } as CSSProperties}
            onClick={() => {
              setIsOpen(true);
              toggleRef.current?.focus({ preventScroll: true });
            }}
          >
            <Image src={scene.image} alt="" fill sizes="96px" />
          </button>
        </div>

        <div className={styles.layout}>
          <h2 id="kite-rental-categories-title" className={styles.sectionTitle}>{title}</h2>
          <div className={styles.bottom}>
            <div className={styles.copy} aria-live="polite" aria-atomic="true" aria-hidden={isOpen}>
              <div className={styles.caption} key={scene.image}>
                <h3>{scene.title}</h3>
                <p>{scene.description}</p>
              </div>
            </div>

            <div className={styles.actions}>
              {isOpen && (
                <div className={styles.railControls} role="group" aria-label={title}>
                  <button type="button" aria-label={previousLabel} disabled={edges.start} onClick={() => moveRail(-1)}><ChevronLeft size={20} aria-hidden="true" /></button>
                  <button type="button" aria-label={nextLabel} disabled={edges.end} onClick={() => moveRail(1)}><ChevronRight size={20} aria-hidden="true" /></button>
                </div>
              )}
              <button ref={toggleRef} type="button" className={styles.toggle} aria-expanded={isOpen} aria-controls="kite-rental-scenes" onClick={() => isOpen ? showFeatured() : setIsOpen(true)}>
                {isOpen ? <Minus size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                {isOpen ? closeLabel : openLabel}
              </button>
            </div>
          </div>
        </div>
      </section>
      <div className={styles.galleryRunway} aria-hidden="true" />
    </div>
  );
}
