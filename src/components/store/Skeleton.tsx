export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="cursor-pointer">
      <SkeletonBox className="w-full h-52 md:h-80 rounded-xl mb-3" />
      <SkeletonBox className="w-16 h-2.5 mb-2" />
      <SkeletonBox className="w-32 h-3 mb-2" />
      <SkeletonBox className="w-20 h-3" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="px-6 md:px-10 py-10">
      <SkeletonBox className="w-48 h-3 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
        <SkeletonBox className="w-full h-[380px] md:h-[520px] rounded-xl" />
        <div className="space-y-4 pt-2">
          <SkeletonBox className="w-20 h-2.5" />
          <SkeletonBox className="w-64 h-8" />
          <SkeletonBox className="w-32 h-6" />
          <SkeletonBox className="w-full h-20" />
          <SkeletonBox className="w-full h-12 rounded" />
          <SkeletonBox className="w-full h-12 rounded" />
        </div>
      </div>
    </div>
  );
}