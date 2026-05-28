import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Zaproszenie do {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Zaproszenie do {siteName}</Heading>
        <Text style={text}>
          Otrzymałaś zaproszenie do dołączenia do{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Kliknij przycisk poniżej, aby zaakceptować zaproszenie i utworzyć konto.
        </Text>
        <Button style={button} href={confirmationUrl}>Zaakceptuj zaproszenie</Button>
        <Text style={footer}>
          Jeśli to zaproszenie do Ciebie nie należy, zignoruj tę wiadomość.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'normal' as const, color: '#3a2a20', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55473d', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const link = { color: '#c2725a', textDecoration: 'underline' }
const button = { backgroundColor: '#c2725a', color: '#ffffff', fontSize: '14px', borderRadius: '6px', padding: '12px 22px', textDecoration: 'none', fontFamily: 'Arial, sans-serif' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0', fontFamily: 'Arial, sans-serif' }
