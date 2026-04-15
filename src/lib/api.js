// API client for Kiwi Learn backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('kiwi_token');
};

// Helper to set auth token
const setToken = (token) => {
  if (token) {
    localStorage.setItem('kiwi_token', token);
  } else {
    localStorage.removeItem('kiwi_token');
  }
};

// Base fetch wrapper with auth
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 (unauthorized) - clear token and redirect to auth
  if (response.status === 401) {
    setToken(null);
    if (window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
    throw new Error('Unauthorized');
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error((data && data.error) || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  login: async (credentials) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  logout: () => {
    setToken(null);
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },
};

// User/Profile API
export const userAPI = {
  getProfile: async () => {
    const data = await apiRequest('/users/profile');
    return data.profile;
  },

  updateProfile: async (updates) => {
    const data = await apiRequest('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.profile;
  },

  getAchievements: async () => {
    const data = await apiRequest('/users/achievements');
    return data.achievements;
  },

  addAchievement: async (achievement) => {
    const data = await apiRequest('/users/achievements', {
      method: 'POST',
      body: JSON.stringify(achievement),
    });
    return data.achievement;
  },

  addXP: async (amount) => {
    const data = await apiRequest('/users/xp', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return data;
  },
};

// Documents API
export const documentsAPI = {
  getAll: async () => {
    const data = await apiRequest('/documents');
    return data.documents;
  },

  getById: async (id) => {
    const data = await apiRequest(`/documents/${id}`);
    return data.document;
  },

  upload: async (file, content = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (content) {
      formData.append('content', content);
    }

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data.document;
  },

  delete: async (id) => {
    await apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  update: async (id, updates) => {
    const data = await apiRequest(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.document;
  },
};

// Lessons API
export const lessonsAPI = {
  getAll: async () => {
    const data = await apiRequest('/lessons');
    return data.lessons;
  },

  getByDocument: async (documentId) => {
    const data = await apiRequest(`/lessons/document/${documentId}`);
    return data.lessons;
  },

  getById: async (id) => {
    const data = await apiRequest(`/lessons/${id}`);
    return data.lesson;
  },

  create: async (documentId, lessons) => {
    const data = await apiRequest('/lessons', {
      method: 'POST',
      body: JSON.stringify({ documentId, lessons }),
    });
    return data.lessons;
  },

  delete: async (lessonId) => {
    await apiRequest(`/lessons/${lessonId}`, {
      method: 'DELETE'
    });
  },

  generateForDocument: async (documentId) => {
    const data = await apiRequest(`/lessons/generate/${documentId}`, {
      method: 'POST'
    });
    return data.lessons;
  },

  getProgress: async (lessonId) => {
    const data = await apiRequest(`/lessons/${lessonId}/progress`);
    return data.progress;
  },

  updateProgress: async (lessonId, progressData) => {
    const data = await apiRequest(`/lessons/${lessonId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
    return data.progress;
  },
};

// Export token management for external use
export { getToken, setToken };
