/**
 * برای جلوگیری از هنگ مرورگر، هر data-url طولانی (base64 عکس‌ها) را با
 * یک نشانگر کوتاه جایگزین می‌کند. این فقط برای «نمایش» است؛ داده‌ی واقعی
 * (که با دکمه دانلود می‌گیرید) دست‌نخورده باقی می‌ماند.
 */
export function summarizeForPreview(value: string | null, maxLen = 400): string {
  if (!value) return ''
  const collapsed = value.replace(
    /data:[^"']+;base64,[A-Za-z0-9+/=]+/g,
    (match) => `data:...(${match.length.toLocaleString('fa-IR')} کاراکتر، برای دیدن کامل از دکمه دانلود استفاده کنید)`,
  )
  return collapsed.length > maxLen ? collapsed.slice(0, maxLen) + ' …' : collapsed
}