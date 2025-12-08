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
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          // Remove the data URL prefix to get just the base64 string
          const base64Content = base64data.split(',')[1];

          // Use OpenAI's API to extract text from the PDF
          const extractedText = await extractTextFromPDFWithOpenAI(base64Content);
          resolve(extractedText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsDataURL(blob);
    });
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
    // Use GPT-4o with vision to extract text from PDF
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts text content from documents. Extract all readable text exactly as it appears, maintaining structure and formatting where possible.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract all text content from this PDF document. Return only the extracted text, nothing else.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Content}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error extracting text with OpenAI:', error);
    throw new Error('Failed to extract text from PDF. Please try using a text file instead.');
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

  const prompt = `Based on the following content, generate exactly ${numberOfQuestions} multiple choice quiz questions.

IMPORTANT INSTRUCTIONS:
- Create ${numberOfQuestions} questions that test understanding of the content
- Each question must have exactly 4 options labeled A, B, C, and D
- Only ONE option should be correct
- Make questions clear and unambiguous
- Vary the difficulty level
- Avoid trick questions

Content to generate questions from:
${content}

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
