import { GoogleGenAI } from '@google/genai';
import { VideoItem, VideoNote } from '../types';

export async function generateVideoSummary(
  video: VideoItem,
  notes: VideoNote[] = []
): Promise<string> {
  const apiKey =
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '');

  const notesText = notes.length > 0
    ? notes.map((n) => `- ${n.content}`).join('\n')
    : 'No custom notes added yet.';

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert educational AI tutor. Summarize the YouTube video titled "${video.title}" in category "${video.category}".
Channel: ${video.channelName || 'Educational Channel'}
Difficulty level: ${video.difficulty}
Tags: ${video.tags.join(', ')}

User Notes & Key Highlights:
${notesText}

Please generate a concise, highly readable study summary with markdown formatting:
1. Executive Overview
2. 3-4 Key Concepts & Takeaways
3. Practical Application / Best Practices`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn('Gemini API call error, using local fallback summary generator:', err);
    }
  }

  // Smart fallback summary when API key is not configured
  return `### 📌 Executive Summary: ${video.title}

**Category:** ${video.category} • **Difficulty:** ${video.difficulty} • **Channel:** ${video.channelName}

#### 💡 Core Takeaways:
- **Key Concepts**: Comprehensive coverage of key ${video.category} mechanisms and real-world workflows.
- **Best Practices**: Focuses on clean syntax, state management, and avoiding common execution pitfalls.
- **Practical Application**: Recommended for solidifying concepts through hands-on project building.

${notes.length > 0 ? `#### 📝 Saved Notes Summary:\n${notes.map((n) => `• ${n.content}`).join('\n')}\n\n` : ''}#### 🚀 Recommended Action:
Review key topics covered in this video and experiment directly with sample implementations.`;
}
