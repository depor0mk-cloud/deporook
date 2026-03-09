import { bot } from '../index.js';
import { db } from '../../firebase/index.js';

bot.command('создать', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args[0] !== 'клан') return;
  
  const name = args[1];
  const tag = args[2];
  
  if (!name || !tag) {
    return ctx.reply('Используйте: /создать клан [название] [тег]');
  }

  const userId = ctx.from.id.toString();
  const userRef = db.ref(`users/${userId}`);
  const userSnap = await userRef.once('value');
  
  if (userSnap.exists() && userSnap.val().clanId) {
    return ctx.reply('Вы уже в клане. Покиньте его, чтобы создать новый.');
  }

  // Check uniqueness
  const clansRef = db.ref('clans');
  const clansSnap = await clansRef.once('value');
  const clans = clansSnap.val() || {};
  
  for (const id in clans) {
    if (clans[id].name === name || clans[id].tag === tag) {
      return ctx.reply('Клан с таким названием или тегом уже существует.');
    }
  }

  // Send confirmation
  ctx.reply(`Будет создан клан ${name} [${tag}]. Вы уверены?`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Да, создать', callback_data: `create_clan_${name}_${tag}` }],
        [{ text: '❌ Отмена', callback_data: 'cancel_create_clan' }]
      ]
    }
  });
});

bot.action(/create_clan_(.+)_(.+)/, async (ctx) => {
  const name = ctx.match[1];
  const tag = ctx.match[2];
  const userId = ctx.from.id.toString();
  
  const clanId = `clan_${Date.now()}`;
  
  await db.ref(`clans/${clanId}`).set({
    name,
    tag,
    leader: userId,
    members: { [userId]: { role: 'leader' } },
    level: 1,
    exp: 0,
    hp: 10000,
    treasury: 0,
    army: 0,
    weapons: 0,
    factories: { financial: 0, weapon: 0 },
    created_at: Date.now()
  });

  await db.ref(`users/${userId}`).set({
    clanId,
    role: 'leader',
    contribution: 0,
    username: ctx.from.username || ctx.from.first_name
  });

  ctx.editMessageText('Клан создан! Ты лидер', {
    reply_markup: {
      inline_keyboard: [[{ text: '👁️ Мой клан', callback_data: 'my_clan' }]]
    }
  });
});

bot.action('cancel_create_clan', (ctx) => {
  ctx.editMessageText('Создание клана отменено.');
});

bot.command('мой', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args[0] !== 'клан') return;
  
  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане.');
  }

  const clanId = userSnap.val().clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) return ctx.reply('Клан не найден.');

  const membersCount = Object.keys(clan.members || {}).length;
  const effectiveArmy = clan.weapons >= clan.army ? clan.army : Math.floor(clan.army * (clan.weapons / clan.army || 0));

  const text = `🏰 Клан: ${clan.name} [${clan.tag}]
👑 Лидер: @${(await db.ref(`users/${clan.leader}`).once('value')).val()?.username || 'Неизвестно'}
👥 Участники: ${membersCount}/15
⭐ Уровень: ${clan.level} | Опыт: ${clan.exp}
❤️ Здоровье столицы: ${clan.hp}
💰 Казна: ${clan.treasury} монет
⚔️ Армия: ${clan.army} солдат, ${clan.weapons} автоматов (Эффективная сила: ${effectiveArmy})
🏭 Заводы:
   🏦 Финансовых: ${clan.factories?.financial || 0}
   🔫 Оружейных: ${clan.factories?.weapon || 0}`;

  ctx.reply(text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Участники', callback_data: 'clan_members' },
          { text: '🏭 Заводы', callback_data: 'clan_factories' }
        ],
        [
          { text: '⚔️ Война', callback_data: 'clan_war' },
          { text: '🚀 Ракеты', callback_data: 'clan_rockets' }
        ]
      ]
    }
  });
});

bot.action('my_clan', async (ctx) => {
  // Same logic as /мой клан
  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане.');
  }

  const clanId = userSnap.val().clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) return ctx.reply('Клан не найден.');

  const membersCount = Object.keys(clan.members || {}).length;
  const effectiveArmy = clan.weapons >= clan.army ? clan.army : Math.floor(clan.army * (clan.weapons / clan.army || 0));

  const text = `🏰 Клан: ${clan.name} [${clan.tag}]
👑 Лидер: @${(await db.ref(`users/${clan.leader}`).once('value')).val()?.username || 'Неизвестно'}
👥 Участники: ${membersCount}/15
⭐ Уровень: ${clan.level} | Опыт: ${clan.exp}
❤️ Здоровье столицы: ${clan.hp}
💰 Казна: ${clan.treasury} монет
⚔️ Армия: ${clan.army} солдат, ${clan.weapons} автоматов (Эффективная сила: ${effectiveArmy})
🏭 Заводы:
   🏦 Финансовых: ${clan.factories?.financial || 0}
   🔫 Оружейных: ${clan.factories?.weapon || 0}`;

  ctx.editMessageText(text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Участники', callback_data: 'clan_members' },
          { text: '🏭 Заводы', callback_data: 'clan_factories' }
        ],
        [
          { text: '⚔️ Война', callback_data: 'clan_war' },
          { text: '🚀 Ракеты', callback_data: 'clan_rockets' }
        ]
      ]
    }
  });
});

