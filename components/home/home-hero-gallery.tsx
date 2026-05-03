"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

interface HomeHeroGalleryProps {
  overlay?: ReactNode;
  className?: string;
}

const HERO_SLIDE_ORDER = [4, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const HERO_SLIDES = HERO_SLIDE_ORDER.map((index) => ({
  src: `/images/home/hero-fish-${index}.webp`,
  alt: `Аквариумные рыбы и растения, фото ${index}`
}));

export function HomeHeroGallery({ overlay, className }: HomeHeroGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  function goToSlide(index: number) {
    const total = HERO_SLIDES.length;
    setActiveIndex((index + total) % total);
  }

  function goToPrev() {
    goToSlide(activeIndex - 1);
  }

  function goToNext() {
    goToSlide(activeIndex + 1);
  }

  function resetDrag() {
    setDragOffset(0);
    setIsDragging(false);
    pointerIdRef.current = null;
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    startXRef.current = event.clientX;
    pointerIdRef.current = event.pointerId;
    setIsDragging(true);
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || pointerIdRef.current !== event.pointerId) {
      return;
    }

    setDragOffset(event.clientX - startXRef.current);
  }

  function finishGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - startXRef.current;
    const threshold = 50;

    if (deltaX <= -threshold) {
      goToNext();
    } else if (deltaX >= threshold) {
      goToPrev();
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetDrag();
  }

  return (
    <div className={className ? `hero-gallery ${className}` : "hero-gallery"}>
      <div className="hero-gallery__viewport">
        <div
          className={`hero-gallery__track ${isDragging ? "is-dragging" : ""}`}
          style={{ transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishGesture}
          onPointerCancel={resetDrag}
        >
          {HERO_SLIDES.map((slide) => (
            <div className="hero-gallery__slide" key={slide.src}>
              <img src={slide.src} alt={slide.alt} className="hero-gallery__image" draggable={false} />
            </div>
          ))}
        </div>

        {overlay ? <div className="hero-gallery__overlay">{overlay}</div> : null}

        <button
          type="button"
          className="hero-gallery__nav hero-gallery__nav--prev"
          onClick={goToPrev}
          aria-label="Предыдущее фото"
        >
          ‹
        </button>
        <button
          type="button"
          className="hero-gallery__nav hero-gallery__nav--next"
          onClick={goToNext}
          aria-label="Следующее фото"
        >
          ›
        </button>
      </div>

      <div className="hero-gallery__dots" aria-label="Навигация по фото">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={`hero-gallery__dot ${index === activeIndex ? "is-active" : ""}`}
            aria-label={`Показать фото ${index + 1}`}
            aria-pressed={index === activeIndex}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
