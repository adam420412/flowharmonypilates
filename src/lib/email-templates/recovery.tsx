import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Resetowanie hasła w {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Resetowanie hasła</Heading>
        <Text style={text}>
          Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w {siteName}.
          Kliknij przycisk poniżej, aby ustawić nowe hasło.
        </Text>
        <Button style={button} href={confirmationUrl}>Ustaw nowe hasło</Button>
        <Text style={footer}>
          Jeśli to nie Ty prosiłaś o reset hasła, zignoruj tę wiadomość — Twoje hasło pozostanie bez zmian.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'normal' as const, color: '#3a2a20', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55473d', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const button = { backgroundColor: '#c2725a', color: '#ffffff', fontSize: '14px', borderRadius: '6px', padding: '12px 22px', textDecoration: 'none', fontFamily: 'Arial, sans-serif' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0', fontFamily: 'Arial, sans-serif' }
