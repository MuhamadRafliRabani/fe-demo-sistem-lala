const LeadDetailSkeleton = () => (
  <div className="flex flex-col w-full h-full animate-pulse">
    {/* Header Skeleton */}
    <header className="sticky top-0 z-40 bg-[#0f172a]/85 backdrop-blur-md border-b border-white/10 w-full transition-all ">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-between">
          <div className="flex items-center gap-2 md:mr-auto">
            <div className="w-9 h-9 bg-slate-700/50 rounded-lg"></div>
            <div className="w-9 h-9 bg-slate-700/50 rounded-lg"></div>
            <div className="w-[70px] h-9 bg-slate-700/50 rounded-lg"></div>
            <div className="w-[80px] h-9 bg-slate-700/50 rounded-lg"></div>
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/10 mx-1"></div>
          <div className="flex items-center gap-2">
            <div className="w-[70px] h-9 bg-slate-700/50 rounded-lg"></div>
            <div className="w-[85px] h-9 bg-slate-700/50 rounded-lg"></div>
          </div>
        </div>
      </div>
    </header>

    {/* Main Content Skeleton */}
    <main className="w-full py-4 sm:py-6 lg:py-8 flex-1">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8 items-start w-full">
        <div className="xl:col-span-3 flex flex-col gap-6 lg:gap-8">
          {/* Box 1 Skeleton */}
          <div className="bg-[#1e293b]/40 border border-white/10 rounded-2xl p-5 sm:p-7 shadow-sm">
            <div className="w-32 h-4 bg-slate-700/50 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-10 gap-y-5 sm:gap-y-6">
              {[...Array(9)].map((_, i) => (
                <div key={`box1-${i}`} className="flex flex-col gap-2">
                  <div className="w-20 h-3 bg-slate-700/50 rounded"></div>
                  <div className="w-full sm:w-3/4 h-4 bg-slate-700/50 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 2 Skeleton */}
          <div className="bg-[#1e293b]/40 border border-white/10 rounded-2xl p-5 sm:p-7 shadow-sm">
            <div className="w-32 h-4 bg-slate-700/50 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-10 gap-y-5 sm:gap-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={`box2a-${i}`} className="flex flex-col gap-2">
                  <div className="w-20 h-3 bg-slate-700/50 rounded"></div>
                  <div className="w-full sm:w-3/4 h-4 bg-slate-700/50 rounded"></div>
                </div>
              ))}
            </div>
            <div className="md:col-span-2 lg:col-span-3 mt-4 pt-5 border-t border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-10 gap-y-5 sm:gap-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={`box2b-${i}`} className="flex flex-col gap-2">
                    <div className="w-24 h-3 bg-slate-700/50 rounded"></div>
                    <div className="w-full sm:w-3/4 h-4 bg-slate-700/50 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Box 3 Skeleton (Audit) */}
        <div className="xl:col-span-1">
          <div className="bg-[#1e293b]/40 border border-white/10 rounded-2xl p-5 sm:p-7 min-h-[250px] shadow-sm">
            <div className="w-24 h-4 bg-slate-700/50 rounded mb-6 pb-4 border-b border-white/10"></div>
            <div className="flex flex-col gap-8 pt-2">
              {[...Array(2)].map((_, i) => (
                <div
                  key={`audit-${i}`}
                  className="flex items-start gap-4 relative"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-700/50 shrink-0"></div>
                  <div className="flex flex-col gap-2.5 w-full">
                    <div className="w-16 h-3 bg-slate-700/50 rounded"></div>
                    <div className="w-32 h-4 bg-slate-700/50 rounded"></div>
                    <div className="w-24 h-3 bg-slate-700/50 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);
export default LeadDetailSkeleton;
