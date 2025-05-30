export const Constants = {
  username: "username",
  loggedIn: "loggedIn",
};

export const FilterTypes = {
  string: "string" as const,
  date: "date" as const,
  year: "year" as const,
  month: "month" as const,
};

export const API_URL = import.meta.env.VITE_API_URL;

export const JWT_STORAGE = import.meta.env.VITE_JWT_STORAGE;

export const ENABLE_RAG = ["true", "1", "yes"].includes((import.meta.env.VITE_ENABLE_RAG || "").toLowerCase());

export const ALLOWED_HOSTS = (import.meta.env.VITE_ALLOWED_HOSTS || "")
  .split(",")
  .map((host: string) => host.trim())
  .filter((host: string) => host.length > 0);