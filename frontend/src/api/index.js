/**
 * api/index.js
 *
 * Centralised Axios instance for all calls to the Node.js backend.
 * The base URL is read from the VITE_API_URL environment variable so
 * it can be changed without touching component code.
 *
 * The request interceptor automatically attaches the stored JWT token
 * to every outgoing request as a Bearer header.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15_000,
})

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cv_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Auth ──────────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data)
export const login    = (data) => api.post('/auth/login', data)
export const getMe    = ()     => api.get('/auth/me')

// ── Courses ───────────────────────────────────────────────────
export const fetchCourses = (params) => api.get('/courses', { params })
export const fetchCourse  = (id)     => api.get(`/courses/${id}`)

// ── Notes ─────────────────────────────────────────────────────
export const fetchNotes = (params) => api.get('/notes', { params })
export const fetchNote  = (id)     => api.get(`/notes/${id}`)

// ── Tutorials ─────────────────────────────────────────────────
export const fetchTutorials = (params) => api.get('/tutorials', { params })
export const fetchTutorial  = (id)     => api.get(`/tutorials/${id}`)

// ── Visualize ─────────────────────────────────────────────────
export const visualizeCode = (code) => api.post('/visualize', { code })

export default api
