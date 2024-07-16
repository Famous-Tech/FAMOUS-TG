const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config = require('./config');
const openai = require('openai');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const FormData = require('form-data');
const morseCodeMap = require('./morseCodeMap');

const bot = new TelegramBot(config.telegramBotToken, { polling: true });
const openaiClient = new openai.OpenAIApi(new openai.Configuration({ apiKey: config.apiKeyOpenAI }));

const commands = {
  '.start': 'Démarre le bot',
  '.help': 'Affiche la liste des commandes',
  '.gpt': 'Utilise l\'API GPT pour générer du texte',
  '.list': 'Affiche une liste des utilisateurs du groupe',
  '.alive': 'Vérifie si le bot est en ligne',
  '.ping': 'Vérifie la latence du bot',
  '.repo': 'Fournit un lien vers le dépôt GitHub du bot',
  '.uptime': 'Affiche le temps écoulé depuis le démarrage du bot',
  '.menu': 'Affiche la liste des commandes disponibles',
  '.img': 'Recherche une image en utilisant Pixabay',
  '.song': 'Envoie l\'audio de la musique demandée',
  '.url': 'Génère un URL à partir de la vidéo, de la photo ou de l\'audio',
  '.morse': 'Traduit un texte en code Morse ou vice versa',
  '.dev': 'Affiche les informations sur le développeur',
  '.antilink': 'Gère les liens non autorisés dans le groupe',
  '.warn': 'Avertit un utilisateur',
  '.kick': 'Expulse un utilisateur du groupe'
};

let startTime = Date.now();

