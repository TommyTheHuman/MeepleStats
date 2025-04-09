import { API_URL, JWT_STORAGE } from "../model/Constants";
import { RulebookInterface, RulebookChatResponse } from "../model/Interfaces";

// Get authentication headers or credentials based on JWT storage method
const getAuthOptions = (): RequestInit => {
  const requestOptions: RequestInit = {};

  if (JWT_STORAGE === "cookie") {
    requestOptions.credentials = "include";
  } else if (JWT_STORAGE === "localstorage") {
    requestOptions.headers = {
      Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
    };
  }

  return requestOptions;
};

// Fetch all rulebooks
export const fetchRulebooks = async (): Promise<RulebookInterface[]> => {
  const requestOptions: RequestInit = {
    method: "GET",
    ...getAuthOptions(),
  };

  const response = await fetch(`${API_URL}/rulebooks`, requestOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch rulebooks: ${await response.text()}`);
  }

  return response.json();
};

// Fetch a specific rulebook by ID
export const fetchRulebookById = async (id: string): Promise<RulebookInterface> => {
  const requestOptions: RequestInit = {
    method: "GET",
    ...getAuthOptions(),
  };

  const response = await fetch(`${API_URL}/rulebook/${id}`, requestOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch rulebook: ${await response.text()}`);
  }

  return response.json();
};

// Upload a rulebook
export const uploadRulebook = async (
  file: File,
  gameId: string,
  gameName: string
): Promise<{ message: string; file_url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("game_id", gameId);
  formData.append("game_name", gameName);

  const requestOptions: RequestInit = {
    method: "POST",
    body: formData,
    ...getAuthOptions(),
  };

  // Remove headers if they exist since FormData sets its own
  if (requestOptions.headers) {
    const headers = requestOptions.headers as Record<string, string>;
    if (JWT_STORAGE === "localstorage") {
      requestOptions.headers = {
        Authorization: headers.Authorization,
      };
    }
  }

  const response = await fetch(`${API_URL}/upload-rulebook`, requestOptions);

  if (!response.ok) {
    throw new Error(`Failed to upload rulebook: ${await response.text()}`);
  }

  return response.json();
};

// Delete a rulebook
export const deleteRulebook = async (rulebookId: string): Promise<{ message: string }> => {
  const requestOptions: RequestInit = {
    method: "DELETE",
    ...getAuthOptions(),
  };

  const response = await fetch(`${API_URL}/rulebook/${rulebookId}`, requestOptions);

  if (!response.ok) {
    throw new Error(`Failed to delete rulebook: ${await response.text()}`);
  }

  return response.json();
};

// Send a chat query to the backend
export const sendChatQuery = async (query: string, rulebookId: string, includeContext: boolean = false): Promise<RulebookChatResponse> => {
  const requestOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      rulebook_id: rulebookId,
      include_context: includeContext
    }),
  };

  if (JWT_STORAGE === "cookie") {
    requestOptions.credentials = "include";
  } else if (JWT_STORAGE === "localstorage") {
    requestOptions.headers = {
      ...requestOptions.headers,
      Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
    };
  }

  const response = await fetch(`${API_URL}/rulebook-chat`, requestOptions);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to query rulebook");
  }

  return response.json();
}; 