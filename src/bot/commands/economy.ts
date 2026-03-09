import { bot } from '../index.js';
import { db } from '../../firebase/index.js';

bot.command('работа', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане. Найдите или создайте клан, чтобы работать');
  }

  const user = userSnap.val();
  const clanId = user.clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) {
    return ctx.reply('Ваш клан больше не существует.');
  }

  // Check cooldown
  const lastWork = user.lastWork || 0;
  const now = Date.now();
  const cd = 6 * 60 * 60 * 1000; // 6 hours

  if (now - lastWork < cd) {
    const remaining = Math.ceil((cd - (now - lastWork)) / (60 * 1000));
    return ctx.reply(`Вы уже работали. Следующая смена через ${remaining} минут.`);
  }

  const salary = Math.floor(Math.random() * (500 - 100 + 1)) + 100;

  await db.ref(`clans/${clanId}/treasury`).set((clan.treasury || 0) + salary);
  await db.ref(`users/${userId}/contribution`).set((user.contribution || 0) + salary);
  await db.ref(`users/${userId}/lastWork`).set(now);

  ctx.reply(`Вы пошли работать на благо клана. Зарплата: ${salary} монет.\n➕ Клан получил ${salary} монет. Теперь в казне: ${(clan.treasury || 0) + salary} монет. Ваш личный вклад: ${(user.contribution || 0) + salary} монет.`);
});

bot.command('работа2', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане. Найдите или создайте клан, чтобы работать');
  }

  const user = userSnap.val();
  const clanId = user.clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) {
    return ctx.reply('Ваш клан больше не существует.');
  }

  // Check cooldown
  const lastWork2 = user.lastWork2 || 0;
  const now = Date.now();
  const cd = 12 * 60 * 60 * 1000; // 12 hours

  if (now - lastWork2 < cd) {
    const remaining = Math.ceil((cd - (now - lastWork2)) / (60 * 1000));
    return ctx.reply(`Вы уже работали. Следующая смена через ${remaining} минут.`);
  }

  const salary = Math.floor(Math.random() * (800 - 200 + 1)) + 200;

  await db.ref(`clans/${clanId}/treasury`).set((clan.treasury || 0) + salary);
  await db.ref(`users/${userId}/contribution`).set((user.contribution || 0) + salary);
  await db.ref(`users/${userId}/lastWork2`).set(now);

  ctx.reply(`Вы пошли работать на благо клана. Зарплата: ${salary} монет.\n➕ Клан получил ${salary} монет. Теперь в казне: ${(clan.treasury || 0) + salary} монет. Ваш личный вклад: ${(user.contribution || 0) + salary} монет.`);
});

bot.command('завод', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане. Найдите или создайте клан, чтобы работать');
  }

  const user = userSnap.val();
  const clanId = user.clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) {
    return ctx.reply('Ваш клан больше не существует.');
  }

  // Check cooldown
  const lastFactoryWork = user.lastFactoryWork || 0;
  const now = Date.now();
  const cd = 48 * 60 * 60 * 1000; // 48 hours

  if (now - lastFactoryWork < cd) {
    const remaining = Math.ceil((cd - (now - lastFactoryWork)) / (60 * 1000));
    return ctx.reply(`Вы уже работали. Следующая смена через ${remaining} минут.`);
  }

  const salary = Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;

  await db.ref(`clans/${clanId}/treasury`).set((clan.treasury || 0) + salary);
  await db.ref(`users/${userId}/contribution`).set((user.contribution || 0) + salary);
  await db.ref(`users/${userId}/lastFactoryWork`).set(now);

  ctx.reply(`Вы отработали смену на заводе и показали продукцию на ${salary} монет.\n➕ Клан получил ${salary} монет. Теперь в казне: ${(clan.treasury || 0) + salary} монет. Ваш личный вклад: ${(user.contribution || 0) + salary} монет.`);
});

bot.command('строй', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args[0] !== 'завод') return;
  
  const type = args[1]; // финансовый or оружейный
  
  if (!type || (type !== 'финансовый' && type !== 'оружейный')) {
    return ctx.reply('Используйте: /строй завод [финансовый/оружейный]');
  }

  const userId = ctx.from.id.toString();
  const userSnap = await db.ref(`users/${userId}`).once('value');
  
  if (!userSnap.exists() || !userSnap.val().clanId) {
    return ctx.reply('Вы не состоите в клане.');
  }

  const user = userSnap.val();
  const clanId = user.clanId;
  const clanSnap = await db.ref(`clans/${clanId}`).once('value');
  const clan = clanSnap.val();

  if (!clan) {
    return ctx.reply('Ваш клан больше не существует.');
  }

  const cost = type === 'финансовый' ? 1000 : 1250;

  if ((clan.treasury || 0) < cost) {
    return ctx.reply(`В казне недостаточно средств. Нужно ${cost} монет, а у вас ${clan.treasury || 0}`);
  }

  // Deduct cost and add factory
  await db.ref(`clans/${clanId}/treasury`).set((clan.treasury || 0) - cost);
  
  if (type === 'финансовый') {
    await db.ref(`clans/${clanId}/factories/financial`).set((clan.factories?.financial || 0) + 1);
  } else {
    await db.ref(`clans/${clanId}/factories/weapon`).set((clan.factories?.weapon || 0) + 1);
  }

  ctx.reply(`Завод (${type}) успешно построен!`);
});
