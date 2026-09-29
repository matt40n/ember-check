import { describe, expect, test } from 'bun:test'
import { fireSentences } from './fingerprint'

// YubaNet's layout: the story's <article> wraps an <aside> "More Regional News" list whose items are themselves
// <article> elements. A first-match extraction stops at the first nested </article> and keeps the headline list.
const yubanetLike = `<html><head><title>CAL FIRE suspends burn permits</title></head><body><main>
<article class="post">
  <p>AUBURN – The increasing fire danger is prompting CAL FIRE to suspend all burn permits for outdoor residential burning within the State Responsibility Area of Nevada, Yuba, Placer and Sierra Counties.</p>
  <aside><div class="wp-block-newspack-blocks-homepage-articles"><h2 class="article-section-title"><span>More Regional News</span></h2>
    <article data-post-id="1"><h3><a href="/regional/tahoe">Fire restrictions lowered to Stage 1 on Tahoe National Forest, campfires allowed in rings again.</a></h3></article>
    <article data-post-id="2"><h3><a href="/regional/other">Another campfire story that changes every week and is long enough to count.</a></h3></article>
  </div></aside>
</article>
</main></body></html>`

describe('fireSentences', () => {
  test('keeps the story\'s own burn-permit sentence', () => {
    expect(fireSentences(yubanetLike).some((s) => s.startsWith('AUBURN'))).toBe(true)
  })
  test('ignores headlines in a related-news aside nested inside the article', () => {
    const leaked = fireSentences(yubanetLike).filter((s) => /Tahoe National Forest|Another campfire story/.test(s))
    expect(leaked).toEqual([])
  })
})
