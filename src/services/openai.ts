// OpenAI Integration Service for Memo Generation
import OpenAI from 'openai';

// Token counting utility (more conservative estimation)
function estimateTokens(text: string): number {
  // More conservative estimation: 1 token ≈ 3 characters for English text
  // This ensures we stay well under limits
  return Math.ceil(text.length / 3);
}

// Smart content truncation based on token limits
function truncateToTokenLimit(content: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(content);
  
  if (estimatedTokens <= maxTokens) {
    return content;
  }
  
  // Calculate character limit based on token limit (more conservative)
  const charLimit = Math.floor(maxTokens * 3);
  const truncated = content.substring(0, charLimit);
  
  // Try to end at a sentence boundary
  const lastSentence = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const breakPoint = Math.max(lastSentence, lastNewline);
  
  if (breakPoint > charLimit * 0.7) {
    return truncated.substring(0, breakPoint + 1) + '...';
  }
  
  return truncated + '...';
}

// Check if API key is available
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
  console.error('VITE_OPENAI_API_KEY is not set. Please add it to your .env.local file.');
}

// Request throttling to prevent rate limits
class RequestThrottler {
  private lastRequestTime = 0;
  private readonly minInterval = 1000; // Minimum 1 second between requests

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      console.log(`Throttling request for ${waitTime}ms to avoid rate limits...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}

const throttler = new RequestThrottler();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey, // Vite environment variable
  dangerouslyAllowBrowser: true, // Only for client-side usage
});

export interface MemoData {
  companyName: string;
  country: string;
  documents: {
    name: string;
    type: 'profile' | 'financial';
    content: string; // Extracted text content
  }[];
}

export interface GeneratedMemo {
  executiveSummary: string;
  companyOverview: string;
  financialAnalysis: string;
  riskAssessment: string;
  investmentRecommendation: string;
  keyMetrics: {
    revenue?: string;
    growth?: string;
    profitability?: string;
    marketSize?: string;
  };
}

/**
 * Generates an investment memo using OpenAI GPT models with rate limit handling
 * @param memoData - Company and document data
 * @returns Generated memo sections
 */
export async function generateInvestmentMemo(memoData: MemoData): Promise<GeneratedMemo> {
  try {
    // Check if API key is available
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.');
    }

    // Prepare the optimized prompt for memo generation
    const prompt = await createOptimizedMemoPrompt(memoData);
    
    const completion = await makeAPICallWithRetry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using cost-effective model
        messages: [
          {
            role: "system",
            content: `Generate investment memo JSON: executiveSummary, companyOverview, financialAnalysis, riskAssessment, investmentRecommendation, keyMetrics. Max 150 words per section.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, professional output
        max_tokens: 1500, // Reduced for ultra-conservative approach
        response_format: { type: "json_object" }
      });
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response) as GeneratedMemo;
  } catch (error) {
    console.error('Error generating memo:', error);
    throw new Error('Failed to generate investment memo');
  }
}

/**
 * Creates an optimized prompt for memo generation with ultra-strict 6K token limits
 */
