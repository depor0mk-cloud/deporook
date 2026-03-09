import { bot } from '../index.js';
import { db } from '../../firebase/index.js';

bot.command('мобилизация', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане.');
  }

  const user = userSnap.val();
  if (user.role !== 'leader' && user.role !== 'officer') {
    return ctx.reply('Только лидеры и офицеры могут проводить мобилизацию.');
  }

  const clanId = user.clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) {
    return ctx.reply('Ваш клан больше не существует.');
  }

  // Check cooldown
  const lastMob = clan.lastMobilization || 0;
  const now = Date.now();
  const cd = 5 * 60 * 60 * 1000; // 5 hours

  if (now - lastMob < cd) {
    const remaining = Math.ceil((cd - (now - lastMob)) / (60 * 1000));
    return ctx.reply(`Мобилизация уже проводилась. Следующая через ${remaining} минут.`);
  }

  const cost = 500;
  if ((clan.treasury || 0) < cost) {
    return ctx.reply(`В казне недостаточно средств. Нужно ${cost} монет, а у вас ${clan.treasury || 0}`);
  }

  const soldiers = Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000;

  await db.ref(`clans/${clanId}/treasury`).set((clan.treasury || 0) - cost);
  await db.ref(`clans/${clanId}/army`).set((clan.army || 0) + soldiers);
  await db.ref(`clans/${clanId}/lastMobilization`).set(now);

  ctx.reply(`Вы провели мобилизацию на ${cost} монет и взяли ${soldiers} солдат. Теперь в армии клана ${(clan.army || 0) + soldiers} бойцов.`);
});

bot.command('объявить', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args[0] !== 'войну') return;
  
  const targetTag = args[1];
  
  if (!targetTag) {
    return ctx.reply('Используйте: /объявить войну [тег]');
  }

  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане.');
  }

  const user = userSnap.val();
  if (user.role !== 'leader') {
    return ctx.reply('Только лидер может объявлять войну.');
  }

  const clanId = user.clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) {
    return ctx.reply('Ваш клан больше не существует.');
  }

  // Find target clan
  const clansSnap = await db.ref('clans').once('value');
  const clans = clansSnap.val() || {};
  
  let targetClanId = null;
  for (const id in clans) {
    if (clans[id].tag === targetTag || clans[id].name === targetTag) {
      targetClanId = id;
      break;
    }
  }

  if (!targetClanId) {
    return ctx.reply('Клан-цель не найден.');
  }

  if (targetClanId === clanId) {
    return ctx.reply('Нельзя объявить войну самому себе.');
  }

  ctx.reply(`Вы хотите объявить войну клану ${clans[targetClanId].name}? С этого момента лидеры и офицеры смогут их атаковать.`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚔️ Объявить войну', callback_data: `declare_war_${targetClanId}` }],
        [{ text: '❌ Отмена', callback_data: 'cancel_war' }]
      ]
    }
  });
});

bot.action(/declare_war_(.+)/, async (ctx) => {
  const targetClanId = ctx.match[1];
  const userId = ctx.from.id.toString();
  
  const userSnap = await db.ref(`users/${userId}`).once('value');
  const clanId = userSnap.val().clanId;

  await db.ref(`clans/${clanId}/wars/${targetClanId}`).set(true);
  await db.ref(`clans/${targetClanId}/wars/${clanId}`).set(true);

  ctx.editMessageText('Война объявлена!');
});

bot.action('cancel_war', (ctx) => {
  ctx.editMessageText('Объявление войны отменено.');
});

bot.command('атака', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  const amount = parseInt(args[0]);
  
  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане.');
  }

  const user = userSnap.val();
  if (user.role !== 'leader' && user.role !== 'officer') {
    return ctx.reply('Только лидеры и офицеры могут атаковать.');
  }

  const clanId = user.clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) {
    return ctx.reply('Ваш клан больше не существует.');
  }

  if (!clan.wars || Object.keys(clan.wars).length === 0) {
    return ctx.reply('Ваш клан ни с кем не воюет.');
  }

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('Используйте: /атака [количество]');
  }

  if (amount > (clan.army || 0)) {
    return ctx.reply(`У вас нет столько солдат. В армии: ${clan.army || 0}`);
  }

  const targetClanId = Object.keys(clan.wars)[0]; // Just attack the first war for now

  ctx.reply(`Отправить ${amount} бойцов в атаку на клан? Атака занимает несколько секунд.`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✅ Атаковать', callback_data: `attack_${targetClanId}_${amount}` }],
        [{ text: '❌ Отмена', callback_data: 'cancel_attack' }]
      ]
    }
  });
});

bot.action(/attack_(.+)_(.+)/, async (ctx) => {
  const targetClanId = ctx.match[1];
  const amount = parseInt(ctx.match[2]);
  const userId = ctx.from.id.toString();
  
  const userSnap = await db.ref(`users/${userId}`).once('value');
  const clanId = userSnap.val().clanId;

  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (amount > (clan.army || 0)) {
    return ctx.answerCbQuery('У вас нет столько солдат.', { show_alert: true });
  }

  ctx.editMessageText('⚔️ Атака началась, ожидайте результата...');

  setTimeout(async () => {
    // Resolve attack
    const targetClanSnap = await db.ref(`clans/${targetClanId}`).once('value');
    const targetClan = targetClanSnap.val();

    if (!targetClan) return ctx.reply('Клан-цель не найден.');

    const attackerLosses = Math.floor(amount * 0.1);
    const defenderLosses = Math.floor(amount * 0.05);
    const damage = Math.floor(amount * 0.5);

    await db.ref(`clans/${clanId}/army`).set(Math.max(0, (clan.army || 0) - attackerLosses));
    await db.ref(`clans/${targetClanId}/army`).set(Math.max(0, (targetClan.army || 0) - defenderLosses));
    await db.ref(`clans/${targetClanId}/hp`).set(Math.max(0, (targetClan.hp || 10000) - damage));

    ctx.reply(`Результат атаки:
Ваши потери: ${attackerLosses} бойцов
Потери врага: ${defenderLosses} бойцов
Урон по столице врага: ${damage} HP`);
  }, 5000);
});

bot.action('cancel_attack', (ctx) => {
  ctx.editMessageText('Атака отменена.');
});
