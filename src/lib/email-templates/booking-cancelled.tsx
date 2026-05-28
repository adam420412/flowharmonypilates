import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import * as s from './_styles'

interface Props {
  name?: string
  className?: string
  startsAt?: string
}

function formatDate(iso?: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) } catch { return iso }
}

const BookingCancelled = ({ name, className = 'zajęcia', startsAt }: Props) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Rezerwacja odwołana – {className}</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <Heading style={s.h1}>Rezerwacja odwołana</Heading>
        <Text style={s.text}>{name ? `${name}, p` : 'P'}otwierdzamy odwołanie rezerwacji na {className} – {formatDate(startsAt)}.</Text>
        <Text style={s.text}>Do zobaczenia na kolejnych zajęciach 🌿</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingCancelled,
  subject: (d: Record<string, any>) => `Rezerwacja odwołana – ${d?.className ?? 'zajęcia'}`,
  displayName: 'Odwołanie rezerwacji',
  previewData: { name: 'Anna', className: 'Pilates Mat', startsAt: new Date(Date.now() + 86400000).toISOString() },
} satisfies TemplateEntry
