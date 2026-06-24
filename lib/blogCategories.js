// 블로그 기본 카테고리
export const DEFAULT_CATEGORIES = [
  'magnifier-down', 'medicine', 'hospital', 'sos', 'brain-game', 'health-record', 'big-news', 'transit',
]

const CATEGORY_LABELS = {
  'magnifier-down': '🔍 돋보기',
  'medicine':       '💊 복약관리',
  'hospital':       '🏥 병원찾기',
  'sos':            '🆘 긴급SOS',
  'brain-game':     '🧠 두뇌게임',
  'health-record':  '🩺 건강기록',
  'big-news':       '📰 큰글씨뉴스',
  'transit':        '🚌 대중교통',
}

export function categoryLabel(id) {
  return CATEGORY_LABELS[id] || id
}
