"use client";

export default function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`skeleton-shimmer rounded-lg ${className}`}
      style={{ width, height, minHeight: height || "20px" }}
      aria-hidden="true"
    />
  );
}

export function WordCardSkeleton() {
  return (
    <div className="glass-card p-4 animate-fade-in">
      <Skeleton height="20px" width="70%" />
    </div>
  );
}

export function WordListSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <WordCardSkeleton key={i} />
      ))}
    </div>
  );
}
