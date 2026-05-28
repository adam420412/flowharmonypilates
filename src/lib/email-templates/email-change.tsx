import * as React from 'react'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from '@react-email/components'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Potwierdź zmianę adresu e-mail w {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Potwierdź zmianę adresu e-mail</Heading>
        <Text style={text}>
          Otrzymaliśmy prośbę o zmianę adresu e-mail w {siteName} z{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link> na{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>Kliknij przycisk poniżej, aby potwierdzić zmianę:</Text>
        <Button style={button} href={confirmationUrl}>Potwierdź zmianę</Button>
        <Text style={footer}>
          Jeśli to nie Ty prosiłaś o tę zmianę, jak najszybciej zabezpiecz swoje konto.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'normal' as const, color: '#3a2a20', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55473d', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const link = { color: '#c2725a', textDecoration: 'underline' }
const button = { backgroundColor: '#c2725a', color: '#ffffff', fontSize: '14px', borderRadius: '6px', padding: '12px 22px', textDecoration: 'none', fontFamily: 'Arial, sans-serif' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0', fontFamily: 'Arial, sans-serif' }
