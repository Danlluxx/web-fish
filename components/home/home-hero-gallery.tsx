"use client";

import { useState } from "react";

const HERO_SLIDES = [
  {
    src: "/images/home/hero-fish-1.jpg",
    alt: "Аквариумные рыбы в витрине, оранжевые особи"
  },
  {
    src: "/images/home/hero-fish-2.jpg",
    alt: "Стайка полосатых аквариумных рыб"
  },
  {
    src: "/images/home/hero-fish-3.jpg",
    alt: "Золотые рыбки в аквариуме"
  }
];

export function HomeHeroGallery() {
  const [activeIndex, setActiveIndex] = useState(0);

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

  return (
    <div className="hero-gallery">
      <div className="hero-gallery__viewport">
        <div
          className="hero-gallery__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {HERO_SLIDES.map((slide) => (
            <div className="hero-gallery__slide" key={slide.src}>
              <img src={slide.src} alt={slide.alt} className="hero-gallery__image" />
            </div>
          ))}
        </div>

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
