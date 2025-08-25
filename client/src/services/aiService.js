import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL  || 'http://localhost:4000/api';

export const generateGlossary = async (content) => {
  try {
    const response = await axios.post(`${API_URL}/ai/glossary`, { content });
    return response.data;
  } catch (error) {
    console.error('Glossary error:', error.response?.data || error.message);
    throw error;
  }

};

export const generateSummary = async (content) => {
  const response = await axios.post(`${API_URL}/ai/summary`, { content });
  return response.data;
};

export const generateTags = async (content) => {
  const response = await axios.post(`${API_URL}/ai/tags`, { content });
  return response.data;
};

export const checkGrammar = async (content) => {
  const response = await axios.post(`${API_URL}/ai/grammar`, { content });
  return response.data;
};

export const translateText = async (content, targetLanguage) => {
  const response = await axios.post(`${API_URL}/ai/translate`, { content, targetLanguage });
  return response.data;
};