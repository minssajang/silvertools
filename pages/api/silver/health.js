// pages/api/silver/health.js
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'DB 연결 오류' })

  const { method } = req
  const { user_id, view_as } = req.query
  const targetId = view_as || user_id

  if (method === 'GET') {
    const { type } = req.query

    // ── 건강 기록 조회 ──
    if (type) {
      const { data, error } = await supabase
        .from('silver_health_records')
        .select('*')
        .eq('user_id', targetId)
        .eq('type', type)
        .order('recorded_at', { ascending: false })
        .limit(100)
      if (error) return res.status(500).json({ error: '조회 실패' })
      return res.status(200).json({ records: data || [] })
    }

    // ── SOS 연락처 조회 ──
    const { data: contacts } = await supabase
      .from('silver_sos_contacts').select('*')
      .eq('user_id', targetId).order('sort_order')

    // ── 내 의료 정보 조회 ──
    const { data: myInfo } = await supabase
      .from('silver_my_info').select('*').eq('user_id', targetId).single()

    return res.status(200).json({ contacts: contacts || [], myInfo: myInfo || {} })
  }

  if (method === 'POST') {
    const { action } = req.body

    // ── 건강 기록 추가 ──
    if (action === 'add_health') {
      const { type, v1, v2, memo, recorded_at } = req.body
      const { data, error } = await supabase.from('silver_health_records').insert({
        user_id, type, v1, v2, memo,
        recorded_at: recorded_at || new Date().toISOString()
      }).select().single()
      if (error) return res.status(500).json({ error: '저장 실패' })
      return res.status(200).json({ record: data })
    }

    // ── 건강 기록 삭제 ──
    if (action === 'delete_health') {
      const { record_id } = req.body
      await supabase.from('silver_health_records')
        .delete().eq('id', record_id).eq('user_id', user_id)
      return res.status(200).json({ ok: true })
    }

    // ── SOS 연락처 저장 ──
    if (action === 'save_contacts') {
      const { contacts } = req.body
      await supabase.from('silver_sos_contacts').delete().eq('user_id', user_id)
      if (contacts.length > 0) {
        await supabase.from('silver_sos_contacts').insert(
          contacts.map((c, i) => ({ ...c, user_id, sort_order: i }))
        )
      }
      return res.status(200).json({ ok: true })
    }

    // ── 내 의료 정보 저장 ──
    if (action === 'save_my_info') {
      const { name, birth, blood_type, disease, allergy, address } = req.body
      const { error } = await supabase.from('silver_my_info').upsert({
        user_id, name, birth, blood_type, disease, allergy, address,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (error) return res.status(500).json({ error: '저장 실패' })
      return res.status(200).json({ ok: true })
    }
  }

  return res.status(405).end()
}
