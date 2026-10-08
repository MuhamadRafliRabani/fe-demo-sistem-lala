import axiosInstance from "@/lib/axios";

export const apiGet = async (url, params) => {
  const { data: responseData } = await axiosInstance.get(url, { params });
  return responseData;
};

export const apiPost = async (url, data) => {
  const { data: responseData } = await axiosInstance.post(url, data);
  return responseData;
};

export const apiPut = async (url, data) => {
  const { data: responseData } = await axiosInstance.put(url, data);
  return responseData;
};

export const apiDelete = async (url) => {
  const { data: responseData } = await axiosInstance.delete(url);
  return responseData;
};
