// pages/api/silver/signal.js
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

function makeCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'DB 연결 오류' })

  const { action } = req.body || req.query

  // ── 방 생성 (어르신이 공유 시작) ──
  if (action === 'create') {
    const { host_id } = req.body

    // 기존 세션 정리
    await supabase.from('silver_share_sessions')
      .update({ status: 'ended' })
      .eq('host_id', host_id)
      .eq('status', 'waiting')

    let code, exists = true
    while (exists) {
      code = makeCode()
      const { data } = await supabase.from('silver_share_sessions')
        .select('id').eq('share_code', code).eq('status', 'waiting').single()
      exists = !!data
    }

    const { data, error } = await supabase.from('silver_share_sessions').insert({
      share_code: code,
      host_id,
      status: 'waiting',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }).select().single()

    if (error) return res.status(500).json({ error: '세션 생성 실패' })
    return res.status(200).json({ session: data })
  }

  // ── offer 저장 (어르신) ──
  if (action === 'set_offer') {
    const { share_code, offer } = req.body
    const { error } = await supabase.from('silver_share_sessions')
      .update({ offer }).eq('share_code', share_code)
    if (error) return res.status(500).json({ error: '저장 실패' })
    return res.status(200).json({ ok: true })
  }

  // ── answer 저장 (자녀) ──
  if (action === 'set_answer') {
    const { share_code, answer } = req.body
    const { error } = await supabase.from('silver_share_sessions')
      .update({ answer, status: 'connected' }).eq('share_code', share_code)
    if (error) return res.status(500).json({ error: '저장 실패' })
    return res.status(200).json({ ok: true })
  }

  // ── ICE candidate 추가 ──
  if (action === 'add_ice') {
    const { share_code, candidate, role } = req.body  // role: 'host' | 'guest'
    const field = role === 'host' ? 'host_ice' : 'guest_ice'

    const { data } = await supabase.from('silver_share_sessions')
      .select(field).eq('share_code', share_code).single()
    if (!data) return res.status(404).json({ error: '세션 없음' })

    const updated = [...(data[field] || []), candidate]
    await supabase.from('silver_share_sessions')
      .update({ [field]: updated }).eq('share_code', share_code)

    return res.status(200).json({ ok: true })
  }

  // ── 세션 조회 (폴링) ──
  if (action === 'get' || req.method === 'GET') {
    const code = req.body?.share_code || req.query?.share_code
    const { data, error } = await supabase.from('silver_share_sessions')
      .select('*').eq('share_code', code).single()
    if (error || !data) return res.status(404).json({ error: '세션 없음' })
    return res.status(200).json({ session: data })
  }

  // ── 세션 종료 ──
  if (action === 'end') {
    const { share_code } = req.body
    await supabase.from('silver_share_sessions')
      .update({ status: 'ended' }).eq('share_code', share_code)
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: '잘못된 요청' })
}
