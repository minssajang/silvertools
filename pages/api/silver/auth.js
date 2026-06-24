// pages/api/silver/auth.js
import { getSupabaseAdmin } from '../../../lib/supabaseClient'
import crypto from 'crypto'

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + process.env.SILVER_PW_SALT || 'silver2025').digest('hex')
}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'DB 연결 오류' })

  const { action, phone, password, name } = req.body

  // ── 회원가입 ──
  if (action === 'register') {
    if (!phone || !password) return res.status(400).json({ error: '전화번호와 비밀번호를 입력하세요' })

    const { data: existing } = await supabase
      .from('silver_users').select('id').eq('phone', phone).single()
    if (existing) return res.status(400).json({ error: '이미 가입된 전화번호입니다' })

    // 초대코드 유니크 생성
    let inviteCode, exists = true
    while (exists) {
      inviteCode = generateInviteCode()
      const { data } = await supabase.from('silver_users').select('id').eq('invite_code', inviteCode).single()
      exists = !!data
    }

    const { data: user, error } = await supabase.from('silver_users').insert({
      phone, name: name || phone,
      password: hashPassword(password),
      invite_code: inviteCode,
    }).select().single()

    if (error) return res.status(500).json({ error: '가입 실패' })

    return res.status(200).json({
      user: { id: user.id, phone: user.phone, name: user.name, invite_code: user.invite_code }
    })
  }

  // ── 로그인 ──
  if (action === 'login') {
    if (!phone || !password) return res.status(400).json({ error: '전화번호와 비밀번호를 입력하세요' })

    const { data: user, error } = await supabase
      .from('silver_users').select('*').eq('phone', phone).single()

    if (error || !user) return res.status(401).json({ error: '전화번호 또는 비밀번호가 틀렸습니다' })
    if (user.password !== hashPassword(password)) return res.status(401).json({ error: '전화번호 또는 비밀번호가 틀렸습니다' })

    return res.status(200).json({
      user: { id: user.id, phone: user.phone, name: user.name, invite_code: user.invite_code }
    })
  }

  // ── 가족 연동 (초대코드로) ──
  if (action === 'link_family') {
    const { family_id, invite_code } = req.body

    const { data: senior } = await supabase
      .from('silver_users').select('id, name, phone').eq('invite_code', invite_code.toUpperCase()).single()
    if (!senior) return res.status(404).json({ error: '유효하지 않은 초대코드입니다' })
    if (senior.id === family_id) return res.status(400).json({ error: '본인과 연동할 수 없습니다' })

    const { error } = await supabase.from('silver_family_links').upsert({
      senior_id: senior.id, family_id, status: 'active'
    }, { onConflict: 'senior_id,family_id' })

    if (error) return res.status(500).json({ error: '연동 실패' })

    return res.status(200).json({ senior: { id: senior.id, name: senior.name, phone: senior.phone } })
  }

  // ── 연동된 어르신 목록 ──
  if (action === 'get_linked_seniors') {
    const { family_id } = req.body

    const { data, error } = await supabase
      .from('silver_family_links')
      .select('senior_id, silver_users!silver_family_links_senior_id_fkey(id, name, phone, invite_code)')
      .eq('family_id', family_id)
      .eq('status', 'active')

    if (error) return res.status(500).json({ error: '조회 실패' })

    return res.status(200).json({
      seniors: (data || []).map(d => d.silver_users)
    })
  }

  return res.status(400).json({ error: '잘못된 요청' })
}
