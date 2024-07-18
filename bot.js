const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const config = require('./config');
const OpenAI = require('openai');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const FormData = require('form-data');
const morseCodeMap = require('./morseCodeMap');
const sharp = require('sharp');

const bot = new TelegramBot(config.telegramBotToken, { polling: true });

// Créer un nouveau client OpenAI avec votre clé API
const openaiClient = new OpenAI({
  apiKey: config.apiKeyOpenAI,
});

const commands = {
  [config.prefix + 'start']: 'Démarre le bot',
  [config.prefix + 'help']: 'Affiche la liste des commandes',
  [config.prefix + 'gpt']: 'Utilise l\'API GPT pour générer du texte',
  [config.prefix + 'list']: 'Affiche une liste des utilisateurs du groupe',
  [config.prefix + 'alive']: 'Vérifie si le bot est en ligne',
  [config.prefix + 'ping']: 'Vérifie la latence du bot',
  [config.prefix + 'repo']: 'Fournit un lien vers le dépôt GitHub du bot',
  [config.prefix + 'uptime']: 'Affiche le temps écoulé depuis le démarrage du bot',
  [config.prefix + 'menu']: 'Affiche la liste des commandes disponibles',
  [config.prefix + 'img']: 'Recherche une image en utilisant Pixabay',
  [config.prefix + 'song']: 'Envoie l\'audio de la musique demandée',
  [config.prefix + 'url']: 'Génère un URL à partir de la vidéo, de la photo ou de l\'audio',
  [config.prefix + 'morse']: 'Traduit un texte en code Morse ou vice versa',
  [config.prefix + 'dev']: 'Affiche les informations sur le développeur',
  [config.prefix + 'antilink']: 'Gère les liens non autorisés dans le groupe',
  [config.prefix + 'warn']: 'Avertit un utilisateur',
  [config.prefix + 'kick']: 'Expulse un utilisateur du groupe',
  [config.prefix + 'calc']: 'Effectue un calcul mathématique',
  [config.prefix + 'tagall']: 'Tag tous les membres du groupe',
  [config.prefix + 'convert']: 'Convertit une image en sticker',
  [config.prefix + 'admin']: 'Affiche la liste des administrateurs du groupe'
};

let startTime = Date.now();

bot.onText(new RegExp(`\\${config.prefix}(start|help|gpt|list|alive|ping|repo|uptime|menu|img|song|url|morse|dev|antilink|warn|kick|calc|tagall|convert|admin)`), async (msg, match) => {
  const chatId = msg.chat.id;
  const command = match[1];

  switch (command) {
    case 'start':
      bot.sendMessage(chatId, 'Bienvenue sur FAMOUS TG que puis je faire pour vous. Tapez /menu pour voir la liste des commandes.');
      break;
    case 'help':
      const helpMessage = Object.entries(commands).map(([cmd, desc]) => `${cmd}: ${desc}`).join('\n');
      bot.sendMessage(chatId, helpMessage);
      break;
    case 'gpt':
      bot.sendMessage(chatId, 'Veuillez entrer votre question pour ChatGPT:');
      bot.once('message', async (msg) => {
        const response = await openaiClient.completions.create({
          model: 'text-davinci-002',
          prompt: msg.text,
          max_tokens: 150,
        });
        bot.sendMessage(chatId, response.choices[0].text);
      });
      break;
    case 'list':
      bot.getChatAdministrators(chatId).then(admins => {
        const adminList = admins.map(admin => admin.user.username || admin.user.first_name).join('\n');
        bot.sendMessage(chatId, `Liste des administrateurs:\n${adminList}`);
      });
      break;
    case 'alive':
      bot.sendMessage(chatId, 'Famous TG en ligne et prêt à vous servir ℹ');
      break;
    case 'ping':
      const pingTime = Date.now() - msg.date * 1000;
      bot.sendMessage(chatId, `Pong! Latence: ${pingTime} ms`);
      break;
    case 'repo':
      bot.sendMessage(chatId, `Voici le lien vers le dépôt GitHub de FAMOUS-TG V2: ${config.gitRepoUrl}`);
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
          bot.sendMessage(chatId, 'Aucune chanson trouvée pour cette recherche.🚫');
          return;
        }
        const video = searchResults.videos[0];
        const audioStream = ytdl(video.url, { filter: 'audioonly' });
        bot.sendAudio(chatId, audioStream, {}, { filename: `${video.title}.mp3` });
      } catch (error) {
        bot.sendMessage(chatId, 'Une erreur est survenue lors de la recherche de la chanson.🚫');
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
          bot.sendMessage(chatId, 'Message supprimé.🔰✅');
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
    case 'calc':
      const expression = msg.text.split(' ').slice(1).join(' ');
      if (!expression) {
        bot.sendMessage(chatId, 'Veuillez entrer une expression mathématique.');
        return;
      }
      try {
        const result = eval(expression);
        bot.sendMessage(chatId, `Résultat: ${result}`);
      } catch (error) {
        bot.sendMessage(chatId, 'Expression invalide. Veuillez entrer une expression mathématique valide.');
      }
      break;
    case 'tagall':
      const chatType = msg.chat.type;
      if (chatType !== 'group' && chatType !== 'supergroup') {
        bot.sendMessage(chatId, 'Cette commande ne peut être utilisée que dans un groupe.');
        return;
      }
      try {
        const members = await bot.getChatAdministrators(chatId);
        const memberNames = members.map(member => `@${member.user.username || member.user.first_name}`).join(' ');
        bot.sendMessage(chatId, `Tout le monde: ${memberNames}`);
      } catch (error) {
        bot.sendMessage(chatId, 'Une erreur est survenue lors de la récupération des membres du groupe.');
      }
      break;
    case 'convert':
      if (!msg.photo) {
        bot.sendMessage(chatId, 'Veuillez envoyer une photo à convertir en sticker.');
        return;
      }
      const photoFileId = msg.photo[msg.photo.length - 1].file_id;
      try {
        const fileLink = await bot.getFileLink(photoFileId);
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');
        const stickerBuffer = await sharp(imageBuffer)
          .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer();
        bot.sendSticker(chatId, stickerBuffer);
      } catch (error) {
        bot.sendMessage(chatId, 'Une erreur est survenue lors de la conversion de l\'image en sticker.');
      }
      break;
    case 'admin':
      const admins = await bot.getChatAdministrators(chatId);
      const adminList = admins.map(admin => `@${admin.user.username || admin.user.first_name}`).join('\n');
      bot.sendMessage(chatId, `Liste des administrateurs:\n${adminList}`);
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
