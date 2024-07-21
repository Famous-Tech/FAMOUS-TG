const calc = (bot, chatId, msg) => {
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
};

module.exports = {
  calc
};
