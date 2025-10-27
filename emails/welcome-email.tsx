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

interface WelcomeEmailProps {
  userName?: string;
  appUrl?: string;
}

export const WelcomeEmail = ({
  userName = 'UPSC Aspirant',
  appUrl = 'http://localhost:3000',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to UPSC Aspirant Platform - Your AI-Powered Study Companion</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to UPSC Aspirant Platform! 🎓</Heading>
          
          <Text style={text}>Hi {userName},</Text>
          
          <Text style={text}>
            We're thrilled to have you join our community of dedicated UPSC aspirants! 
            Your journey to success starts here.
          </Text>

          <Section style={featuresSection}>
            <Heading style={h2}>What You Can Do:</Heading>
            
            <Text style={featureText}>
              <strong>🤖 AI Chatbot:</strong> Get instant answers to your UPSC preparation questions with our Gemini-powered chatbot
            </Text>
            
            <Text style={featureText}>
              <strong>📝 Copy Checking:</strong> Upload your GS and Essay answers for detailed AI evaluation and feedback
            </Text>
            
            <Text style={featureText}>
              <strong>📰 Current Affairs:</strong> Stay updated with personalized news feed tailored to your interests
            </Text>
            
            <Text style={featureText}>
              <strong>💡 Tips & Tricks:</strong> Access subject-specific preparation strategies backed by web research
            </Text>
            
            <Text style={featureText}>
              <strong>📚 Smart Notes:</strong> Create notes from any content with AI assistance
            </Text>
            
            <Text style={featureText}>
              <strong>🎯 Mock Tests:</strong> Practice with timed tests and get instant evaluation
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={`${appUrl}/dashboard`}>
              Get Started Now
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={quickStartSection}>
            <Heading style={h3}>Quick Start Guide:</Heading>
            
            <Text style={stepText}>
              1. <strong>Set Your Preferences:</strong> Visit your profile to customize news categories and notification settings
            </Text>
            
            <Text style={stepText}>
              2. <strong>Try the Chatbot:</strong> Ask any UPSC-related question and get instant AI-powered answers
            </Text>
            
            <Text style={stepText}>
              3. <strong>Upload Your First Answer:</strong> Get detailed feedback on your writing
            </Text>
            
            <Text style={stepText}>
              4. <strong>Explore Current Affairs:</strong> Stay updated with the latest news relevant to UPSC
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Need help? Reply to this email or visit our{' '}
            <Link href={`${appUrl}/help`} style={link}>
              Help Center
            </Link>
          </Text>
          
          <Text style={footer}>
            Happy Learning! 🚀
            <br />
            The UPSC Aspirant Platform Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
  padding: '0 40px',
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
  padding: '0 40px',
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '10px 0',
};

const featuresSection = {
  margin: '30px 0',
};

const featureText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  padding: '0 40px',
  margin: '12px 0',
};

const quickStartSection = {
  margin: '30px 0',
};

const stepText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  padding: '0 40px',
  margin: '10px 0',
};

const buttonSection = {
  padding: '27px 40px',
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

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};
