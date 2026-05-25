import axios from "axios";

const API_BASE_URL = "http://localhost:8000"; // Update if backend runs on a different port

export const processImageQuery = async (file, query) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("query", query);

  try {
    const response = await axios.post(`${API_BASE_URL}/image/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    return { error: "Failed to process request. Try again." };
  }
};
