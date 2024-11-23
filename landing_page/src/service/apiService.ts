import axios from "axios";

export const apiService = axios.create({
  baseURL: "http://localhost:5000",
});

export const getVideoSummary = async (videoId: string) => {
  const response = await apiService.get(`/summary/${videoId}`);
  return response.data;
};