bot.onText(/\.(start|help|gpt|list|alive|ping|repo|uptime|menu|img|song|url|morse|dev|antilink|warn|kick)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1];

  switch (command) {
    case 'start':
      bot.sendMessage(chatId, 'Bienvenue sur le bot Telegram!');
      break;
    case 'help':
      const helpMessage = Object.entries(commands).map(([cmd, desc]) => `${cmd}: ${desc}`).join('\n');
      bot.sendMessage(chatId, helpMessage);
      break;
    case 'gpt':
      bot.sendMessage(chatId, 'Veuillez entrer votre question pour GPT:');
      bot.once('message', async (msg) => {
        const response = await openaiClient.createCompletion({
          model: 'text-davinci-002',
          prompt: msg.text,
          max_tokens: 150,
        });
        bot.sendMessage(chatId, response.data.choices[0].text);
      });
      break;
    case 'list':
      bot.getChatAdministrators(chatId).then(admins => {
        const adminList = admins.map(admin => admin.user.username || admin.user.first_name).join('\n');
        bot.sendMessage(chatId, `Liste des administrateurs:\n${adminList}`);
      });
      break;
    case 'alive':
      bot.sendMessage(chatId, 'Je suis en ligne et prêt à aider!');
      break;
    case 'ping':
      const pingTime = Date.now() - msg.date * 1000;
      bot.sendMessage(chatId, `Pong! Latence: ${pingTime} ms`);
      break;
    case 'repo':
      bot.sendMessage(chatId, `Voici le lien vers le dépôt GitHub du bot: ${config.gitRepoUrl}`);
      break;
    case 'uptime':
      const uptime = Date.now() - startTime;
      const uptimeStr = `${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`;
      bot.sendMessage(chatId, `Uptime: ${uptimeStr}`);
      break;
    case 'menu':
      const menuMessage = Object.entries(commands).map(([cmd, desc]) => `${cmd}: ${desc}`).join('\n');
      bot.sendMessage(chatId, `Voici la liste des commandes disponibles:\n${menuMessage}`);
      break;
    case 'img':
      const imgQuery = msg.text.split(' ').slice(1).join(' ');
      if (!imgQuery) {
        bot.sendMessage(chatId, 'Veuillez spécifier une recherche pour les images.');
        return;
      }
      try {
        const { data } = await axios.get(`https://pixabay.com/api/?key=${config.pixabayApiKey}&per_page=5&q=${encodeURIComponent(imgQuery)}`);
        if (data.hits.length === 0) {
          bot.sendMessage(chatId, 'Aucune image trouvée pour cette recherche.');
        } else {
          data.hits.forEach(image => {
            bot.sendPhoto(chatId, image.webformatURL);
          });
        }
      } catch (error) {
        bot.sendMessage(chatId, 'Une erreur est survenue lors de la recherche des images.');
      }
      break;
    case 'song':
      const songQuery = msg.text.split(' ').slice(1).join(' ');
      if (!songQuery) {
        bot.sendMessage(chatId, 'Veuillez spécifier une recherche pour les chansons.');
        return;
      }
      try {
        const searchResults = await yts(songQuery);
        if (!searchResults.videos.length) {
          bot.sendMessage(chatId, 'Aucune chanson trouvée pour cette recherche.');
          return;
        }
        const video = searchResults.videos[0];
        const audioStream = ytdl(video.url, { filter: 'audioonly' });
        bot.sendAudio(chatId, audioStream, {}, { filename: `${video.title}.mp3` });
      } catch (error) {
        bot.sendMessage(chatId, 'Une erreur est survenue lors de la recherche de la chanson.');
      }
      break;
    case 'url':
      const fileId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : (msg.video ? msg.video.file_id : msg.audio.file_id);
      if (!fileId) {
        bot.sendMessage(chatId, 'Veuillez envoyer une photo, une vidéo ou un audio.');
        return;
      }
      try {
        const fileLink = await bot.getFileLink(fileId);
        const form = new FormData();
        form.append('file', await axios.get(fileLink, { responseType: 'stream' }));
        const response = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders() });
        const url = `https://telegra.ph${response.data[0].src}`;
        bot.sendMessage(chatId, `Voici l'URL du fichier: ${url}`);
      } catch (error) {
        bot.sendMessage(chatId, 'Une erreur est survenue lors de la génération de l\'URL.');
      }
      break;
    case 'morse':
      const morseQuery = msg.text.split(' ').slice(1).join(' ');
      if (!morseQuery) {
        bot.sendMessage(chatId, 'Veuillez spécifier un texte ou un code Morse.');
        return;
      }
      const isMorse = /[.-]/.test(morseQuery);
      const translated = isMorse ? morseCodeMap.morseToText(morseQuery) : morseCodeMap.textToMorse(morseQuery);
      bot.sendMessage(chatId, `Traduction: ${translated}`);
      break;
    case 'dev':
      bot.sendMessage(chatId, `J'ai été créé par FAMOUS-TECH. Contactez-le sur WhatsApp au numéro ${config.ownerWhatsAppNumber}.`);
      break;
    case 'antilink':
      const antiLinkAction = msg.text.split(' ')[1];
      const userId = msg.text.split(' ')[2];
      if (!antiLinkAction || !userId) {
        bot.sendMessage(chatId, 'Veuillez spécifier une action (delete, warn, kick) et un ID utilisateur.');
        return;
      }
      switch (antiLinkAction) {
        case 'delete':
          bot.deleteMessage(chatId, userId);
          bot.sendMessage(chatId, 'Message supprimé.');
          break;
        case 'warn':
          bot.sendMessage(chatId, `Utilisateur averti: ${userId}`);
          break;
        case 'kick':
          bot.kickChatMember(chatId, userId);
          bot.sendMessage(chatId, `Utilisateur expulsé: ${userId}`);
          break;
        default:
          bot.sendMessage(chatId, 'Action non reconnue. Utilisez delete, warn ou kick.');
      }
      break;
    case 'warn':
      const warnUserId = msg.text.split(' ')[1];
      if (!warnUserId) {
        bot.sendMessage(chatId, 'Veuillez spécifier un ID utilisateur.');
        return;
      }
      bot.sendMessage(chatId, `Utilisateur averti: ${warnUserId}`);
      break;
    case 'kick':
      const kickUserId = msg.text.split(' ')[1];
      if (!kickUserId) {
        bot.sendMessage(chatId, 'Veuillez spécifier un ID utilisateur.');
        return;
      }
      bot.kickChatMember(chatId, kickUserId);
      bot.sendMessage(chatId, `Utilisateur expulsé: ${kickUserId}`);
      break;
  }
});

bot.on('message', (msg) => {
  if (msg.text.startsWith(config.prefix)) {
    const command = msg.text.split(' ')[0].slice(1);
    if (commands[command]) {
      bot.sendMessage(msg.chat.id, `Commande ${command} reçue!`);
    }
  }
});
