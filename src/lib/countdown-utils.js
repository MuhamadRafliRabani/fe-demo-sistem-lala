/**
 * Utility functions for countdown calculation
 * Calculate countdown client-side to avoid excessive API calls
 */

/**
 * Format seconds to HH:MM:SS
 */
export function formatCountdown(seconds) {
  if (seconds <= 0) return "00:00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Hitung status countdown dari event survey dengan logika yang sederhana.
 * Fokus hanya ke:
 * - status aktif/tidak
 * - belum mulai, sedang jalan, atau terlambat
 */
export function calculateCountdownStatus(eventData, now = new Date()) {
  if (!eventData || !eventData.departure_at || !eventData.return_end_at) {
    return {
      isActive: false,
      phase: "waiting",
      phaseMessage: "Menunggu waktu berangkat",
      remainingSeconds: 0,
      overtimeSeconds: 0,
    };
  }

  const currentTime = now instanceof Date ? now : new Date(now);
  const departureAt = new Date(eventData.departure_at);
  const returnEndAt = new Date(eventData.return_end_at);
  const actualReturnAt = eventData.actual_return_at
    ? new Date(eventData.actual_return_at)
    : null;

  const status =
    eventData.status === true ||
    eventData.status === 1 ||
    eventData.status === "1" ||
    String(eventData.status).toLowerCase() === "true";

  const isActive = status && actualReturnAt === null;

  let remainingSeconds = 0;
  let overtimeSeconds = 0;
  let phase = "waiting";
  let phaseMessage = "Menunggu waktu berangkat";

  if (actualReturnAt) {
    phase = "completed";
    phaseMessage = "Survey selesai";
    remainingSeconds = 0;
    if (actualReturnAt > returnEndAt) {
      overtimeSeconds = Math.floor((actualReturnAt - returnEndAt) / 1000);
    }
  } else if (!status) {
    if (currentTime < departureAt) {
      phase = "waiting";
      phaseMessage = "Menunggu waktu berangkat";
    } else {
      phase = "inactive";
      phaseMessage = "Belum dimulai";
    }
    remainingSeconds = 0;
    overtimeSeconds = 0;
  } else {
    if (currentTime < departureAt) {
      phase = "waiting";
      phaseMessage = "Menunggu waktu berangkat";
      remainingSeconds = Math.floor((departureAt - currentTime) / 1000);
      overtimeSeconds = 0;
    } else if (currentTime <= returnEndAt) {
      phase = "active";
      phaseMessage = "Sedang survey";
      remainingSeconds = Math.floor((returnEndAt - currentTime) / 1000);
      overtimeSeconds = 0;
    } else {
      phase = "overtime";
      phaseMessage = "Terlambat kembali";
      remainingSeconds = 0;
      overtimeSeconds = Math.floor((currentTime - returnEndAt) / 1000);
    }
  }

  return {
    isActive,
    phase,
    phaseMessage,
    remainingSeconds,
    overtimeSeconds,
    departureAt: eventData.departure_at,
    actualDepartureAt: eventData.actual_departure_at,
    surveyStartAt: eventData.survey_start_at,
    surveyEndAt: eventData.survey_end_at,
    returnEndAt: eventData.return_end_at,
    actualReturnAt: eventData.actual_return_at,
  };
}

/**
 * Hook-like function to get countdown data from event
 * Use this to get initial data, then calculate client-side
 */
export function getCountdownFromEvent(eventData) {
  return calculateCountdownStatus(eventData);
}
