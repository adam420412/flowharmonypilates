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
  position?: number
  bookingsUrl?: string
}

function formatDate(iso?: string) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) } catch { return iso }
}

const WaitlistAdded = ({ name, className = 'zajęcia', classColor = '#c2725a', instructorName, startsAt, position, bookingsUrl = 'https://flowharmony.pl/moje-rezerwacje' }: Props) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Lista rezerwowa – {className}</Preview>
    <Body style={s.main}>
      <Container style={s.container}>
        <Heading style={s.h1}>{name ? `${name}, jesteś na liście rezerwowej` : 'Jesteś na liście rezerwowej'}</Heading>
        <Text style={s.text}>Na tych zajęciach nie ma już wolnych miejsc, ale dopisaliśmy Cię do listy rezerwowej{position ? ` na pozycji #${position}` : ''}. Gdy ktoś odwoła rezerwację, automatycznie damy Ci znać.</Text>
        <div style={s.card}>
          <span style={{ ...s.label, backgroundColor: classColor }}>{className}</span>
          <Heading style={{ ...s.h2, margin: '12px 0 8px' }}>{formatDate(startsAt)}</Heading>
          {instructorName ? <Text style={s.small}>Prowadzi: <strong>{instructorName}</strong></Text> : null}
        </div>
        <Button style={s.button} href={bookingsUrl}>Moje rezerwacje</Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistAdded,
  subject: (d: Record<string, any>) => `Lista rezerwowa – ${d?.className ?? 'zajęcia'}`,
  displayName: 'Lista rezerwowa – dopisanie',
  previewData: { name: 'Anna', className: 'Pilates Mat', classColor: '#c2725a', instructorName: 'Joanna', startsAt: new Date(Date.now() + 86400000).toISOString(), position: 2 },
} satisfies TemplateEntry
