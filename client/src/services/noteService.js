// src/services/noteService.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Get all notes
export const getNotes = async () => {
  try {
    const response = await api.get("/notes");
    return response.data;
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }
};

// Create new note
export const createNote = async (note) => {
  try {
    console.log("Creating note with data:", note);
    const response = await api.post("/notes", note);
    console.log("Note created successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating note:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

// Update note by ID
export const updateNote = async (id, note) => {
  try {
    const response = await api.patch(`/notes/${id}`, note);
    return response.data;
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
};

// Delete note by ID
export const deleteNote = async (id) => {
  try {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

// Search notes
export const searchNotes = async (query) => {
  try {
    const response = await api.get(`/notes/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error("Error searching notes:", error);
    throw error;
  }
};