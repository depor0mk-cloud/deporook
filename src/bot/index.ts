import { Telegraf } from 'telegraf';
import { db } from '../firebase/index.js';

const BOT_TOKEN = '8555470613:AAEfKahMmG7_e7K2BgSyfN5DP-wT0LUhZTQ';
export const bot = new Telegraf(BOT_TOKEN);

// Middleware to check if bot is disabled or in test mode
bot.use(async (ctx, next) => {
  try {
    const settingsRef = db.ref('settings');
    const snapshot = await settingsRef.once('value');
    const settings = snapshot.val() || {};

    const isAdmin = ctx.from?.username === 'Trim_peek';

    if (settings.bot_disabled && !isAdmin) {
      return ctx.reply('🛠 Бот на тех.перерыве');
    }

    if (settings.test_mode && !isAdmin) {
      return ctx.reply('🔧 Бот на тестовом осмотре');
    }

    // Save chat id for broadcast
    if (ctx.chat?.id) {
      await db.ref(`chats/${ctx.chat.id}`).set(true);
    }

    return next();
  } catch (err) {
    console.error('Middleware error:', err);
    return next();
  }
});

// Basic commands
bot.start((ctx) => {
  ctx.reply('Добро пожаловать в игру Кланов! Используйте /правила для ознакомления.');
});

bot.command('правила', (ctx) => {
  ctx.reply('Правила игры:\n1. Создавайте кланы или вступайте в них.\n2. Развивайте экономику и армию.\n3. Воюйте с другими кланами.\n4. Станьте самым сильным кланом!');
});

// We will import other commands here
import './commands/clan.js';
import './commands/war.js';
import './commands/economy.js';
import './commands/admin.js';
