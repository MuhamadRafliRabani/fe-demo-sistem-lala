"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const faqSchema = z.object({
  code: z.string().trim().min(1, "Code wajib diisi").max(100),
  question: z.string().trim().min(1, "Question wajib diisi").max(1000),
  answer: z.string().trim().min(1, "Answer wajib diisi"),
});

export default function FaqForm({
  defaultValues,
  isPending = false,
  submitLabel = "Simpan",
  onSubmit,
}) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      code: "",
      question: "",
      answer: "",
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        code: defaultValues.code || "",
        question: defaultValues.question || "",
        answer: defaultValues.answer || "",
      });
    }
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col space-y-2">
          <Label>
            Code <span className="text-red-500">*</span>
          </Label>
          <Input placeholder="Contoh: FAQ-001" {...register("code")} />
          {errors.code && (
            <span className="text-sm text-red-500">{errors.code.message}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <Label>
          Question <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="question"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              rows={4}
              placeholder="Tulis pertanyaan FAQ di sini..."
            />
          )}
        />
        {errors.question && (
          <span className="text-sm text-red-500">
            {errors.question.message}
          </span>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <Label>
          Answer <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="answer"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              rows={8}
              placeholder="Tulis jawaban FAQ di sini..."
            />
          )}
        />
        {errors.answer && (
          <span className="text-sm text-red-500">{errors.answer.message}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/Masters/faqs")}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
