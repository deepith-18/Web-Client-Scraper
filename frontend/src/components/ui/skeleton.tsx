import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-28 rounded-lg" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/80 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className={`h-4 ${i === 0 ? "w-36" : i === 1 ? "w-24" : "w-16"}`} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-8 w-32 rounded-xl" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-3 px-4">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRowSkeleton key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CallerDeskSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 animate-pulse"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48 rounded" />
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-36 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-8 w-28 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
    </div>
  );
}
