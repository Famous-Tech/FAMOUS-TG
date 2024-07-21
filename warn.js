const { createClient } = require('@supabase/supabase-js');
const bot = require('./bot'); // Assuming you have an instance of the bot in bot.js

const supabaseUrl = 'https://zsofgracbzylzmcikqwu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzb2ZncmFjYnp5bHptY2lrcXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkxODE4NTcsImV4cCI6MjAzNDc1Nzg1N30.yXtV_JKI4W1DY_97FEC4a3sGDGaousy7sN8r16wM3FQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureTableExists() {
  const { error } = await supabase.rpc('ensure_warnings_table');
  if (error) console.error('Error creating warnings table:', error);
}

async function warnUser(chatId, username) {
  await ensureTableExists();
  
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

bot.onText(/\/warn @(\w+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1];
  warnUser(chatId, username);
});

module.exports = bot;
