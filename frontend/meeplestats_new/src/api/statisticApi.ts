const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export const fetchStatistics = async (endpoint: string, params: Record<string, string> = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/${endpoint}?${queryString}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    // concatenate the error message from the server
    throw new Error(`Failed to fetch data from ${endpoint}: ${await response.text()}`);
  }
  return response.json();
};