const axios = require('axios');
const config = require('../config');

const searchImage = async (bot, chatId, query) => {
  try {
    const response = await axios.get(`https://api.example.com/search/image`, {
      params: { query },
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
    const imageUrl = response.data.results[0].url;
    bot.sendPhoto(chatId, imageUrl);
  } catch (error) {
    bot.sendMessage(chatId, 'Erreur lors de la recherche d\'image.');
  }
};

const searchSong = async (bot, chatId, query) => {
  try {
    const response = await axios.get(`https://api.example.com/search/song`, {
      params: { query },
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
    const songUrl = response.data.results[0].url;
    bot.sendMessage(chatId, songUrl);
  } catch (error) {
    bot.sendMessage(chatId, 'Erreur lors de la recherche de chanson.');
  }
};

const searchVideo = async (bot, chatId, query) => {
  try {
    const response = await axios.get(`https://api.example.com/search/video`, {
      params: { query },
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
    const videoUrl = response.data.results[0].url;
    bot.sendMessage(chatId, videoUrl);
  } catch (error) {
    bot.sendMessage(chatId, 'Erreur lors de la recherche de vidéo.');
  }
};

module.exports = {
  searchImage,
  searchSong,
  searchVideo
};
