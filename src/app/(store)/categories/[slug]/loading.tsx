import { ProductGridSkeleton } from "@/components/store/Skeleton";

export default function CategoryLoading() {
  return (
    <div className="px-6 md:px-10 py-12">
      <div className="space-y-2 mb-10">
        <div className="bg-gray-200 rounded animate-pulse w-24 h-3" />
        <div className="bg-gray-200 rounded animate-pulse w-48 h-8" />
        <div className="bg-gray-200 rounded animate-pulse w-16 h-3" />
      </div>
      <ProductGridSkeleton count={6} />
    </div>
  );
}