async function createOptimizedMemoPrompt(memoData: MemoData): Promise<string> {
  const { companyName, country, documents } = memoData;
  
  // Ultra-conservative token allocation
  const SYSTEM_TOKENS = 100;
  const RESPONSE_TOKENS = 1500; // Reduced response tokens
  const PROMPT_STRUCTURE_TOKENS = 100; // Minimal instructions
  const AVAILABLE_TOKENS = 6000; // Much more conservative limit
  
  let prompt = `Memo: ${companyName} (${country})\n\n`;
  
  // Add document information with ultra-strict token limits
  if (documents.length > 0) {
    // Calculate tokens per document (much more conservative)
    const tokensPerDoc = Math.floor(AVAILABLE_TOKENS / documents.length) - 100; // Reserve 100 tokens per doc for structure
    
    for (const doc of documents) {
      prompt += `${doc.name}:\n`;
      
      // Truncate each document to very small token limit
      const truncatedContent = truncateToTokenLimit(doc.content, Math.max(tokensPerDoc, 500)); // Minimum 500 tokens per doc
      prompt += `${truncatedContent}\n\n`;
    }
  }
  
  // Minimal instructions
  prompt += `JSON: executiveSummary, companyOverview, financialAnalysis, riskAssessment, investmentRecommendation, keyMetrics. Max 150 words per section.`;
  
  // Final token check with aggressive truncation
  const finalTokens = estimateTokens(prompt);
  if (finalTokens > AVAILABLE_TOKENS) {
    console.warn(`Prompt tokens (${finalTokens}) exceed limit (${AVAILABLE_TOKENS}), aggressively truncating...`);
    prompt = truncateToTokenLimit(prompt, AVAILABLE_TOKENS - 200); // Leave buffer
  }
  
  console.log(`Final prompt tokens: ${estimateTokens(prompt)}`);
  return prompt;
}

/**
 * Makes API calls with enhanced retry logic for rate limit handling
 */
