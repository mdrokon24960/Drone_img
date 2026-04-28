import OpenAI from 'openai';

export const analyzeImageWithLLM = async (
  imageBase64: string,
  model: string = 'gpt-4o-mini',
  imageWidth: number = 2048,
  imageHeight: number = 1534
) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert aerial imagery analyst. Analyze the drone image provided and identify all visible land-cover categories and objects. Return ONLY valid JSON.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this drone aerial image. Return ONLY valid JSON (no markdown, no explanation) with the following structure:
            {
              "detections": [
                {
                  "label": "<class name>",
                  "description": "<brief description of what you see>",
                  "confidence": <float 0.0–1.0>,
                  "bbox": [x1, y1, x2, y2] // pixel coordinates in 0-1000 scale
                }
              ],
              "scene_summary": "<overall description of the scene>"
            }
            Identify: buildings, rooftops, trees, vegetation, roads, water bodies, open ground, vehicles, etc.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI');
  
  const parsed = JSON.parse(content);
  
  // Transform normalized 1000-scale bboxes to pixel bboxes
  const detections = parsed.detections.map((d: any) => ({
    ...d,
    bbox: [
      (d.bbox[0] / 1000) * imageWidth,
      (d.bbox[1] / 1000) * imageHeight,
      (d.bbox[2] / 1000) * imageWidth,
      (d.bbox[3] / 1000) * imageHeight,
    ],
    pixel_area: 0, // LLM doesn't give pixel area
    color: '#3b82f6', // Default blue for LLM mode
  }));

  return { ...parsed, detections };
};
