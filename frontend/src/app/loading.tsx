import { CardSkeleton, TableSkeleton, PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full animate-in fade-in duration-100">
      {/* Page Header Skeleton */}
      <PageHeaderSkeleton />

      {/* 4 Metrics KPI Skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table / Content Feed Skeleton */}
      <TableSkeleton rows={5} cols={6} />
    </div>
  );
}
