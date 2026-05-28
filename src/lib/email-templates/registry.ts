import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

import { template as bookingConfirmation } from './booking-confirmation'
import { template as bookingCancelled } from './booking-cancelled'
import { template as waitlistAdded } from './waitlist-added'
import { template as waitlistPromoted } from './waitlist-promoted'
import { template as reminder24h } from './reminder-24h'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation': bookingConfirmation,
  'booking-cancelled': bookingCancelled,
  'waitlist-added': waitlistAdded,
  'waitlist-promoted': waitlistPromoted,
  'reminder-24h': reminder24h,
}
