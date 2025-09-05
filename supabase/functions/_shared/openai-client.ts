import { OpenAI } from 'https://deno.land/x/openai@v4.20.1/mod.ts';

export function createOpenAIClient(): OpenAI {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  
  return new OpenAI({ apiKey });
}

export async function generateAIResponse(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 500
): Promise<string> {
  const openai = createOpenAIClient();
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}