async function makeAPICallWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Throttle requests to prevent rate limits
      await throttler.throttle();
      
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Enhanced rate limit detection
      const isRateLimit = error.status === 429 || 
                        error.message?.toLowerCase().includes('rate limit') ||
                        error.message?.toLowerCase().includes('too many requests') ||
                        error.message?.toLowerCase().includes('quota exceeded');
      
      if (isRateLimit) {
        if (attempt < maxRetries) {
          // Enhanced exponential backoff with jitter
          const exponentialDelay = baseDelay * Math.pow(2, attempt);
          const jitter = Math.random() * 2000; // Add up to 2 seconds of jitter
          const delay = exponentialDelay + jitter;
          
          console.log(`Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);
          
          // Add a small delay before retry to be more respectful
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          console.error('Max retries exceeded for rate limit');
          throw new Error('Rate limit exceeded. Please try again later or upgrade your OpenAI plan.');
        }
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Generates presentation slides based on the memo
 * @param memo - Generated memo data
 * @returns Slide content for presentation
 */
export async function generatePresentationSlides(memo: GeneratedMemo): Promise<{
  title: string;
  slides: {
    title: string;
    content: string;
    type: 'overview' | 'financial' | 'risk' | 'recommendation';
  }[];
}> {
  try {
    // Check if API key is available
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.');
    }

    // Create optimized memo summary for slides
    const memoSummary = createMemoSummaryForSlides(memo);
    
    const completion = await makeAPICallWithRetry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Use cheaper model for slides
        messages: [
          {
            role: "system",
            content: "You are a presentation expert. Create concise, professional slides for investment presentations. Keep each slide content under 100 words."
          },
          {
            role: "user",
            content: `Create 4-6 presentation slides based on this investment memo summary:\n\n${memoSummary}\n\nFormat as JSON with title and slides array.`
          }
        ],
        temperature: 0.4,
        max_tokens: 2000, // Reduced for slides
        response_format: { type: "json_object" }
      });
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response);
  } catch (error) {
    console.error('Error generating slides:', error);
    throw new Error('Failed to generate presentation slides');
  }
}

/**
 * Creates a concise summary of the memo for slide generation
 */
function createMemoSummaryForSlides(memo: GeneratedMemo): string {
  return `
Executive Summary: ${memo.executiveSummary}
Company Overview: ${memo.companyOverview}
Financial Analysis: ${memo.financialAnalysis}
Risk Assessment: ${memo.riskAssessment}
Investment Recommendation: ${memo.investmentRecommendation}
Key Metrics: ${JSON.stringify(memo.keyMetrics)}
  `.trim();
}

/**
 * Extracts and optimizes text content from uploaded documents
 * Implements chunking and summarization to stay within token limits
 */
export async function extractDocumentContent(file: File): Promise<string> {
  try {
    const content = await readFileContent(file);
    const optimizedContent = await optimizeContentForAPI(content, file.name);
    return optimizedContent;
  } catch (error) {
    console.error('Error extracting document content:', error);
    return `Error processing ${file.name}. Please ensure the file is readable.`;
  }
}

/**
 * Reads file content based on file type
 */
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        let content = reader.result as string;
        
        // Basic content extraction based on file type with token limits
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          resolve(content);
        } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content);
          const jsonString = JSON.stringify(jsonData, null, 2);
          // Limit JSON content to prevent token overflow
          resolve(truncateToTokenLimit(jsonString, 800));
        } else if (file.name.endsWith('.csv')) {
          // For CSV files, extract first few rows with very strict token limit
          const lines = content.split('\n');
          let csvContent = '';
          let tokenCount = 0;
          
          for (const line of lines) {
            const lineTokens = estimateTokens(line);
            if (tokenCount + lineTokens > 500) break; // Much stricter limit
            csvContent += line + '\n';
            tokenCount += lineTokens;
          }
          
          resolve(csvContent.trim());
        } else {
          // For other file types, return filename and basic info
          resolve(`File: ${file.name}\nType: ${file.type}\nSize: ${file.size} bytes\n\nContent extraction not implemented for this file type.`);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Optimizes content to stay within ultra-strict 6K token limits
 * Uses very conservative token-based calculations
 */
async function optimizeContentForAPI(content: string, filename: string): Promise<string> {
  const MAX_TOKENS_PER_DOCUMENT = 600; // Much more conservative limit
  const estimatedTokens = estimateTokens(content);
  
  // If content is within limits, return as is
  if (estimatedTokens <= MAX_TOKENS_PER_DOCUMENT) {
    return content;
  }
  
  // For large documents, use smart truncation
  const truncatedContent = truncateToTokenLimit(content, MAX_TOKENS_PER_DOCUMENT);
  
  // Only create AI summary if content is extremely large (>2000 tokens)
  if (estimatedTokens > 2000) {
    try {
      const summary = await createDocumentSummary(content, filename);
      return summary;
    } catch (error) {
      console.warn('Summary generation failed, using truncated content:', error);
      return `[${filename} - Truncated]\n${truncatedContent}\n\n[Content truncated to stay within 6K token limit]`;
    }
  }
  
  return `[${filename} - Truncated]\n${truncatedContent}\n\n[Content truncated to stay within 6K token limit]`;
}

/**
 * Creates a summary of large documents using OpenAI with 8K token limits
 */
async function createDocumentSummary(content: string, filename: string): Promise<string> {
  try {
    if (!apiKey) {
      // If no API key, return truncated content
      return `[${filename}] ${truncateToTokenLimit(content, 1000)}\n\n[Content truncated - full document too large for processing]`;
    }

    // Use token-based chunking for summarization
    const SUMMARY_TOKENS = 2000; // Reserve tokens for summary
    const SYSTEM_TOKENS = 100;
    const AVAILABLE_TOKENS = 8192 - SUMMARY_TOKENS - SYSTEM_TOKENS;
    
    const chunks = chunkText(content, Math.floor(AVAILABLE_TOKENS * 3.5)); // Convert tokens to characters
    const firstChunk = chunks[0];
    
    const completion = await makeAPICallWithRetry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Use cheaper model for summarization
        messages: [
          {
            role: "system",
            content: `Summarize this document focusing on key business info, financial data, and important details. Keep summary under 800 tokens.`
          },
          {
            role: "user",
            content: `Summarize: ${firstChunk}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });
    });

    const summary = completion.choices[0]?.message?.content || '';
    return `[${filename} - Summary]\n${summary}`;
  } catch (error) {
    console.error('Error creating summary:', error);
    // Fallback to truncated content
    return `[${filename}] ${truncateToTokenLimit(content, 1000)}\n\n[Content truncated - summary generation failed]`;
  }
}

/**
 * Splits text into chunks of specified size
 */
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.substring(start, end));
    start = end;
  }
  
  return chunks;
}
