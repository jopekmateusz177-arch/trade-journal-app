"use client";

import Image from "next/image";

type TradeScreenshotProps = {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
};

export function TradeScreenshot({
  src,
  alt,
  className = "",
  wrapperClassName = "relative h-16 w-24",
}: TradeScreenshotProps) {
  return (
    <div className={wrapperClassName}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 160px"
        className={className}
      />
    </div>
  );
}
