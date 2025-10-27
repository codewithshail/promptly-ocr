import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AnnouncementEmailProps {
  userName?: string;
  title?: string;
  content?: string;
  ctaText?: string;
  ctaUrl?: string;
  appUrl?: string;
}

export const AnnouncementEmail = ({
  userName = 'UPSC Aspirant',
  title = 'Important Announcement',
  content = '',
  ctaText,
  ctaUrl,
  appUrl = 'http://localhost:3000',
}: AnnouncementEmailProps) => {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={announcementBanner}>
            <Text style={bannerText}>📢 ANNOUNCEMENT</Text>
          </Section>
          
          <Heading style={h1}>{title}</Heading>
          
          <Text style={greeting}>Hi {userName},</Text>
          
          <Section style={contentSection}>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} style={text}>
                {paragraph}
              </Text>
            ))}
          </Section>

          {ctaText && ctaUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={ctaUrl}>
                {ctaText}
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Have questions? Reply to this email or visit our{' '}
            <Link href={`${appUrl}/help`} style={link}>
              Help Center
            </Link>
          </Text>
          
          <Text style={footer}>
            Thank you for being part of our community! 🙏
            <br />
            The UPSC Aspirant Platform Team
          </Text>
          
          <Hr style={hr} />
          
          <Text style={unsubscribeText}>
            Don't want to receive announcements?{' '}
            <Link href={`${appUrl}/profile`} style={link}>
              Update your email preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AnnouncementEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const announcementBanner = {
  backgroundColor: '#3b82f6',
  padding: '12px 40px',
  textAlign: 'center' as const,
};

const bannerText = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  lineHeight: '36px',
};

const greeting = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '20px 0 10px',
};

const contentSection = {
  margin: '20px 0',
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '16px 0',
};

const buttonSection = {
  padding: '30px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '30px 40px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
  margin: '10px 0',
};

const unsubscribeText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '20px',
  padding: '0 40px',
  margin: '10px 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
