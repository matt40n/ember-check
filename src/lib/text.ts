/** USFS EDW text fields arrive as HTML fragments with entities. Flatten to plain text. */
export function stripHtml(s: string | null | undefined): string | null {
  if (!s) return null
  const t = s
    .replace(/<li>/gi, '• ')
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/ul>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
  // USFS uses '.' as a placeholder for empty fields
  return /[a-z0-9]/i.test(t) ? t : null
}

export type FeeVerdict = { kind: 'free' | 'paid' | 'unknown'; headline: string }

/** Turn a free-text fee description into a quick verdict ("Free", "$15/night", ...). */
export function feeVerdict(fee: string | null): FeeVerdict {
  if (!fee) return { kind: 'unknown', headline: 'Fee not listed' }
  const amounts = [...fee.matchAll(/\$\s?(\d+(?:\.\d{2})?)/g)].map((m) => Number(m[1]))
  const saysFree = /\b(no fee|free|no charge)\b/i.test(fee)
  if (saysFree && amounts.length === 0) return { kind: 'free', headline: 'Free' }
  if (amounts.length > 0) {
    // The site fee is listed first; later amounts are usually extra-vehicle or day-use add-ons.
    const first = amounts[0]
    const perNight = /night|day|site/i.test(fee)
    return { kind: 'paid', headline: `$${first}${perNight ? '/night' : ''}` }
  }
  if (saysFree) return { kind: 'free', headline: 'Free' }
  return { kind: 'unknown', headline: 'See fee details' }
}
