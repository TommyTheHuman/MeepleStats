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

// Fetch user's rulebooks
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

// Fetch user's personal collection
export const fetchPersonalCollection = async (): Promise<RulebookInterface[]> => {
  const requestOptions: RequestInit = {
    method: "GET",
    ...getAuthOptions(),
  };

  const response = await fetch(`${API_URL}/personal-collection`, requestOptions);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch personal collection: ${await response.text()}`);
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

// Fetch shared rulebooks (all users)
export const fetchSharedRulebooks = async (): Promise<RulebookInterface[]> => {
  const requestOptions: RequestInit = {
    method: "GET",
    ...getAuthOptions(),
  };

  const response = await fetch(`${API_URL}/shared-rulebooks`, requestOptions);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch shared rulebooks: ${await response.text()}`);
  }
  
  return response.json();
};

// Add a shared rulebook to personal collection
export const addToCollection = async (rulebookId: string): Promise<{ message: string; rulebook_id: string }> => {
  const requestOptions: RequestInit = {
    method: "POST",
    ...getAuthOptions(),
  };

  const response = await fetch(`${API_URL}/add-to-collection/${rulebookId}`, requestOptions);
  
  if (!response.ok) {
    throw new Error(`Failed to add to collection: ${await response.text()}`);
  }
  
  return response.json();
};

// Remove a rulebook from personal collection
export const removeFromCollection = async (rulebookId: string): Promise<{ message: string }> => {
  const requestOptions: RequestInit = {
    method: "DELETE",
    ...getAuthOptions(),
  };

  const response = await fetch(`${API_URL}/remove-from-collection/${rulebookId}`, requestOptions);
  
  if (!response.ok) {
    throw new Error(`Failed to remove from collection: ${await response.text()}`);
  }
  
  return response.json();
};

// Upload a rulebook
export const uploadRulebook = async (
  file: File,
  gameId: string,
  gameName: string,
  isShared: boolean = false
): Promise<{ message: string; file_url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("game_id", gameId);
  formData.append("game_name", gameName);
  formData.append("is_shared", isShared.toString());

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

// Upload a shared rulebook (always shared with all users)
export const uploadSharedRulebook = async (
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

  const response = await fetch(`${API_URL}/upload-shared-rulebook`, requestOptions);
  
  if (!response.ok) {
    throw new Error(`Failed to upload shared rulebook: ${await response.text()}`);
  }
  
  return response.json();
};

// Share an existing rulebook
export const shareRulebook = async (rulebookId: string): Promise<{ message: string }> => {
  const requestOptions: RequestInit = {
    method: "PUT",
    ...getAuthOptions(),
  };

  const response = await fetch(`${API_URL}/share-rulebook/${rulebookId}`, requestOptions);
  
  if (!response.ok) {
    throw new Error(`Failed to share rulebook: ${await response.text()}`);
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
