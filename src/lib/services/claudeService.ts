import { supabase } from '../supabase'; 
import OpenAI from 'openai';

interface ClaudeResponse {
  content: any;
  confidence: number;
}

interface PlantInfo {
  isPlant: boolean;
  name: string | null;
  scientificName: string | null;
  description: string | null;
  uses: string[] | null;
  edible: boolean;
  medicinal: boolean;
  toxic: boolean;
  isHealthy: boolean;
  healthIssues: string[] | null;
  careInstructions: {
    watering: string;
    sunlight: string;
    soil: string;
    fertilizing: string;
  } | null;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you should use a server-side API
});

async function checkDailyAttempts(): Promise<number> {
  const { data: attempts, error } = await supabase
    .rpc('check_daily_attempts', { user_id: (await supabase.auth.getUser()).data.user?.id });

  if (error) throw error;
  return attempts || 0;
}

async function recordAttempt() {
  const { error } = await supabase
    .from('plant_identification_attempts')
    .insert([{ user_id: (await supabase.auth.getUser()).data.user?.id }]);

  if (error) throw error;
}

export async function identifyPlant(imageBase64: string): Promise<ClaudeResponse> {
  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check daily attempts limit
    const attempts = await checkDailyAttempts();
    if (attempts >= 3) {
      throw new Error('Daily limit reached. You can analyze up to 3 plants per day.');
    }

    // Extract and validate the media type from the base64 string
    const mediaTypeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    if (!mediaTypeMatch) {
      throw new Error('Invalid image format');
    }

    const mediaType = mediaTypeMatch[1];
    if (!mediaType.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(mediaType)) {
      throw new Error('Unsupported image format. Please use JPEG, PNG, or WebP');
    }

    const base64Data = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');

    // Validate base64 data
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Invalid image data');
    }

    // Call OpenAI API with the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this image and determine if it shows a plant. If it does, provide detailed information about it including its health status. Return ONLY a valid JSON object with this exact structure: { \"isPlant\": boolean, \"name\": string | null, \"scientificName\": string | null, \"description\": string | null, \"uses\": string[] | null, \"edible\": boolean, \"medicinal\": boolean, \"toxic\": boolean, \"isHealthy\": boolean, \"healthIssues\": string[] | null, \"careInstructions\": { \"watering\": string, \"sunlight\": string, \"soil\": string, \"fertilizing\": string } | null }. If the image does not show a plant, set isPlant to false and all other fields to null."
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ]
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the JSON response
    let plantInfo;
    try {
      // Extract JSON from the response (in case there's any extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      plantInfo = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing plant information:', parseError);
      throw new Error('Failed to parse plant information from API response');
    }

    // Validate required fields
    const requiredFields = ['isPlant', 'name', 'scientificName', 'description', 'uses', 'edible', 'medicinal', 'toxic', 'isHealthy', 'healthIssues'];
    const missingFields = requiredFields.filter(field => !(field in plantInfo));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Record the attempt only if we successfully processed the image
    await recordAttempt();

    return {
      content: plantInfo,
      confidence: 0.85
    };
  } catch (error: any) {
    console.error('Error identifying plant:', error);
    throw error;
  }
}