// pages/api/silver/signal.js
import { getSupabaseAdmin, getAuthUser } from '../../../lib/supabaseClient'

function makeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'DB 연결 오류' })

  const body = req.method === 'GET' ? req.query : req.body
  const { action } = body

  // ── 방 생성 (로그인 필수) ──
  if (action === 'create') {
    const user = await getAuthUser(req)
    if (!user) return res.status(401).json({ error: '로그인이 필요합니다' })

    await supabase.from('silver_share_sessions')
      .update({ status: 'ended' })
      .eq('host_id', user.id).eq('status', 'waiting')

    let code, exists = true
    while (exists) {
      code = makeCode()
      const { data } = await supabase.from('silver_share_sessions')
        .select('id').eq('share_code', code).eq('status', 'waiting').single()
      exists = !!data
    }

    const { data, error } = await supabase.from('silver_share_sessions').insert({
      share_code: code, host_id: user.id, status: 'waiting',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }).select().single()

    if (error) return res.status(500).json({ error: '세션 생성 실패' })
    return res.status(200).json({ session: data })
  }

  // ── offer/answer/ICE — 코드만 알면 접근 가능 (WebRTC 시그널링) ──
  if (action === 'set_offer') {
    const { share_code, offer } = body
    await supabase.from('silver_share_sessions').update({ offer }).eq('share_code', share_code)
    return res.status(200).json({ ok: true })
  }

  if (action === 'set_answer') {
    const { share_code, answer } = body
    await supabase.from('silver_share_sessions')
      .update({ answer, status: 'connected' }).eq('share_code', share_code)
    return res.status(200).json({ ok: true })
  }

  if (action === 'add_ice') {
    const { share_code, candidate, role } = body
    const field = role === 'host' ? 'host_ice' : 'guest_ice'
    const { data } = await supabase.from('silver_share_sessions')
      .select(field).eq('share_code', share_code).single()
    if (!data) return res.status(404).json({ error: '세션 없음' })
    await supabase.from('silver_share_sessions')
      .update({ [field]: [...(data[field] || []), candidate] }).eq('share_code', share_code)
    return res.status(200).json({ ok: true })
  }

  if (action === 'get') {
    const { share_code } = body
    const { data, error } = await supabase.from('silver_share_sessions')
      .select('*').eq('share_code', share_code).single()
    if (error || !data) return res.status(404).json({ error: '세션 없음' })
    return res.status(200).json({ session: data })
  }

  if (action === 'end') {
    const { share_code } = body
    await supabase.from('silver_share_sessions')
      .update({ status: 'ended' }).eq('share_code', share_code)
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: '잘못된 요청' })
}
