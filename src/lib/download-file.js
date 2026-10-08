import axiosInstance from "./axios";

export const downloadFile = async (url, filename) => {
  const response = await axiosInstance.get(url, {
    responseType: "blob",
  });

  const blob = response.data;
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 500);
};
