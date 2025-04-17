import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1', // Добавлен /v1 к базовому URL
  apiKey: 'your-api-key-here' // Замените на ваш настоящий API-ключ DeepSeek
});

async function getDeepSeekResponse(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, // Контроль случайности ответов
      max_tokens: 1000   // Максимальная длина ответа
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    return "Sorry, I couldn't process your request.";
  }
}

// Пример использования
async function main() {
  const response = await getDeepSeekResponse("Explain quantum computing in simple terms");
  console.log(response);
}

main();