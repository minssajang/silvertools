// pages/api/silver/medicine.js
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'DB 연결 오류' })

  const { method } = req
  const { user_id, view_as } = req.query  // view_as: 자녀가 어르신 ID로 조회

  const targetId = view_as || user_id

  // ── 약 목록 조회 ──
  if (method === 'GET') {
    const { data: meds, error } = await supabase
      .from('silver_medications')
      .select('*')
      .eq('user_id', targetId)
      .eq('active', true)
      .order('created_at')

    if (error) return res.status(500).json({ error: '조회 실패' })

    // 오늘 복약 로그도 함께
    const today = new Date().toISOString().slice(0, 10)
    const { data: logs } = await supabase
      .from('silver_med_logs')
      .select('*')
      .eq('user_id', targetId)
      .eq('date', today)

    return res.status(200).json({ meds: meds || [], logs: logs || [] })
  }

  if (method === 'POST') {
    const { action } = req.body

    // ── 약 추가 ──
    if (action === 'add_med') {
      const { name, dose, times, days, color, memo } = req.body
      const { data, error } = await supabase.from('silver_medications').insert({
        user_id, name, dose, times, days, color, memo
      }).select().single()
      if (error) return res.status(500).json({ error: '추가 실패' })
      return res.status(200).json({ med: data })
    }

    // ── 약 수정 ──
    if (action === 'update_med') {
      const { med_id, name, dose, times, days, color, memo } = req.body
      const { data, error } = await supabase.from('silver_medications')
        .update({ name, dose, times, days, color, memo })
        .eq('id', med_id).eq('user_id', user_id)
        .select().single()
      if (error) return res.status(500).json({ error: '수정 실패' })
      return res.status(200).json({ med: data })
    }

    // ── 약 삭제 (soft delete) ──
    if (action === 'delete_med') {
      const { med_id } = req.body
      await supabase.from('silver_medications')
        .update({ active: false }).eq('id', med_id).eq('user_id', user_id)
      return res.status(200).json({ ok: true })
    }

    // ── 복약 체크/해제 ──
    if (action === 'toggle_taken') {
      const { med_id, date, time, taken } = req.body
      const { error } = await supabase.from('silver_med_logs').upsert({
        user_id, med_id, date, time, taken,
        taken_at: taken ? new Date().toISOString() : null
      }, { onConflict: 'med_id,date,time' })
      if (error) return res.status(500).json({ error: '기록 실패' })
      return res.status(200).json({ ok: true })
    }

    // ── 복약 기록 조회 (날짜 범위) ──
    if (action === 'get_logs') {
      const { from_date, to_date } = req.body
      const { data, error } = await supabase
        .from('silver_med_logs')
        .select('*, silver_medications(name, color)')
        .eq('user_id', targetId)
        .gte('date', from_date)
        .lte('date', to_date)
        .order('date', { ascending: false })
      if (error) return res.status(500).json({ error: '조회 실패' })
      return res.status(200).json({ logs: data || [] })
    }
  }

  return res.status(405).end()
}
