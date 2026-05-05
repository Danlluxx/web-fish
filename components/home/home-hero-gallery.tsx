"use client";

import { type ReactNode } from "react";

interface HomeHeroGalleryProps {
  overlay?: ReactNode;
  className?: string;
}

const HERO_IMAGE = {
  src: "/images/home/hero-fish-4.webp",
  alt: "Аквариумные рыбы и растения, фото с муреной"
};

export function HomeHeroGallery({ overlay, className }: HomeHeroGalleryProps) {
  return (
    <div className={className ? `hero-gallery ${className}` : "hero-gallery"}>
      <div className="hero-gallery__viewport">
        <div className="hero-gallery__track">
          <div className="hero-gallery__slide">
            <img src={HERO_IMAGE.src} alt={HERO_IMAGE.alt} className="hero-gallery__image" draggable={false} />
          </div>
        </div>

        {overlay ? <div className="hero-gallery__overlay">{overlay}</div> : null}
      </div>
    </div>
  );
}
