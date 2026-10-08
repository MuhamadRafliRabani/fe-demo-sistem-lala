export const ProgressRing = ({ progress = 0, theme = "indigo" }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  // Memastikan nilai progress valid (0-100)
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;
  const isDone = safeProgress === 100;

  // Best Practice: Mapping warna statis agar tidak hilang saat proses PurgeCSS Tailwind
  const themeColors = {
    blue: "text-blue-500 dark:text-blue-400",
    purple: "text-purple-500 dark:text-purple-400",
    indigo: "text-indigo-500 dark:text-indigo-400",
    emerald: "text-emerald-500 dark:text-emerald-400",
    red: "text-red-500 dark:text-red-400",
    orange: "text-orange-500 dark:text-orange-400",
  };

  const strokeColorClass =
    isDone ?
      themeColors.emerald
    : themeColors[theme] || "text-slate-500 dark:text-slate-400";

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-10 h-10 drop-shadow-sm">
        {/* Track Belakang */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-slate-100 dark:text-slate-700/50 transition-colors duration-300"
        />
        {/* Indikator Progres */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-in-out ${strokeColorClass}`}
        />
      </svg>
      {/* Teks Persentase di Tengah */}
      <span
        className={`absolute text-[10px] font-black transition-colors duration-300 ${
          isDone ?
            "text-emerald-600 dark:text-emerald-400"
          : "text-slate-700 dark:text-slate-200"
        }`}
      >
        {safeProgress}
      </span>
    </div>
  );
};