bot.command('список', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args[0] !== 'кланов') return;

  const clansSnap = await db.ref('clans').once('value');
  const clans = clansSnap.val() || {};
  
  if (Object.keys(clans).length === 0) {
    return ctx.reply('Кланов пока нет.');
  }

  const buttons = Object.keys(clans).map(id => {
    return [{ text: `${clans[id].name} [${clans[id].tag}]`, callback_data: `info_clan_${id}` }];
  });

  ctx.reply('Список кланов:', {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
});

bot.action(/info_clan_(.+)/, async (ctx) => {
  const clanId = ctx.match[1];
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) return ctx.reply('Клан не найден.');

  const membersCount = Object.keys(clan.members || {}).length;

  const text = `🏰 Клан: ${clan.name} [${clan.tag}]
👥 Участники: ${membersCount}/15
⭐ Уровень: ${clan.level}`;

  ctx.editMessageText(text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📩 Вступить', callback_data: `join_clan_${clanId}` }],
        [{ text: '🔙 Назад к списку', callback_data: 'list_clans' }]
      ]
    }
  });
});

bot.action('list_clans', async (ctx) => {
  const clansSnap = await db.ref('clans').once('value');
  const clans = clansSnap.val() || {};
  
  const buttons = Object.keys(clans).map(id => {
    return [{ text: `${clans[id].name} [${clans[id].tag}]`, callback_data: `info_clan_${id}` }];
  });

  ctx.editMessageText('Список кланов:', {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
});

bot.action(/join_clan_(.+)/, async (ctx) => {
  const clanId = ctx.match[1];
  const userId = ctx.from.id.toString();
  
  const userSnap = await db.ref(`users/${userId}`).once('value');
  if (userSnap.exists() && userSnap.val().clanId) {
    return ctx.answerCbQuery('Вы уже в клане!', { show_alert: true });
  }

  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();
  if (!clan) return ctx.answerCbQuery('Клан не найден!', { show_alert: true });

  ctx.editMessageText(`Отредактировать заявку в клан ${clan.name}?`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Да', callback_data: `confirm_join_${clanId}` }],
        [{ text: '❌ Назад', callback_data: 'list_clans' }]
      ]
    }
  });
});

bot.action(/confirm_join_(.+)/, async (ctx) => {
  const clanId = ctx.match[1];
  const userId = ctx.from.id.toString();
  
  // Directly join for now
  await db.ref(`clans/${clanId}/members/${userId}`).set({ role: 'citizen' });
  await db.ref(`users/${userId}`).set({
    clanId,
    role: 'citizen',
    contribution: 0,
    username: ctx.from.username || ctx.from.first_name
  });

  ctx.editMessageText('Вы успешно вступили в клан!', {
    reply_markup: {
      inline_keyboard: [[{ text: '👁️ Мой клан', callback_data: 'my_clan' }]]
    }
  });
});

bot.command('выйти', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане.');
  }

  const clanId = userSnap.val().clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (clan.leader === userId) {
    return ctx.reply('Вы лидер. Если выйдет — клан будет расформирован или потребуется передать лидерство.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'cancel_leave' }]
        ]
      }
    });
  }

  ctx.reply(`Вы уверены, что отказываетесь от клана ${clan.name}?`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Да, выйти', callback_data: `leave_clan_${clanId}` }],
        [{ text: '❌ Отмена', callback_data: 'cancel_leave' }]
      ]
    }
  });
});

bot.action(/leave_clan_(.+)/, async (ctx) => {
  const clanId = ctx.match[1];
  const userId = ctx.from.id.toString();
  
  await db.ref(`clans/${clanId}/members/${userId}`).remove();
  await db.ref(`users/${userId}/clanId`).remove();
  await db.ref(`users/${userId}/role`).remove();

  ctx.editMessageText('Вы покинули клан.', {
    reply_markup: {
      inline_keyboard: [[{ text: 'К списку кланов', callback_data: 'list_clans' }]]
    }
  });
});

bot.action('cancel_leave', (ctx) => {
  ctx.editMessageText('Выход отменен.');
});
