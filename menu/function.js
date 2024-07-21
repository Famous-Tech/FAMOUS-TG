const config = require('../config');

const start = (bot, chatId) => {
  bot.sendMessage(chatId, 'Bienvenue sur FAMOUS TG que puis-je faire pour vous. Tapez /menu pour voir la liste des commandes.');
};

const help = (bot, chatId, commands) => {
  const helpMessage = commands.map(cmd => `<b>${cmd}</b>`).join('\n');
  bot.sendPhoto(chatId, 'menu/menu.jpg', { caption: helpMessage, parse_mode: 'HTML' });
};

const gpt = (bot, chatId) => {
  bot.sendMessage(chatId, 'Veuillez entrer votre question pour ChatGPT:');
  bot.once('message', async (msg) => {
    const response = await openaiClient.completions.create({
      model: 'text-davinci-002',
      prompt: msg.text,
      max_tokens: 150,
    });
    bot.sendMessage(chatId, response.choices[0].text);
  });
};

const alive = (bot, chatId) => {
  bot.sendMessage(chatId, 'Famous TG en ligne et prêt à vous servir ℹ');
};

const ping = (bot, chatId, msg) => {
  const pingTime = Date.now() - msg.date * 1000;
  bot.sendMessage(chatId, `Pong! Latence: ${pingTime} ms`);
};

const repo = (bot, chatId) => {
  bot.sendMessage(chatId, `Voici le lien vers le dépôt GitHub de FAMOUS-TG V3: ${config.gitRepoUrl}`);
};

const uptime = (bot, chatId, startTime) => {
  const uptime = Date.now() - startTime;
  const uptimeStr = `${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`;
  bot.sendMessage(chatId, `Uptime: ${uptimeStr}`);
};

module.exports = {
  start,
  help,
  gpt,
  alive,
  ping,
  repo,
  uptime
};
