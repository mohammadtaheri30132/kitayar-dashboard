import { useQuestionStore } from '../store/useQuestionStore'
import type { Difficulty } from '../types/question'

const MetaFieldsPanel = () => {
  const draft = useQuestionStore((s) => s.draft)
  const setField = useQuestionStore((s) => s.setField)

  return (
    <section className="meta-fields-grid">
      <label>
        سختی
        <select value={draft.difficulty} onChange={(e) => setField('difficulty', e.target.value as Difficulty)}>
          <option value="ساده">ساده</option>
          <option value="متوسط">متوسط</option>
          <option value="دشوار">دشوار</option>
        </select>
      </label>

      <label>
        شماره درس
        <input
          type="number"
          min={1}
          value={draft.lesson_id}
          onChange={(e) => setField('lesson_id', e.target.value === '' ? '' : Number(e.target.value))}
        />
      </label>

      <label>
        شماره صفحه
        <input
          type="number"
          min={1}
          value={draft.page_number}
          onChange={(e) => setField('page_number', e.target.value === '' ? '' : Number(e.target.value))}
        />
      </label>

      <label>
        نام فایل تصویر منبع
        <input
          type="text"
          value={draft.source_image}
          placeholder="مثلا: 14030829pi5oq74160-2.jpg"
          onChange={(e) => setField('source_image', e.target.value)}
        />
      </label>
    </section>
  )
}

export default MetaFieldsPanel