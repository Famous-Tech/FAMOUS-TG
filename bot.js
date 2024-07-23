const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const dotenv = require('dotenv');
const { start, help, gpt, alive, ping, repo, uptime } = require('./menu/function');
const { calc } = require('./tools/tools');
const { imageSearch, songSearch, videoSearch } = require('./search/search');
const commands = require('./menu/command');
const { createClient } = require('@supabase/supabase-js');

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
let startTime = Date.now();

// Configuration de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

const logCommand = (username, command, query = '') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${username} a utilisé la commande ${command}${query ? ` avec la query: ${query}` : ''}`);
};

bot.onText(new RegExp(`\\${process.env.PREFIX}(start|help|gpt|alive|ping|repo|uptime|calc|img|song|video)`), async (msg, match) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;
  const command = match[1];

  switch (command) {
    case 'start':
      start(bot, chatId);
      logCommand(username, 'start');
      break;
    case 'help':
      help(bot, chatId, commands);
      logCommand(username, 'help');
      break;
    case 'gpt':
      gpt(bot, chatId);
      logCommand(username, 'gpt', msg.text.split(' ').slice(1).join(' '));
      break;
    case 'alive':
      alive(bot, chatId);
      logCommand(username, 'alive');
      break;
    case 'ping':
      ping(bot, chatId, msg);
      logCommand(username, 'ping');
      break;
    case 'repo':
      repo(bot, chatId);
      logCommand(username, 'repo');
      break;
    case 'uptime':
      uptime(bot, chatId, startTime);
      logCommand(username, 'uptime');
      break;
    case 'calc':
      calc(bot, chatId, msg);
      logCommand(username, 'calc', msg.text.split(' ').slice(1).join(' '));
      break;
    case 'img':
      imageSearch(bot, chatId, msg);
      logCommand(username, 'img', msg.text.split(' ').slice(1).join(' '));
      break;
    case 'song':
      songSearch(bot, chatId, msg);
      logCommand(username, 'song', msg.text.split(' ').slice(1).join(' '));
      break;
    case 'video':
      videoSearch(bot, chatId, msg);
      logCommand(username, 'video', msg.text.split(' ').slice(1).join(' '));
      break;
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('FAMOUS TG Bot is running.');
});
app.listen(PORT, () => {
  console.log(`FAMOUS-TG activé sur le port : ${PORT}`);
});

module.exports = { bot, supabase }; // Exporter bot et supabase pour les utiliser dans warn.js
