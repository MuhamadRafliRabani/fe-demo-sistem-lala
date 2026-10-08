import { Skeleton } from "@/components/ui/skeleton";

export const ProjectCardSkeleton = () => {
  // Utility class tambahan untuk menimpa warna accent bawaan skeleton
  const skelBg = "bg-slate-200 dark:bg-slate-600";

  return (
    <div className="bg-card border border-border shadow-sm rounded-sm flex flex-col overflow-hidden h-full">
      {/* 1. TOP BAR SKELETON */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-border mt-1">
        <div className="flex items-center gap-3">
          <Skeleton className={`${skelBg} h-3 w-16`} />
          <Skeleton className={`${skelBg} h-1 w-1 rounded-none`} />
          <Skeleton className={`${skelBg} h-3 w-20`} />
          <Skeleton className={`${skelBg} h-1 w-1 rounded-none`} />
          <Skeleton className={`${skelBg} h-3 w-16`} />
        </div>
        {/* Icon Dropdown Skeleton */}
        <Skeleton className={`${skelBg} w-4 h-4 rounded-sm`} />
      </div>

      {/* 2. HEADER SKELETON */}
      <div className="px-6 pt-7 pb-6">
        {/* Project Name */}
        <Skeleton className={`${skelBg} h-8 w-3/4 sm:w-2/3 mb-4`} />

        {/* Site Leader */}
        <div className="flex items-center gap-2 mt-4">
          <Skeleton className={`${skelBg} h-3 w-24`} />
          <Skeleton className={`${skelBg} h-3 w-32`} />
        </div>
      </div>

      {/* 3. MAIN DATA SKELETON (Overview Grid Layout) */}
      <div className="flex-grow flex flex-col border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Kiri: Progress Fisik (Col-span 3) */}
          <div className="md:col-span-3 p-6 flex flex-col justify-between relative overflow-hidden">
            <Skeleton className={`${skelBg} h-3 w-32 mb-8`} />

            <div className="flex items-baseline gap-2 mt-auto">
              {/* Angka Progress Raksasa */}
              <Skeleton className={`${skelBg} h-16 w-32 sm:h-20 sm:w-40`} />
              <Skeleton className={`${skelBg} h-6 w-6`} /> {/* Icon % */}
            </div>

            {/* Target text */}
            <Skeleton className={`${skelBg} h-3 w-20 mt-3`} />

            {/* Progress Bar (Bottom Line) */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border" />
          </div>

          {/* Kanan: Alokasi & Tenggat Waktu (Col-span 2) */}
          <div className="md:col-span-2 grid grid-rows-2 divide-y divide-border">
            {/* Top Right: Alokasi Finansial */}
            <div className="p-6 flex flex-col justify-center">
              <Skeleton className={`${skelBg} h-3 w-32 mb-4`} />
              {/* Actual Budget */}
              <Skeleton className={`${skelBg} h-6 w-3/4 mb-3`} />
              {/* RAP Budget */}
              <div className="flex items-center gap-2">
                <Skeleton className={`${skelBg} h-3 w-8 shrink-0`} />
                <Skeleton className={`${skelBg} h-3 w-2/3`} />
              </div>
            </div>

            {/* Bottom Right: Tenggat Waktu */}
            <div className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className={`${skelBg} h-3 w-28`} />
              </div>
              {/* Date */}
              <Skeleton className={`${skelBg} h-5 w-32 mb-2`} />
              {/* Status / Days left */}
              <Skeleton className={`${skelBg} h-3 w-24`} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. FOOTER SKELETON (Complaints Preview) */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className={`${skelBg} h-4 w-4 rounded-sm`} />
            <Skeleton className={`${skelBg} h-4 w-32`} />
          </div>
          <Skeleton className={`${skelBg} w-4 h-4 rounded-sm`} />
        </div>
      </div>
    </div>
  );
};

export default ProjectCardSkeleton;
