"use client";

import { type ReactNode } from "react";

interface HomeHeroGalleryProps {
  overlay?: ReactNode;
  className?: string;
}

const HERO_IMAGE = {
  src: "/images/home/hero-fish-4.webp",
  mobileSrc: "/images/home/hero-fish-4-mobile.webp",
  alt: "Аквариумные рыбы и растения, фото с муреной"
};

export function HomeHeroGallery({ overlay, className }: HomeHeroGalleryProps) {
  return (
    <div className={className ? `hero-gallery ${className}` : "hero-gallery"}>
      <div className="hero-gallery__viewport">
        <div className="hero-gallery__track">
          <div className="hero-gallery__slide">
            <picture className="hero-gallery__picture">
              <source media="(max-width: 720px)" srcSet={HERO_IMAGE.mobileSrc} />
              <img src={HERO_IMAGE.src} alt={HERO_IMAGE.alt} className="hero-gallery__image" draggable={false} />
            </picture>
          </div>
        </div>

        {overlay ? <div className="hero-gallery__overlay">{overlay}</div> : null}
      </div>
    </div>
  );
}
