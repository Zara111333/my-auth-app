const axios = require('axios');

async function getSimilarityScore(text1, text2) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/sentence-transformers/paraphrase-MiniLM-L6-v2',
      {
        inputs: {
          source_sentence: text1,
          sentences: [text2]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`
        }
      }
    );

    // Hugging Face returns an array of similarity scores
    return response.data[0]; // Should be between 0 and 1
  } catch (error) {
    console.error('Hugging Face API error:', error.response?.data || error.message);
    return 0;
  }
}
