// lib/useAuth.js - 인증 헬퍼
import { getSupabaseClient } from './supabaseClient'

// localStorage에서 세션 가져오기
export function getSession() {
  if (typeof window === 'undefined') return null
  const s = localStorage.getItem('silver_session')
  return s ? JSON.parse(s) : null
}

export function getUser() {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem('silver_user')
  return u ? JSON.parse(u) : null
}

export function saveSession(user, session) {
  localStorage.setItem('silver_user', JSON.stringify(user))
  localStorage.setItem('silver_session', JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem('silver_user')
  localStorage.removeItem('silver_session')
}

// API 호출 시 Authorization 헤더 자동 추가
export function authHeaders() {
  const session = getSession()
  const token = session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

// 인증된 fetch
export async function authFetch(url, options = {}) {
  const session = getSession()
  const token = session?.access_token

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    }
  })

  // 401이면 세션 만료
  if (res.status === 401) {
    clearSession()
    window.location.href = '/login'
    return null
  }

  return res
}
