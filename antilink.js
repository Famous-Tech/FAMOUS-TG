const bot = require('./bot'); // Assuming you have an instance of the bot in bot.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zsofgracbzylzmcikqwu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzb2ZncmFjYnp5bHptY2lrcXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkxODE4NTcsImV4cCI6MjAzNDc1Nzg1N30.yXtV_JKI4W1DY_97FEC4a3sGDGaousy7sN8r16wM3FQ';
const supabase = createClient(supabaseUrl, supabaseKey);

let antiLinkEnabled = false;

bot.onText(/\/antilink (on|off)/, (msg, match) => {
  const chatId = msg.chat.id;
  const action = match[1];

  if (action === 'on') {
    antiLinkEnabled = true;
    bot.sendMessage(chatId, 'Anti-link activé.');
  } else {
    antiLinkEnabled = false;
    bot.sendMessage(chatId, 'Anti-link désactivé.');
  }
});

bot.on('message', async (msg) => {
  if (antiLinkEnabled && msg.text) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isLink = /http[s]?:\/\/\S+/i.test(msg.text);

    if (isLink) {
      await bot.deleteMessage(chatId, msg.message_id);
      bot.sendMessage(chatId, `Lien supprimé. ${msg.from.username} averti.`);
      warnUser(chatId, msg.from.username);
    }
  }
});

async function warnUser(chatId, username) {
  let { data, error } = await supabase
    .from('warnings')
    .select('warnings')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching warnings:', error);
    return;
  }

  const warnings = data ? data.warnings + 1 : 1;

  if (warnings >= 3) {
    bot.kickChatMember(chatId, username);
    bot.sendMessage(chatId, `${username} a été expulsé du groupe.`);
  } else {
    if (data) {
      await supabase
        .from('warnings')
        .update({ warnings })
        .eq('username', username);
    } else {
      await supabase
        .from('warnings')
        .insert({ username, warnings });
    }
    bot.sendMessage(chatId, `${username} a été averti. Total des avertissements: ${warnings}`);
  }
}

module.exports = bot;
