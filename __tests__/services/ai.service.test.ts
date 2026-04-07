import { AIService } from '@/services/ai.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the Google Generative AI module
jest.mock('@google/generative-ai');

describe('AIService', () => {
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    // Reset environments and mocks
    process.env.GEMINI_API_KEY = 'test_key';
    process.env.DEFAULT_AI_PERSONA = 'testing persona';
    
    mockGenerateContent = jest.fn();

    // Mock implementation of getGenerativeModel
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a new email properly parsing JSON', async () => {
    const mockJsonOutput = JSON.stringify({
      subject: 'Test Subject',
      content: 'This is a test email body.',
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => mockJsonOutput,
      },
    });

    const result = await AIService.generateNewEmail('Hello world', 'friendly');

    expect(result).toHaveProperty('subject', 'Test Subject');
    expect(result).toHaveProperty('content', 'This is a test email body.');
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('should generate a reply successfully', async () => {
    const mockJsonOutput = JSON.stringify({
      subject: 'Re: Test',
      content: 'Here is my reply.',
    });

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => `\`\`\`json\n${mockJsonOutput}\n\`\`\``, // simulating markdown wrap
      },
    });

    const history = [{ role: 'user', content: 'What is your name?' }];
    const result = await AIService.generateReply(history, 'Answer the question', 'professional');

    expect(result).toHaveProperty('subject', 'Re: Test');
    expect(result).toHaveProperty('content', 'Here is my reply.');
  });
});
