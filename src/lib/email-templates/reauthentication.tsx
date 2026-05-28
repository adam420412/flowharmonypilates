import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pl" dir="ltr">
    <Head />
    <Preview>Twój kod weryfikacyjny</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Kod weryfikacyjny</Heading>
        <Text style={text}>Użyj poniższego kodu, aby potwierdzić swoją tożsamość:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Kod wygasa po krótkim czasie. Jeśli to nie Ty go prosiłaś, zignoruj tę wiadomość.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'normal' as const, color: '#3a2a20', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55473d', lineHeight: '1.6', margin: '0 0 20px', fontFamily: 'Arial, sans-serif' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', letterSpacing: '4px', fontWeight: 'bold' as const, color: '#c2725a', margin: '0 0 30px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0', fontFamily: 'Arial, sans-serif' }
