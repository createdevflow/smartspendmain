require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hello'
    });
    console.log('gemini-2.0-flash SUCCESS:', response.text);
  } catch (err) {
    console.error('gemini-2.0-flash ERROR:', err.message);
  }
}

test();
