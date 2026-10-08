import { BarChart } from "lucide-react";

const ProjectKpiView = ({ project }) => {
  // ==========================================
  // 1. DATA PARSING & PREPARATION
  // ==========================================
  const target = parseFloat(project?.target) || 0;
  const budgetRap = parseFloat(project?.budget_rap) || 0;

  const kpiDts = project?.kpi_dts || [];
  const complaints = project?.complaints || [];

  // Mengambil total realisasi biaya dari array kpi_dts
  const actualCost = kpiDts.reduce(
    (acc, cur) => acc + (parseFloat(cur.budget_actual) || 0),
    0,
  );

  // Mengambil progress aktual terakhir (dari screenshot fieldnya bernama "progress")
  const actualProgress = parseFloat(kpiDts[kpiDts.length - 1]?.progress) || 0;

  // ==========================================
  // 2. PERHITUNGAN DEVIASI & SKOR DINAMIS
  // ==========================================

  // A. PROGRES PROJECT (Bobot: 35%)
  const progressDevPercent =
    target > 0 ? ((target - actualProgress) / target) * 100 : 0;
  const progressScore =
    actualProgress >= target ? 100 : Math.max(0, 100 - progressDevPercent);

  // B. TENGGAT WAKTU (Bobot: 25%)
  const overdueDate = new Date(project.overdue_date);
  const today = new Date();

  // Reset jam ke 00:00:00 untuk perbandingan tanggal yang murni
  overdueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const timeDiff = overdueDate - today;
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  // Time Score Logic Baru:
  // 1. Selama belum melewati hari H (daysRemaining >= 0), skor tetap 100.
  // 2. Jika sudah lewat (overdue) 1-3 hari, skor menjadi 80.
  // 3. Jika lewat lebih dari 3 hari, skor dikurangi 10 poin per hari (dimulai dari 70).
  let timeScore = 100;
  if (daysRemaining < 0) {
    const daysLate = Math.abs(daysRemaining);
    if (daysLate <= 3) {
      timeScore = 80;
    } else {
      timeScore = Math.max(0, 80 - (daysLate - 3) * 10);
    }
  }

  // C. BIAYA (Bobot: 15%)
  const overrunCost = Math.max(0, actualCost - budgetRap);
  const costDevPercent = budgetRap > 0 ? (overrunCost / budgetRap) * 100 : 0;
  let costScore = 100;
  if (budgetRap > 0) {
    costScore = Math.max(0, 100 - costDevPercent * 10);
  } else if (actualCost > 0) {
    costScore = 0;
  }

  // D. KOMPLAIN / MUTU (Bobot: 25%)
  const complaintsCount = complaints.length;
  const solvedComplaintsCount = complaints.filter((c) => c.status == 1).length;
  let baseComplaintScore = 100 - complaintsCount * 20;
  let solvedBonus = solvedComplaintsCount * 15;
  const complaintScore = Math.min(
    100,
    Math.max(0, baseComplaintScore + solvedBonus),
  );

  // ==========================================
  // 3. PERHITUNGAN NILAI AKHIR (PEMBOBOTAN)
  // ==========================================
  // Progres (35%), Waktu (25%), Komplain (25%), Biaya (15%)
  const finalScore =
    progressScore * 0.35 +
    timeScore * 0.25 +
    complaintScore * 0.25 +
    costScore * 0.15;

  // Logika warna status badge
  let statusBadge = { label: "CRITICAL", color: "bg-red-500" };
  if (finalScore >= 80)
    statusBadge = { label: "EXCELLENT", color: "bg-green-500" };
  else if (finalScore >= 60)
    statusBadge = { label: "GOOD", color: "bg-blue-500" };
  else if (finalScore >= 40)
    statusBadge = { label: "WARNING", color: "bg-yellow-500" };

  return (
    <div className="w-full bg-transparent">
      {/* Header View */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart className="w-6 h-6 text-[#1e293b]" />
        <h2 className="text-xl font-bold text-[#1e293b]">
          Scoring Resmi KPI Bulanan{" "}
          {project?.project_name ? `- ${project.project_name}` : ""}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Score Card - Kiri */}
        <div className="lg:col-span-4 bg-[#0f172a] rounded-xl p-8 flex flex-col items-center justify-center text-white shadow-md">
          <h3 className="text-base font-semibold text-slate-200 mb-2">
            Skor Akhir KPI
          </h3>
          <div className="text-[5rem] font-extrabold leading-none mb-4 tracking-tight">
            {finalScore.toFixed(1)}
          </div>
          <span
            className={`${statusBadge.color} text-white px-5 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Sub Scores Card - Kanan (Grid 2x2) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Progres Project (35%) */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Progres Project (35%)
            </h4>
            <div className="text-4xl font-extrabold text-[#0f172a] mb-3">
              {progressScore.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Deviasi Target:{" "}
              <span
                className={`font-medium ${actualProgress < target ? "text-red-500" : "text-green-500"}`}
              >
                {actualProgress >= target ? "+" : ""}
                {(actualProgress - target).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Card 2: Tenggat Waktu (25%) */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Tenggat Waktu (25%)
            </h4>
            <div className="text-4xl font-extrabold text-[#0f172a] mb-3">
              {timeScore.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Sisa Waktu:{" "}
              <span
                className={`font-medium ${daysRemaining < 0 ? "text-red-500" : "text-blue-500"}`}
              >
                {daysRemaining} Hari
              </span>
            </div>
          </div>

          {/* Card 3: Komplain / Mutu (25%) */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Komplain / Mutu (25%)
            </h4>
            <div className="text-4xl font-extrabold text-[#0f172a] mb-3">
              {complaintScore.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500">
              Total Komplain:{" "}
              <span
                className={`font-medium ${complaintsCount > 0 ? "text-red-500" : "text-green-500"}`}
              >
                {complaintsCount} Kasus
              </span>
            </div>
          </div>

          {/* Card 4: Deviasi Biaya (15%) */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              Deviasi Biaya (15%)
            </h4>
            <div className="text-4xl font-extrabold text-[#0f172a] mb-3">
              {costScore.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 mb-1">
              Rasio Nombok:{" "}
              <span
                className={`font-medium ${costDevPercent > 0 ? "text-red-500" : "text-green-500"}`}
              >
                {costDevPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectKpiView;
