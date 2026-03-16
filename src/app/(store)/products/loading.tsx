import { ProductGridSkeleton } from "@/components/store/Skeleton";

export default function ProductsLoading() {
  return (
    <div className="px-6 md:px-10 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div className="space-y-2">
          <div className="bg-gray-200 rounded animate-pulse w-40 h-8" />
          <div className="bg-gray-200 rounded animate-pulse w-20 h-3" />
        </div>
        <div className="flex gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-gray-200 rounded-full animate-pulse w-16 h-8" />
          ))}
        </div>
      </div>
      <ProductGridSkeleton count={6} />
    </div>
  );
}