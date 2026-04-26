"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { ProductMedia } from "@/lib/catalog/media";

interface ProductMediaLightboxProps {
  media: ProductMedia[];
  productTitle: string;
}

export function ProductMediaLightbox({ media, productTitle }: ProductMediaLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const hasMultiplePhotos = media.length > 1;

  const activeMedia = media[activeIndex] ?? media[0];

  function goToIndex(index: number) {
    const total = media.length;
    setActiveIndex((index + total) % total);
  }

  function openAt(index: number) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  function resetDrag() {
    setDragOffset(0);
    setIsDragging(false);
    pointerIdRef.current = null;
  }

  function closeModal() {
    setIsOpen(false);
    resetDrag();
  }

  function goToPrev() {
    setActiveIndex((current) => (current - 1 + media.length) % media.length);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % media.length);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if ((event.target as HTMLElement | null)?.closest(".product-lightbox__nav")) {
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
    const threshold = 60;

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
        return;
      }

      if (event.key === "ArrowLeft") {
        goToPrev();
        return;
      }

      if (event.key === "ArrowRight") {
        goToNext();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, activeIndex]);

  return (
    <>
      <div className="product-visual">
        <button
          type="button"
          className="product-visual__image-link product-visual__image-trigger"
          onClick={() => openAt(0)}
          aria-label={`Открыть фото товара ${productTitle}`}
        >
          <img src={media[0].src} alt={media[0].alt} className="product-visual__image" draggable={false} />
        </button>

        {hasMultiplePhotos ? (
          <div className="product-visual__gallery">
            {media.slice(1).map((item, index) => (
              <button
                key={item.src}
                type="button"
                className="product-visual__thumb-link product-visual__thumb-trigger"
                onClick={() => openAt(index + 1)}
                aria-label={`Открыть ${item.alt}`}
              >
                <img src={item.src} alt={item.alt} className="product-visual__thumb" draggable={false} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isOpen && activeMedia ? (
        <div className="product-lightbox" role="dialog" aria-modal="true" aria-label={`Фотографии товара ${productTitle}`} onClick={closeModal}>
          <div className="product-lightbox__dialog" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="product-lightbox__close"
              onClick={closeModal}
              aria-label="Закрыть просмотр фото"
            >
              ×
            </button>

            <div className="product-lightbox__content">
              <div
                className={`product-lightbox__stage ${isDragging ? "is-dragging" : ""}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishGesture}
                onPointerCancel={resetDrag}
              >
                <img
                  src={activeMedia.src}
                  alt={activeMedia.alt}
                  className="product-lightbox__image"
                  style={{ transform: `translateX(${dragOffset}px)` }}
                  draggable={false}
                />

                {hasMultiplePhotos ? (
                  <>
                    <button
                      type="button"
                      className="product-lightbox__nav product-lightbox__nav--prev"
                      onClick={(event) => {
                        event.stopPropagation();
                        goToPrev();
                      }}
                      aria-label="Предыдущее фото"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="product-lightbox__nav product-lightbox__nav--next"
                      onClick={(event) => {
                        event.stopPropagation();
                        goToNext();
                      }}
                      aria-label="Следующее фото"
                    >
                      ›
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
