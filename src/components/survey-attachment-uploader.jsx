"use client";

import { useCallback, useRef } from "react";
import useSurveyAttachmentUpload from "@/hooks/useSurveyAttachmentUpload";
import { Button } from "@/components/ui/button";

export default function SurveyAttachmentUploader({ scheduleId, onSuccess }) {
  const { upload, cancel, state, reset } = useSurveyAttachmentUpload();
  const inputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      const key = await upload(scheduleId, file);
      if (key) onSuccess?.(key);
    },
    [upload, scheduleId, onSuccess],
  );

  const onChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="w-full max-w-md">
      <label className="flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={onChange}
        />
        <div className="text-2xl">📎</div>
        <p className="text-sm text-gray-600">
          Drag & drop atau klik untuk pilih file (max 100MB)
        </p>
      </label>

      {state.status === "uploading" && (
        <div className="mt-3">
          <div className="text-sm">Uploading... {state.progress}%</div>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <button className="mt-2 text-xs text-red-500" onClick={cancel}>
            Batalkan
          </button>
        </div>
      )}

      {state.status === "done" && (
        <div className="mt-3 text-sm text-green-700">Upload selesai ✓</div>
      )}

      {state.status === "error" && (
        <div className="mt-3 text-sm text-red-700">{state.error}</div>
      )}
    </div>
  );
}
