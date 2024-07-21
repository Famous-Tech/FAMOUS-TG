const axios = require('axios');
const config = require('../config');

const searchImage = async (bot, chatId, query) => {
  try {
    const { data } = await axios.get(`https://pixabay.com/api/?key=36545097-d5df6c20dfd41fe6ace3f8fa0&per_page=50&q=${query}`);
    const imageUrl = data.hits[0].largeImageURL;
    bot.sendPhoto(chatId, imageUrl);
  } catch (error) {
    bot.sendMessage(chatId, 'Erreur lors de la recherche d\'image.');
  }
};

const searchSong = async (bot, chatId, query) => {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        key: config.youtubeApiKey
      }
    });
    const videoUrl = `https://www.youtube.com/watch?v=${response.data.items[0].id.videoId}`;
    bot.sendMessage(chatId, videoUrl);
  } catch (error) {
    bot.sendMessage(chatId, 'Erreur lors de la recherche de chanson.');
  }
};

const searchVideo = async (bot, chatId, query) => {
  try {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        key: config.youtubeApiKey
      }
    });
    const videoUrl = `https://www.youtube.com/watch?v=${response.data.items[0].id.videoId}`;
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
