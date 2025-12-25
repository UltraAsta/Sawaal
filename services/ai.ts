import { Question } from "@/models/quiz";

interface GenerateQuestionsParams {
  documentUri: string;
  documentName: string;
  numberOfQuestions?: number;
}

async function extractTextFromPDF(uri: string): Promise<string> {
  try {
    // Read PDF as base64
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Content = btoa(binary);

    // Use OpenAI's API to extract text from the PDF
    const extractedText = await extractTextFromPDFWithOpenAI(base64Content);
    return extractedText;
  } catch (error) {
    console.error('Error reading PDF:', error);
    throw new Error('Failed to read PDF file. Please try again or use a text file.');
  }
}

async function extractTextFromPDFWithOpenAI(base64Content: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    // Simple approach: Ask GPT-4o to work with the PDF content
    // Note: Since OpenAI's chat API doesn't directly support PDF in messages,
    // we'll try to extract text by decoding the PDF structure ourselves first
    // This is a simplified approach that may not work for all PDFs

    // Attempt basic text extraction from PDF
    const decodedPDF = atob(base64Content);

    // Simple PDF text extraction (works for basic PDFs with text streams)
    // This regex looks for text between BT (Begin Text) and ET (End Text) markers
    const textMatches = decodedPDF.match(/\(([^)]+)\)/g);

    if (textMatches && textMatches.length > 0) {
      // Extract text from parentheses (PDF text objects)
      let extractedText = textMatches
        .map(match => match.slice(1, -1)) // Remove parentheses
        .join(' ')
        .replace(/\\(\d{3})/g, (_match, octal) => String.fromCharCode(parseInt(octal, 8)))
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\([()])/g, '$1');

      // Clean up the extracted text
      extractedText = extractedText
        // Remove control characters and binary data
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove duplicate consecutive lines
        .split('\n')
        .filter((line, idx, arr) => idx === 0 || line.trim() !== arr[idx - 1]?.trim())
        .join('\n')
        .trim();

      // Limit the text to approximately 100,000 characters (~25,000 tokens)
      // This ensures we stay well under the 128k token limit
      const MAX_CHARS = 100000;
      if (extractedText.length > MAX_CHARS) {
        console.warn(`PDF text is very long (${extractedText.length} chars), truncating to ${MAX_CHARS} chars`);
        extractedText = extractedText.substring(0, MAX_CHARS) + '\n\n[Content truncated due to length...]';
      }

      if (extractedText.trim().length > 100) {
        console.log(`Extracted ${extractedText.length} characters from PDF`);
        return extractedText;
      }
    }

    // Fallback: If basic extraction didn't work, inform the user
    throw new Error('Unable to extract text from this PDF. The PDF may be image-based or use complex formatting. Please try converting it to a text file or using a different PDF.');

  } catch (error: any) {
    console.error('Error extracting text from PDF:', error);
    if (error.message && error.message.includes('Unable to extract text')) {
      throw error;
    }
    throw new Error('Failed to extract text from PDF. Please try using a text file or a simpler PDF format.');
  }
}

export async function generateQuestionsFromDocument(
  params: GenerateQuestionsParams
): Promise<Question[]> {
  const { documentUri, documentName, numberOfQuestions = 5 } = params;

  try {
    // Get file extension
    const fileType = documentName.split('.').pop()?.toLowerCase();

    let content = '';

    if (fileType === 'txt') {
      // Read text file directly using fetch
      const response = await fetch(documentUri);
      content = await response.text();
    } else if (fileType === 'pdf') {
      // Extract text from PDF using OpenAI
      content = await extractTextFromPDF(documentUri);
    } else if (fileType === 'docx') {
      throw new Error('DOCX support coming soon. For now, please use .txt or .pdf files');
    } else {
      throw new Error('Unsupported file type. Please use .txt or .pdf files');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('No text content found in the document. Please upload a document with readable text.');
    }

    // Generate questions using OpenAI
    const questions = await generateQuestionsWithOpenAI(content, numberOfQuestions);

    return questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}

async function generateQuestionsWithOpenAI(
  content: string,
  numberOfQuestions: number = 5
): Promise<Question[]> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file');
  }

  // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
  // We need to leave room for the prompt template (~500 tokens) + response (~2000 tokens)
  // Max context: 128k tokens, so we limit content to ~80k tokens (320k chars) to be safe
  const MAX_CONTENT_CHARS = 50000; // ~12,500 tokens, leaving plenty of room
  let truncatedContent = content;

  if (content.length > MAX_CONTENT_CHARS) {
    console.warn(`Content too long (${content.length} chars). Truncating to ${MAX_CONTENT_CHARS} chars.`);
    truncatedContent = content.substring(0, MAX_CONTENT_CHARS) + '\n\n[Content truncated for processing...]';
  }

  console.log(`Generating questions from ${truncatedContent.length} characters of content`);

  const prompt = `Based on the following content, generate exactly ${numberOfQuestions} multiple choice quiz questions.

IMPORTANT INSTRUCTIONS:
- Create ${numberOfQuestions} questions that test understanding of the content
- Each question must have exactly 4 options labeled A, B, C, and D
- Only ONE option should be correct
- Make questions clear and unambiguous
- Vary the difficulty level
- Avoid trick questions

Content to generate questions from:
${truncatedContent}

Return ONLY a valid JSON array in this EXACT format (no markdown, no code blocks, just pure JSON):
[
  {
    "question": "What is the main topic discussed in the text?",
    "options": ["First option", "Second option", "Third option", "Fourth option"],
    "correctAnswer": "a",
    "explanation": "Brief explanation of why this is correct"
  }
]

Remember:
- correctAnswer must be "a", "b", "c", or "d" (lowercase)
- Return ONLY the JSON array, nothing else`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates educational quiz questions. Always respond with valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parse the JSON response
    let parsedQuestions;
    try {
      // Remove any markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      parsedQuestions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', generatedText);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Transform to Question format
    const questions: Question[] = parsedQuestions.map((q: any, index: number) => ({
      id: `temp-${Date.now()}-${index}`,
      quiz_id: '',
      question_text: q.question,
      options: [
        { id: 'a', text: q.options[0] },
        { id: 'b', text: q.options[1] },
        { id: 'c', text: q.options[2] },
        { id: 'd', text: q.options[3] },
      ],
      correct_answer: q.correctAnswer.toLowerCase(),
      order_index: index,
    }));

    return questions;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}
