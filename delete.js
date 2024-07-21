const bot = require('./bot'); // Assuming you have an instance of the bot in bot.js

bot.onText(/\/delete (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const messageId = parseInt(match[1], 10);

  bot.deleteMessage(chatId, messageId).then(() => {
    bot.sendMessage(chatId, `Message ${messageId} supprimé.`);
  }).catch((error) => {
    bot.sendMessage(chatId, `Erreur lors de la suppression du message ${messageId}.`);
  });
});

module.exports = bot;
