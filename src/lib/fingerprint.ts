/**
 * Fire-text fingerprint of an agency (or news) page — the sentences that mention campfires, stoves, stages or burn
 * permits, plus the order/PDF links in the article. scripts/verify-orders.ts stores the hash per entry and pages a
 * human only when it moves. Pure so it can be tested against saved pages.
 */
/**
 * Drop site chrome before anything else looks for the article. Order matters: YubaNet nests a "More Regional
 * News" <aside> inside the story's <article>, and each headline in it is its own <article>, so a first-match
 * article extraction ends at the first nested </article> and keeps the headline list — which then changes
 * whenever the newsroom publishes anything about fire. Removing asides (and nav/header/footer) from the whole
 * document first leaves one <article> to find.
 */
const stripChrome = (html: string) => html.replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<title[\s\S]*?<\/title>/gi, ' ').replace(/<(nav|aside|header|footer)[^>]*>[\s\S]*?<\/\1>/gi, ' ')

export function fireSentences(raw: string): string[] {
  // Only the article body: site chrome (title, breadcrumb, 'current conditions' sidebar, menus) changes on its own
  const html = stripChrome(raw)
  let body = html
  const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ?? html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ?? html.match(/<div[^>]+id="main-content"[^>]*>([\s\S]*?)<footer/i)
  if (art) body = art[1]
  body = body.replace(/<[^>]+class="[^"]*(breadcrumb|sidebar|related|share|social)[^"]*"[^>]*>[\s\S]*?<\/(div|ul|nav|section)>/gi, ' ')
  const text = body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
  return text
    .split(/(?<=[.!?])\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 40 && !/skip to |breadcrumb|current condition|fire danger:|\bmenu\b|official website|\(u\.s\.$/i.test(t))
    .filter((t) => /campfire|fire restriction|fire ban|open flame|stove|charcoal|wood fire|burn(?:ing)? (?:ban|restriction|permit)|stage [12i]/i.test(t))
}
/** Bump when the fingerprint recipe changes: a stored hash from an older recipe is replaced silently instead of paging a human. */
export const FINGERPRINT_VERSION = 'v6'
export function articleBody(raw: string): string {
  const html = stripChrome(raw)
  const art = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ?? html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  return art ? art[1] : html
}
export function fireTextHash(html: string): string {
  // Prose plus the order/PDF links *in the article*: a swapped order PDF with unchanged prose still changes the
  // hash, but the sidebar's list of other alerts (a new closure elsewhere on the forest) does not.
  // Same link may appear relative and absolute, encoded and not — the CMS alternates; treat those as one link
  const links = [...new Set([...articleBody(html).matchAll(/href="([^"]*(?:\/alerts\/[^"]*|\.pdf))"/gi)].map((m) => decodeURIComponent(m[1]).toLowerCase().replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '')))].sort().join('|')
  const s = (fireSentences(html).join('|') + '|' + links).toLowerCase().replace(/\d{1,2}:\d{2}\s*[ap]m/g, '').replace(/[^a-z0-9|]/g, '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return FINGERPRINT_VERSION + ':' + (h >>> 0).toString(36) + ':' + s.length.toString(36)
}
