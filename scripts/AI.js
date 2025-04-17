// ai-helper.js
import OpenAI from "openai";

const aiAssistant = {
  api: null,
  
  init(apiKey) {
    this.api = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: apiKey
    });
  },
  
  async getExplanation(formula) {
    if (!this.api) throw new Error("API not initialized");
    
    const prompt = `Explain this logical circuit formula: ${formula}. 
                  Describe the components and how they work together.`;
    
    const response = await this.api.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are an expert in logical circuits." },
        { role: "user", content: prompt }
      ]
    });
    
    return response.choices[0].message.content;
  }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Ключ лучше получать из безопасного источника
  aiAssistant.init("your-deepseek-api-key"); 
  
  // Пример использования с вашей схемой
  document.getElementById('explainBtn').addEventListener('click', async () => {
    const formula = document.getElementById('logicExpr').value;
    const explanation = await aiAssistant.getExplanation(formula);
    document.getElementById('explanation').textContent = explanation;
  });
});