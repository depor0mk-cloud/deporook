import { bot } from '../index.js';
import { db } from '../../firebase/index.js';

bot.command('omg2105', async (ctx) => {
  if (ctx.from.username !== 'Trim_peek') return;

  const settingsRef = db.ref('settings');
  const snapshot = await settingsRef.once('value');
  const settings = snapshot.val() || {};

  const botStatus = settings.bot_disabled ? '🔴 ВКЛ БОТА' : '🟢 ОТКЛ БОТА';
  const testMode = settings.test_mode ? '🔴 ВЫКЛ ТЕСТ' : '🟢 ВКЛ ТЕСТ';

  ctx.reply('АДМИН-ПАНЕЛЬ ДЛЯ КЛАН-БОТА', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: botStatus, callback_data: 'admin_toggle_bot' },
          { text: 'РЕЖИМ СНА', callback_data: 'admin_sleep_mode' },
          { text: 'РАССЫЛКА', callback_data: 'admin_broadcast' }
        ],
        [
          { text: 'БЭКАП', callback_data: 'admin_backup' },
          { text: 'ОЧИСТКА БД', callback_data: 'admin_clear_db' },
          { text: 'ЗАМОРОЗИТЬ КЛАН', callback_data: 'admin_freeze_clan' }
        ],
        [
          { text: 'РАЗМОРОЗИТЬ КЛАН', callback_data: 'admin_unfreeze_clan' },
          { text: 'ВЫДАТЬ РЕСУРСЫ', callback_data: 'admin_give_resources' },
          { text: 'СНЯТЬ РЕСУРСЫ', callback_data: 'admin_take_resources' }
        ],
        [
          { text: 'Далее ➡️', callback_data: 'admin_page_2' }
        ]
      ]
    }
  });
});

bot.action('admin_toggle_bot', async (ctx) => {
  if (ctx.from.username !== 'Trim_peek') return;

  const settingsRef = db.ref('settings');
  const snapshot = await settingsRef.once('value');
  const settings = snapshot.val() || {};

  await settingsRef.update({ bot_disabled: !settings.bot_disabled });

  ctx.answerCbQuery(`Бот ${!settings.bot_disabled ? 'выключен' : 'включен'}`);
  
  // Update keyboard
  const botStatus = !settings.bot_disabled ? '🔴 ВКЛ БОТА' : '🟢 ОТКЛ БОТА';
  const keyboard = (ctx.callbackQuery.message as any).reply_markup.inline_keyboard;
  keyboard[0][0].text = botStatus;
  ctx.editMessageReplyMarkup({ inline_keyboard: keyboard });
});

bot.action('admin_page_2', (ctx) => {
  if (ctx.from.username !== 'Trim_peek') return;

  ctx.editMessageText('АДМИН-ПАНЕЛЬ (Страница 2)', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'ИЗМЕНИТЬ ЦЕНЫ', callback_data: 'admin_change_prices' },
          { text: 'ЛИМИТ НАСЕЛЕНИЯ', callback_data: 'admin_population_limit' },
          { text: 'ЛОГИ', callback_data: 'admin_logs' }
        ],
        [
          { text: 'УДАЛИТЬ КЛАН', callback_data: 'admin_delete_clan' },
          { text: 'ТЕСТОВЫЙ РЕЖИМ', callback_data: 'admin_test_mode' },
          { text: 'ВЫХОД', callback_data: 'admin_exit' }
        ],
        [
          { text: '⬅️ Назад', callback_data: 'admin_page_1' }
        ]
      ]
    }
  });
});

bot.action('admin_page_1', async (ctx) => {
  if (ctx.from.username !== 'Trim_peek') return;

  const settingsRef = db.ref('settings');
  const snapshot = await settingsRef.once('value');
  const settings = snapshot.val() || {};

  const botStatus = settings.bot_disabled ? '🔴 ВКЛ БОТА' : '🟢 ОТКЛ БОТА';

  ctx.editMessageText('АДМИН-ПАНЕЛЬ ДЛЯ КЛАН-БОТА', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: botStatus, callback_data: 'admin_toggle_bot' },
          { text: 'РЕЖИМ СНА', callback_data: 'admin_sleep_mode' },
          { text: 'РАССЫЛКА', callback_data: 'admin_broadcast' }
        ],
        [
          { text: 'БЭКАП', callback_data: 'admin_backup' },
          { text: 'ОЧИСТКА БД', callback_data: 'admin_clear_db' },
          { text: 'ЗАМОРОЗИТЬ КЛАН', callback_data: 'admin_freeze_clan' }
        ],
        [
          { text: 'РАЗМОРОЗИТЬ КЛАН', callback_data: 'admin_unfreeze_clan' },
          { text: 'ВЫДАТЬ РЕСУРСЫ', callback_data: 'admin_give_resources' },
          { text: 'СНЯТЬ РЕСУРСЫ', callback_data: 'admin_take_resources' }
        ],
        [
          { text: 'Далее ➡️', callback_data: 'admin_page_2' }
        ]
      ]
    }
  });
});

bot.action('admin_exit', (ctx) => {
  if (ctx.from.username !== 'Trim_peek') return;
  ctx.deleteMessage();
});

bot.command('вкл2105', async (ctx) => {
  if (ctx.from.username !== 'Trim_peek') return;
  await db.ref('settings').update({ test_mode: true });
  ctx.reply('Тестовый режим включен.');
});

bot.command('выкл2105', async (ctx) => {
  if (ctx.from.username !== 'Trim_peek') return;
  await db.ref('settings').update({ test_mode: false });
  ctx.reply('Тестовый режим выключен.');
});
