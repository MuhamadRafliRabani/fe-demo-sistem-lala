import { STAGE_SCHEDULE_MAP } from "@/data/data";

export function getScheduleByStage({ detailSchedule, stageCode }) {
  if (!detailSchedule || !stageCode) return null;

  const fields = STAGE_SCHEDULE_MAP[stageCode];
  if (!fields) return null;

  const [startKey, endKey] = fields;

  return {
    start: detailSchedule[startKey] ?? null,
    end: detailSchedule[endKey] ?? null,
  };
}
