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

interface CopyCompleteEmailProps {
  userName?: string;
  copyType?: 'gs' | 'essay';
  score?: number;
  maxScore?: number;
  strengths?: string[];
  improvements?: string[];
  evaluationUrl?: string;
  appUrl?: string;
}

export const CopyCompleteEmail = ({
  userName = 'UPSC Aspirant',
  copyType = 'gs',
  score = 0,
  maxScore = 100,
  strengths = [],
  improvements = [],
  evaluationUrl = '',
  appUrl = 'http://localhost:3000',
}: CopyCompleteEmailProps) => {
  const percentage = Math.round((score / maxScore) * 100);
  const copyTypeName = copyType === 'gs' ? 'General Studies' : 'Essay';
  
  return (
    <Html>
      <Head />
      <Preview>{`Your ${copyTypeName} answer evaluation is ready - ${percentage}%`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Answer Evaluation is Ready! ✅</Heading>
          
          <Text style={text}>Hi {userName},</Text>
          
          <Text style={text}>
            Great news! We've completed the evaluation of your {copyTypeName} answer.
          </Text>

          <Section style={scoreSection}>
            <div style={scoreCard}>
              <Text style={scoreLabel}>Your Score</Text>
              <Text style={scoreValue}>{score}/{maxScore}</Text>
              <Text style={percentageText}>{percentage}%</Text>
            </div>
          </Section>

          {strengths.length > 0 && (
            <Section style={feedbackSection}>
              <Heading style={h2}>✨ Key Strengths</Heading>
              {strengths.map((strength, index) => (
                <Text key={index} style={bulletText}>
                  • {strength}
                </Text>
              ))}
            </Section>
          )}

          {improvements.length > 0 && (
            <Section style={feedbackSection}>
              <Heading style={h2}>🎯 Areas for Improvement</Heading>
              {improvements.map((improvement, index) => (
                <Text key={index} style={bulletText}>
                  • {improvement}
                </Text>
              ))}
            </Section>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={evaluationUrl || `${appUrl}/history`}>
              View Full Evaluation
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={tipsSection}>
            <Heading style={h3}>💡 Next Steps:</Heading>
            
            <Text style={tipText}>
              • Review the detailed feedback and recommendations
            </Text>
            <Text style={tipText}>
              • Check out relevant answer templates for better structure
            </Text>
            <Text style={tipText}>
              • Practice similar questions to improve your score
            </Text>
            <Text style={tipText}>
              • Add weak topics to your revision schedule
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Keep practicing! Every answer brings you closer to your goal. 🚀
          </Text>
          
          <Text style={footer}>
            Best regards,
            <br />
            The UPSC Aspirant Platform Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CopyCompleteEmail;

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
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '25px 0 15px',
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

const scoreSection = {
  padding: '20px 40px',
  textAlign: 'center' as const,
};

const scoreCard = {
  backgroundColor: '#f0f9ff',
  borderRadius: '12px',
  padding: '30px',
  border: '2px solid #3b82f6',
};

const scoreLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 10px 0',
};

const scoreValue = {
  color: '#1f2937',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '10px 0',
  lineHeight: '1',
};

const percentageText = {
  color: '#3b82f6',
  fontSize: '24px',
  fontWeight: '600',
  margin: '10px 0 0 0',
};

const feedbackSection = {
  margin: '30px 0',
};

const bulletText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  padding: '0 40px 0 60px',
  margin: '8px 0',
};

const tipsSection = {
  margin: '30px 0',
};

const tipText = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  padding: '0 40px 0 60px',
  margin: '8px 0',
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
