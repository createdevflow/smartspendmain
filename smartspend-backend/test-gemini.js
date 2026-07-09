require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const requestOptions = {
      model: 'gemini-1.5-flash',
      contents: ['Hello'],
      config: {
        systemInstruction: "You are a smart financial AI assistant."
      }
    };
    
    console.log('Calling generateContent...');
    const response = await ai.models.generateContent(requestOptions);
    console.log('SUCCESS:', response.text);
  } catch (err) {
    console.error('ERROR CAUGHT:', err);
  }
}

test();
