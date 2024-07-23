require('dotenv').config();

module.exports = {
  prefix: process.env.PREFIX, // Préfixe
  apiKeyOpenAI: process.env.OPENAI_API_KEY, // Clé API OpenAI
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN, // Token du bot Telegram
  pixabayApiKey: process.env.PIXABAY_API_KEY, // Clé API Pixabay
  youtubeApiKey: process.env.YOUTUBE_API_KEY, // Clé API YouTube
  gitRepoUrl: process.env.GIT_REPO_URL, // URL du dépôt GitHub
  ownerWhatsAppNumber: process.env.OWNER_WHATSAPP_NUMBER // Numéro WhatsApp
};
