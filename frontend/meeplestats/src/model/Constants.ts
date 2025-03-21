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