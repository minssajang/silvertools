// pages/api/silver/medicine.js
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

  // 접근 권한 확인
  if (!(await canAccessUser(supabase, user.id, targetId))) {
    return res.status(403).json({ error: '접근 권한이 없습니다' })
  }

  // ── 약 목록 + 오늘 로그 조회 ──
  if (method === 'GET') {
    const { data: meds, error } = await supabase
      .from('silver_medications').select('*')
      .eq('user_id', targetId).eq('active', true).order('created_at')
    if (error) return res.status(500).json({ error: '조회 실패' })

    const today = new Date().toISOString().slice(0, 10)
    const { data: logs } = await supabase
      .from('silver_med_logs').select('*')
      .eq('user_id', targetId).eq('date', today)

    return res.status(200).json({ meds: meds || [], logs: logs || [] })
  }

  if (method === 'POST') {
    const { action } = req.body

    if (action === 'add_med') {
      const { name, dose, times, days, color, memo } = req.body
      const { data, error } = await supabase.from('silver_medications')
        .insert({ user_id: user.id, name, dose, times, days, color, memo })
        .select().single()
      if (error) return res.status(500).json({ error: '추가 실패' })
      return res.status(200).json({ med: data })
    }

    if (action === 'update_med') {
      const { med_id, name, dose, times, days, color, memo } = req.body
      const { data, error } = await supabase.from('silver_medications')
        .update({ name, dose, times, days, color, memo })
        .eq('id', med_id).eq('user_id', user.id).select().single()
      if (error) return res.status(500).json({ error: '수정 실패' })
      return res.status(200).json({ med: data })
    }

    if (action === 'delete_med') {
      const { med_id } = req.body
      await supabase.from('silver_medications')
        .update({ active: false }).eq('id', med_id).eq('user_id', user.id)
      return res.status(200).json({ ok: true })
    }

    if (action === 'toggle_taken') {
      const { med_id, date, time, taken } = req.body
      const { error } = await supabase.from('silver_med_logs').upsert({
        user_id: user.id, med_id, date, time, taken,
        taken_at: taken ? new Date().toISOString() : null
      }, { onConflict: 'med_id,date,time' })
      if (error) return res.status(500).json({ error: '기록 실패' })
      return res.status(200).json({ ok: true })
    }

    if (action === 'get_logs') {
      const { from_date, to_date } = req.body
      const { data, error } = await supabase
        .from('silver_med_logs')
        .select('*, silver_medications(name, color)')
        .eq('user_id', targetId)
        .gte('date', from_date).lte('date', to_date)
        .order('date', { ascending: false })
      if (error) return res.status(500).json({ error: '조회 실패' })
      return res.status(200).json({ logs: data || [] })
    }
  }

  return res.status(405).end()
}
