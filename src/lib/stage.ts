import type { Allow, Stage } from '../types'

export const STAGE_LABEL: Record<Stage, string> = {
  none: 'No restrictions',
  stage1: 'Stage 1',
  stage2: 'Stage 2',
  full_ban: 'Full ban',
  unknown: 'Unverified',
}

export const STAGE_SHORT: Record<Stage, string> = {
  none: 'Fires OK',
  stage1: 'Rings only',
  stage2: 'No fires',
  full_ban: 'No fires',
  unknown: '?',
}

export const STAGE_COLOR: Record<Stage, string> = {
  none: '#4CAF50',
  stage1: '#E0A100',
  stage2: '#E4572E',
  full_ban: '#B7360D',
  unknown: '#8A8F8B',
}

export const STAGE_EXPLAINER: Record<Stage, string> = {
  none: 'Campfires allowed with a California Campfire Permit (free) outside developed sites.',
  stage1: 'Wood and charcoal fires only in agency-built rings at developed campgrounds. Dispersed/backcountry fires prohibited. Gas stoves OK with a permit.',
  stage2: 'No wood or charcoal fires anywhere, including campground rings. Gas/propane stoves with an on-off valve usually still OK with a permit.',
  full_ban: 'All open flame prohibited, often including stoves. Check the order.',
  unknown: 'No verified current order found. Call the ranger district before you go.',
}

export const ALLOW_LABEL: Record<Allow, string> = {
  allowed: 'Allowed',
  allowed_with_permit: 'With permit',
  prohibited: 'Prohibited',
  unknown: 'Unknown',
}

export const ALLOW_COLOR: Record<Allow, string> = {
  allowed: '#4CAF50',
  allowed_with_permit: '#E0A100',
  prohibited: '#E4572E',
  unknown: '#8A8F8B',
}
