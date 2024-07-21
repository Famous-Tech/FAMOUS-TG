const axios = require('axios');
const config = require('../config');

const searchImage = async (bot, chatId, query) => {
  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: 36545097-d5df6c20dfd41fe6ace3f8fa0,
        q: query,
        per_page: 50
      }
    });
    if (response.data.hits.length > 0) {
      const imageUrl = response.data.hits[0].largeImageURL;
      bot.sendPhoto(chatId, imageUrl);
    } else {
      bot.sendMessage(chatId, 'Aucune image trouvée.');
    }
  } catch (error) {
    console.error('Erreur lors de la recherche d\'image:', error.message);
    bot.sendMessage(chatId, 'Erreur lors de la recherche d\'image.');
  }
};

module.exports = {
  searchImage
};
