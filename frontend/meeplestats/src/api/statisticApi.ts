import { API_URL, JWT_STORAGE } from "../model/Constants";

export const fetchStatistics = async (endpoint: string, params: Record<string, string> = {}) => {
  const queryString = new URLSearchParams(params).toString();

  const requestOptions: RequestInit = {
    method: "GET",
  };

  // Check the JWT_STORAGE value and set credentials or headers accordingly
  if (JWT_STORAGE === "cookie") {
    requestOptions.credentials = "include";
  } else if (JWT_STORAGE === "localstorage") {
    requestOptions.headers = {
      Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
    };
  }

  const response = await fetch(`${API_URL}/${endpoint}?${queryString}`, requestOptions);
  if (!response.ok) {
    // concatenate the error message from the server
    throw new Error(`Failed to fetch data from ${endpoint}: ${await response.text()}`);
  }
  return response.json();
};