export const REPO_URL = 'https://github.com/matt40n/ember-check'

/** Pre-filled GitHub issue so a field report arrives with everything needed to act on it. */
export function reportUrl(kind: 'order' | 'site', ctx: { jurisdictionId?: string; name: string; orderNumber?: string; extra?: string }) {
  const title = kind === 'site' ? `Site report: ${ctx.name}` : `Order report: ${ctx.name}`
  const body = [
    `**What I saw** (posted sign, ranger said, agency page…):`,
    '',
    '',
    `**Where**: ${ctx.name}${ctx.jurisdictionId ? ` (\`${ctx.jurisdictionId}\`)` : ''}${ctx.orderNumber ? ` · order ${ctx.orderNumber}` : ''}`,
    ctx.extra ? `**Map said**: ${ctx.extra}` : '',
    `**Date seen**: `,
  ].join('\n')
  const q = new URLSearchParams({ title, body, labels: 'field-report' })
  return `${REPO_URL}/issues/new?${q}`
}
