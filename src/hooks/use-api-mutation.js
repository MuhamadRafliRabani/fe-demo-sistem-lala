"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPut, apiDelete } from "@/services/api";

export const usePost = (url, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => {
      const finalUrl = typeof url === "function" ? url(data) : url;
      return apiPost(finalUrl, data);
    },
    ...options,
    onSuccess: (data, variables, context) => {
      if (Array.isArray(options.invalidate)) {
        options.invalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key, exact: false });
        });
      }

      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, variables, context);
      }
    },
    onError: options.onError,
  });
};

export const usePut = (url, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => {
      const finalUrl = typeof url === "function" ? url(data) : url;
      return apiPut(finalUrl, data);
    },
    ...options,
    onSuccess: (data, variables, context) => {
      if (Array.isArray(options.invalidate)) {
        options.invalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key, exact: false });
        });
      }

      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, variables, context);
      }
    },
    onError: options.onError,
  });
};

export const useRemove = (url, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => {
      const finalUrl = typeof url === "function" ? url(data) : url;
      return apiDelete(finalUrl);
    },
    ...options,
    onSuccess: (data, variables, context) => {
      if (Array.isArray(options.invalidate)) {
        options.invalidate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key, exact: false });
        });
      }

      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, variables, context);
      }
    },
    onError: options.onError,
  });
};
