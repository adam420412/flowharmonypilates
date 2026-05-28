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
  bookingsUrl?: string
}

function formatDate(iso?: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) } catch { return iso }
}

const WaitlistPromoted = ({ name, className = 'zajęcia', classColor = '#c2725a', instructorName, startsAt, bookingsUrl = 'https://flowharmony.pl/moje-rezerwacje' }: Props) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Masz miejsce na {className}!</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <Heading style={s.h1}>{name ? `Świetna wiadomość, ${name}!` : 'Świetna wiadomość!'}</Heading>
        <Text style={s.text}>Zwolniło się miejsce i Twoja rezerwacja z listy rezerwowej została automatycznie potwierdzona.</Text>
        <div style={s.card}>
          <span style={{ ...s.label, backgroundColor: classColor }}>{className}</span>
          <Heading style={{ ...s.h2, margin: '12px 0 8px' }}>{formatDate(startsAt)}</Heading>
          {instructorName ? <Text style={s.small}>Prowadzi: <strong>{instructorName}</strong></Text> : null}
        </div>
        <Text style={s.text}>Do zobaczenia w Flow & Harmony 🌿</Text>
        <Button style={s.button} href={bookingsUrl}>Moje rezerwacje</Button>
        <Text style={s.footer}>Jeśli nie możesz przyjść — odwołaj rezerwację w panelu, by zwolnić miejsce kolejnej osobie.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistPromoted,
  subject: (d: Record<string, any>) => `Masz miejsce na ${d?.className ?? 'zajęcia'}!`,
  displayName: 'Lista rezerwowa – potwierdzenie',
  previewData: { name: 'Anna', className: 'Pilates Mat', classColor: '#c2725a', instructorName: 'Joanna', startsAt: new Date(Date.now() + 86400000).toISOString() },
} satisfies TemplateEntry
