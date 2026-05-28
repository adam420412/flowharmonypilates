import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import * as s from './_styles'

interface Props {
  name?: string
  className?: string
  classColor?: string
  instructorName?: string
  startsAt?: string
  durationMinutes?: number
  bookingsUrl?: string
}

function formatDate(iso?: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

const BookingConfirmation = ({ name, className = 'zajęcia', classColor = '#c2725a', instructorName, startsAt, durationMinutes, bookingsUrl = 'https://flowharmony.pl/moje-rezerwacje' }: Props) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Potwierdzenie rezerwacji – {className}</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <Heading style={s.h1}>{name ? `Dziękujemy, ${name}!` : 'Dziękujemy za rezerwację!'}</Heading>
        <Text style={s.text}>Twoja rezerwacja w Flow & Harmony – Studio Pilatesu została potwierdzona.</Text>
        <div style={s.card}>
          <span style={{ ...s.label, backgroundColor: classColor }}>{className}</span>
          <Heading style={{ ...s.h2, margin: '12px 0 8px' }}>{formatDate(startsAt)}</Heading>
          {instructorName ? <Text style={s.small}>Prowadzi: <strong>{instructorName}</strong></Text> : null}
          {durationMinutes ? <Text style={s.small}>Czas trwania: {durationMinutes} min</Text> : null}
        </div>
        <Text style={s.text}>Do zobaczenia na macie 🌿</Text>
        <Button style={s.button} href={bookingsUrl}>Moje rezerwacje</Button>
        <Text style={s.footer}>
          Pamiętaj, że rezerwację możesz odwołać najpóźniej 12h przed zajęciami w panelu „Moje rezerwacje".
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingConfirmation,
  subject: (d: Record<string, any>) => `Potwierdzenie rezerwacji – ${d?.className ?? 'zajęcia'}`,
  displayName: 'Potwierdzenie rezerwacji',
  previewData: { name: 'Anna', className: 'Pilates Mat', classColor: '#c2725a', instructorName: 'Joanna', startsAt: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 55, bookingsUrl: 'https://flowharmony.pl/moje-rezerwacje' },
} satisfies TemplateEntry
