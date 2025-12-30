/**
 * api/index.js — Shared Axios instance for all CodeVision API calls.
 *
 * Features:
 *   1. Base URL from VITE_API_URL env var (defaults to http://localhost:8000).
 *   2. Request interceptor: automatically attaches `Authorization: Bearer <token>`
 *      when an access token is available.
 *   3. Response interceptor: on 401, attempts one silent token refresh using
 *      the refresh token stored in sessionStorage.  If the refresh succeeds,
 *      the original request is retried transparently.  If the refresh fails,
 *      the user is signed out and redirected to /login.
 *
 * Token storage (sessionStorage):
 *   - Access token: held in memory only (module-level variable), never persisted.
 *   - Refresh token: sessionStorage['cv_rt'] — cleared when the tab closes.
 *     This is slightly weaker than an httpOnly cookie but far better than
 *     localStorage, and works without a reverse proxy on separate origins.
 *     To upgrade to httpOnly cookies later:
 *       1. Remove the sessionStorage read/write lines below.
 *       2. Set SameSite=Strict; HttpOnly; Secure on the FastAPI refresh response.
 *       3. Switch the /auth/refresh call to use credentials:'include'.
 *
 * Usage:
 *   import api from '../api'
 *   const { data } = await api.get('/codes')
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ── Module-level access token (in-memory, never persisted) ───────────────────
// AuthContext calls setAccessToken() after every login / token refresh.
// The interceptor below reads _accessToken on every request.
let _accessToken = null
let _onSignOut   = null   // callback set by AuthContext to trigger sign-out

export function setAccessToken(token) {
  _accessToken = token
}

export function setSignOutCallback(fn) {
  _onSignOut = fn
}

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach Bearer token ─────────────────────────────────
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers['Authorization'] = `Bearer ${_accessToken}`
  }
  return config
})

// ── Response interceptor: silent refresh on 401 ───────────────────────────────
// Use a flag + queue to prevent multiple simultaneous refresh calls when
// several requests 401 at the same moment (e.g. on page load).
let _isRefreshing  = false
let _refreshQueue  = []   // { resolve, reject }[]

function _processQueue(error, token = null) {
  _refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  _refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only intercept 401s that haven't already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Skip refresh for auth endpoints themselves (avoid infinite loops)
    if (originalRequest.url?.startsWith('/auth/')) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (_isRefreshing) {
      // Queue this request until the in-flight refresh resolves
      return new Promise((resolve, reject) => {
        _refreshQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return api(originalRequest)
      })
    }

    _isRefreshing = true
    const storedRefreshToken = sessionStorage.getItem('cv_rt')

    if (!storedRefreshToken) {
      _isRefreshing = false
      if (_onSignOut) _onSignOut()
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        { refresh_token: storedRefreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      )

      const newAccessToken  = data.access_token
      const newRefreshToken = data.refresh_token

      // Update in-memory access token and stored refresh token
      setAccessToken(newAccessToken)
      sessionStorage.setItem('cv_rt', newRefreshToken)

      _processQueue(null, newAccessToken)

      // Retry the original request with the new token
      originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      _processQueue(refreshError, null)
      sessionStorage.removeItem('cv_rt')
      setAccessToken(null)
      if (_onSignOut) _onSignOut()
      return Promise.reject(refreshError)
    } finally {
      _isRefreshing = false
    }
  },
)

export default api
