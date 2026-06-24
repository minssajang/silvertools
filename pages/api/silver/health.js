// pages/api/silver/health.js
import { getSupabaseAdmin, getAuthUser } from '../../../lib/supabaseClient'

async function canAccessUser(supabase, requesterId, targetId) {
  if (requesterId === targetId) return true
  const { data } = await supabase.from('silver_family_links')
    .select('id').eq('senior_id', targetId).eq('family_id', requesterId).eq('status', 'active').single()
  return !!data
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'DB 연결 오류' })

  const user = await getAuthUser(req)
  if (!user) return res.status(401).json({ error: '로그인이 필요합니다' })

  const { method } = req
  const targetId = req.query.view_as || user.id

  if (!(await canAccessUser(supabase, user.id, targetId))) {
    return res.status(403).json({ error: '접근 권한이 없습니다' })
  }

  if (method === 'GET') {
    const { type } = req.query

    if (type) {
      const { data, error } = await supabase
        .from('silver_health_records').select('*')
        .eq('user_id', targetId).eq('type', type)
        .order('recorded_at', { ascending: false }).limit(100)
      if (error) return res.status(500).json({ error: '조회 실패' })
      return res.status(200).json({ records: data || [] })
    }

    const { data: contacts } = await supabase
      .from('silver_sos_contacts').select('*')
      .eq('user_id', targetId).order('sort_order')

    const { data: myInfo } = await supabase
      .from('silver_my_info').select('*').eq('user_id', targetId).single()

    return res.status(200).json({ contacts: contacts || [], myInfo: myInfo || {} })
  }

  if (method === 'POST') {
    const { action } = req.body

    if (action === 'add_health') {
      const { type, v1, v2, memo, recorded_at } = req.body
      const { data, error } = await supabase.from('silver_health_records').insert({
        user_id: user.id, type, v1, v2, memo,
        recorded_at: recorded_at || new Date().toISOString()
      }).select().single()
      if (error) return res.status(500).json({ error: '저장 실패' })
      return res.status(200).json({ record: data })
    }

    if (action === 'delete_health') {
      const { record_id } = req.body
      await supabase.from('silver_health_records')
        .delete().eq('id', record_id).eq('user_id', user.id)
      return res.status(200).json({ ok: true })
    }

    if (action === 'save_contacts') {
      const { contacts } = req.body
      await supabase.from('silver_sos_contacts').delete().eq('user_id', user.id)
      if (contacts.length > 0) {
        await supabase.from('silver_sos_contacts').insert(
          contacts.map((c, i) => ({ ...c, user_id: user.id, sort_order: i }))
        )
      }
      return res.status(200).json({ ok: true })
    }

    if (action === 'save_my_info') {
      const { name, birth, blood_type, disease, allergy, address } = req.body
      const { error } = await supabase.from('silver_my_info').upsert({
        user_id: user.id, name, birth, blood_type, disease, allergy, address,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      if (error) return res.status(500).json({ error: '저장 실패' })
      return res.status(200).json({ ok: true })
    }
  }

  return res.status(405).end()
}
