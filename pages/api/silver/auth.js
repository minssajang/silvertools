// pages/api/silver/auth.js
import { getSupabaseAdmin, getAuthUser } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'DB 연결 오류' })

  const { action } = req.body

  // ── 회원가입 ──
  if (action === 'register') {
    const { phone, password, name } = req.body
    if (!phone || !password) return res.status(400).json({ error: '전화번호와 비밀번호를 입력하세요' })
    if (password.length < 6) return res.status(400).json({ error: '비밀번호는 6자리 이상' })

    // Supabase Auth 회원가입 (전화번호를 이메일 형식으로 변환)
    const email = `${phone.replace(/-/g, '')}@silvertools.app`
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      phone: phone.replace(/-/g, ''),
      user_metadata: { name: name || phone, phone },
      email_confirm: true, // 이메일 인증 없이 바로 활성화
    })

    if (error) {
      if (error.message.includes('already')) return res.status(400).json({ error: '이미 가입된 전화번호입니다' })
      return res.status(500).json({ error: '가입 실패: ' + error.message })
    }

    // 프로필 조회 (트리거로 자동 생성됨)
    const { data: profile } = await supabase
      .from('silver_profiles').select('*').eq('id', data.user.id).single()

    // 로그인 토큰 발급
    const { data: session } = await supabase.auth.admin.generateLink({
      type: 'magiclink', email
    })

    // 직접 로그인 처리
    const { data: signIn } = await supabase.auth.signInWithPassword({ email, password })

    return res.status(200).json({
      user: {
        id: data.user.id,
        phone: phone,
        name: name || phone,
        invite_code: profile?.invite_code,
      },
      session: signIn?.session,
    })
  }

  // ── 로그인 ──
  if (action === 'login') {
    const { phone, password } = req.body
    if (!phone || !password) return res.status(400).json({ error: '전화번호와 비밀번호를 입력하세요' })

    const email = `${phone.replace(/-/g, '')}@silvertools.app`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) return res.status(401).json({ error: '전화번호 또는 비밀번호가 틀렸습니다' })

    const { data: profile } = await supabase
      .from('silver_profiles').select('*').eq('id', data.user.id).single()

    return res.status(200).json({
      user: {
        id: data.user.id,
        phone: profile?.phone || phone,
        name: profile?.name || phone,
        invite_code: profile?.invite_code,
      },
      session: data.session,
    })
  }

  // ── 로그아웃 ──
  if (action === 'logout') {
    const user = await getAuthUser(req)
    if (user) await supabase.auth.admin.signOut(user.id)
    return res.status(200).json({ ok: true })
  }

  // ── 가족 연동 (초대코드) ──
  if (action === 'link_family') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: '로그인이 필요합니다' })

    const { invite_code } = req.body
    const { data: senior } = await supabase
      .from('silver_profiles').select('id, name, phone')
      .eq('invite_code', invite_code.toUpperCase()).single()

    if (!senior) return res.status(404).json({ error: '유효하지 않은 초대코드입니다' })
    if (senior.id === user.id) return res.status(400).json({ error: '본인과 연동할 수 없습니다' })

    const { error } = await supabase.from('silver_family_links').upsert({
      senior_id: senior.id, family_id: user.id, status: 'active'
    }, { onConflict: 'senior_id,family_id' })

    if (error) return res.status(500).json({ error: '연동 실패' })
    return res.status(200).json({ senior })
  }

  // ── 연동된 어르신 목록 ──
  if (action === 'get_linked_seniors') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: '로그인이 필요합니다' })

    const { data, error } = await supabase
      .from('silver_family_links')
      .select('senior_id, silver_profiles!silver_family_links_senior_id_fkey(id, name, phone, invite_code)')
      .eq('family_id', user.id)
      .eq('status', 'active')

    if (error) return res.status(500).json({ error: '조회 실패' })
    return res.status(200).json({
      seniors: (data || []).map(d => d.silver_profiles)
    })
  }

  // ── 내 프로필 조회 ──
  if (action === 'get_profile') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: '로그인이 필요합니다' })

    const { data: profile } = await supabase
      .from('silver_profiles').select('*').eq('id', user.id).single()

    return res.status(200).json({ profile })
  }

  return res.status(400).json({ error: '잘못된 요청' })
}
