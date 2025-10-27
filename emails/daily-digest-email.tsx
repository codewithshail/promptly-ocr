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

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
}

interface DailyDigestEmailProps {
  userName?: string;
  date?: string;
  articles?: NewsArticle[];
  hasPreferences?: boolean;
  appUrl?: string;
}

export const DailyDigestEmail = ({
  userName = 'UPSC Aspirant',
  date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  articles = [],
  hasPreferences = true,
  appUrl = 'http://localhost:3000',
}: DailyDigestEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Daily Current Affairs Digest - {date}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📰 Your Daily Current Affairs</Heading>
          
          <Text style={dateText}>{date}</Text>
          
          <Text style={text}>Good morning, {userName}!</Text>
          
          <Text style={text}>
            {hasPreferences 
              ? "Here are today's top news articles from your preferred categories:"
              : "Here are today's top news articles. Set your preferences to personalize your digest!"}
          </Text>

          {articles.length > 0 ? (
            <Section style={articlesSection}>
              {articles.map((article, index) => (
                <div key={article.id}>
                  <Section style={articleCard}>
                    <div style={categoryBadge}>
                      {article.category.toUpperCase()}
                    </div>
                    
                    <Heading style={articleTitle}>{article.title}</Heading>
                    
                    <Text style={articleSummary}>{article.summary}</Text>
                    
                    <div style={articleMeta}>
                      <Text style={metaText}>
                        {article.source} • {new Date(article.publishedAt).toLocaleDateString()}
                      </Text>
                    </div>
                    
                    <Button 
                      style={readMoreButton} 
                      href={`${appUrl}/current-affairs?article=${article.id}`}
                    >
                      Read Full Article
                    </Button>
                  </Section>
                  
                  {index < articles.length - 1 && <Hr style={articleDivider} />}
                </div>
              ))}
            </Section>
          ) : (
            <Section style={emptySection}>
              <Text style={emptyText}>
                No new articles today. Check back tomorrow for fresh updates!
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          {!hasPreferences && (
            <Section style={preferencesSection}>
              <Heading style={h3}>🎯 Personalize Your Digest</Heading>
              <Text style={text}>
                Set your news preferences to receive articles tailored to your interests.
              </Text>
              <Section style={buttonSection}>
                <Button style={button} href={`${appUrl}/profile`}>
                  Set Preferences
                </Button>
              </Section>
            </Section>
          )}

          <Section style={tipsSection}>
            <Heading style={h3}>💡 Quick Tips:</Heading>
            
            <Text style={tipText}>
              • Create flashcards from important articles for better retention
            </Text>
            <Text style={tipText}>
              • Take the daily quiz to test your current affairs knowledge
            </Text>
            <Text style={tipText}>
              • Bookmark articles you want to revisit later
            </Text>
            <Text style={tipText}>
              • Add key topics to your revision schedule
            </Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={`${appUrl}/current-affairs`}>
              View All News
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Don't want daily digests?{' '}
            <Link href={`${appUrl}/profile`} style={link}>
              Update your email preferences
            </Link>
          </Text>
          
          <Text style={footer}>
            Stay informed, stay ahead! 🚀
            <br />
            The UPSC Aspirant Platform Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default DailyDigestEmail;

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
  margin: '40px 0 10px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
  padding: '0 40px',
};

const dateText = {
  color: '#6b7280',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '0 0 30px 0',
  padding: '0 40px',
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '10px 0',
};

const articlesSection = {
  margin: '30px 0',
};

const articleCard = {
  padding: '20px 40px',
};

const categoryBadge = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  fontSize: '11px',
  fontWeight: '600',
  padding: '4px 12px',
  borderRadius: '12px',
  marginBottom: '12px',
  letterSpacing: '0.5px',
};

const articleTitle = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '12px 0',
  lineHeight: '28px',
};

const articleSummary = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '12px 0',
};

const articleMeta = {
  margin: '12px 0',
};

const metaText = {
  color: '#9ca3af',
  fontSize: '13px',
  margin: '0',
};

const readMoreButton = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '8px 20px',
  marginTop: '12px',
};

const articleDivider = {
  borderColor: '#f3f4f6',
  margin: '20px 40px',
};

const emptySection = {
  padding: '40px',
  textAlign: 'center' as const,
};

const emptyText = {
  color: '#6b7280',
  fontSize: '16px',
  margin: '0',
};

const preferencesSection = {
  backgroundColor: '#fef3c7',
  padding: '20px 40px',
  margin: '20px 0',
  borderRadius: '8px',
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
  padding: '20px 40px',
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
