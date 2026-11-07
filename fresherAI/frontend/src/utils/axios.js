import axios from "axios";

const rawUrl = import.meta.env.VITE_BACKEND_URL || "";
const cleanBaseUrl = rawUrl.replace(/\/+$/, "");

const api = axios.create({
    baseURL: cleanBaseUrl,
    withCredentials: true
});

export default api;
