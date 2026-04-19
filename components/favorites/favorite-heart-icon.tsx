"use client";

interface FavoriteHeartIconProps {
  className?: string;
}

export function FavoriteHeartIcon({ className = "" }: FavoriteHeartIconProps) {
  return <span aria-hidden="true" className={`favorite-heart-icon ${className}`.trim()} />;
}
