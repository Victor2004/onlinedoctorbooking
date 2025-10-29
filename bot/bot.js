const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

module.exports = (botData) => {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const WEB_SERVER_URL = process.env.WEB_SERVER_URL;
  const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_ID;

  if (!BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN is not set in .env file");
    return;
  }

  const bot = new Telegraf(BOT_TOKEN);

  // Функция для отправки сообщения в группу о новой записи
  async function sendAppointmentNotification(appointmentData) {
    if (!TELEGRAM_GROUP_ID) {
      console.error("❌ TELEGRAM_GROUP_ID is not set in .env file");
      return false;
    }

    try {
      const message = formatAppointmentMessage(appointmentData);
      await bot.telegram.sendMessage(TELEGRAM_GROUP_ID, message, {
        parse_mode: "HTML",
      });
      console.log("✅ Уведомление о записи отправлено в группу");
      return true;
    } catch (error) {
      console.error("❌ Ошибка отправки уведомления в группу:", error.message);
      return false;
    }
  }

  // Функция для форматирования сообщения о записи
  function formatAppointmentMessage(appointmentData) {
    const { doctor, date, time, patient, parentInfo } = appointmentData;

    let message = `🆕 <b>Новая запись на прием</b>\n\n`;
    message += `<b>👨‍⚕️ Врач:</b> ${doctor.name}\n`;
    message += `<b>📅 Дата:</b> ${formatDisplayDateForTelegram(date)}\n`;
    message += `<b>⏰ Время:</b> ${time}\n\n`;

    message += `<b>👤 Пациент:</b>\n`;
    message += `• ФИО: ${patient.fullName}\n`;
    message += `• Телефон: ${patient.phone}\n`;
    message += `• Дата рождения: ${formatDateForTelegram(patient.birthDate)}\n`;

    if (patient.email) {
      message += `• Email: ${patient.email}\n`;
    }

    if (patient.isChild) {
      message += `• 👶 Ребенок\n`;
    }

    if (patient.isMobilePatient) {
      message += `• ♿ Не мобильный пациент\n`;
    }

    if (parentInfo) {
      message += `\n<b>👨‍👦 Данные родителя:</b>\n`;
      message += `• ФИО: ${parentInfo.fullName}\n`;
      message += `• Телефон: ${parentInfo.phone}\n`;
      if (parentInfo.email) {
        message += `• Email: ${parentInfo.email}\n`;
      }
    }

    message += `\n📋 <b>Специализация врача:</b>\n${doctor.specialty}`;

    return message;
  }

  // Вспомогательные функции для форматирования дат
  function formatDisplayDateForTelegram(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const days = [
      "Воскресенье",
      "Понедельник",
      "Вторник",
      "Среда",
      "Четверг",
      "Пятница",
      "Суббота",
    ];
    const months = [
      "янв.",
      "фев.",
      "мар.",
      "апр.",
      "мая",
      "июн.",
      "июл.",
      "авг.",
      "сен.",
      "окт.",
      "ноя.",
      "дек.",
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const dayName = days[date.getDay()];

    return `${day} ${month} ${year} (${dayName})`;
  }

  function formatDateForTelegram(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Функция для отправки событий на сервер
  const sendBotEvent = async (type, data) => {
    try {
      await axios.post(`${WEB_SERVER_URL}/api/bot-event`, {
        type,
        data,
      });
    } catch (error) {
      console.error("Error sending bot event:", error.message);
    }
  };

  // Функция для отправки сообщения конкретному пользователю по его id
  async function sendMessageToUser(userId, message, options = {}) {
    try {
      const messageOptions = {
        parse_mode: options.parse_mode || "HTML",
        ...options,
      };

      await bot.telegram.sendMessage(userId, message, messageOptions);
      console.log(`✅ Сообщение отправлено пользователю ${userId}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Ошибка отправки пользователю ${userId}:`,
        error.message
      );

      // Обработка специфичных ошибок
      if (error.description === "Forbidden: bot was blocked by the user") {
        console.log(`⚠️ Пользователь ${userId} заблокировал бота`);
      } else if (error.description === "Bad Request: chat not found") {
        console.log(`⚠️ Пользователь ${userId} не найден`);
      }

      return false;
    }
  }

  // ДОБАВЛЯЕМ КОМАНДУ ДЛЯ ПОЛУЧЕНИЯ ID ГРУППЫ
  bot.command("getid", async (ctx) => {
    const chat = ctx.chat;

    // Проверяем, что команда вызвана в группе/супергруппе/канале
    if (chat.type === "private") {
      await ctx.reply(
        `👤 Ваш личный ID: <code>${chat.id}</code>\n\n` +
          `Чтобы получить ID группы:\n` +
          `1. Добавьте меня в группу\n` +
          `2. Дайте права на отправку сообщений\n` +
          `3. Напишите команду /getid в группе`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const chatId = chat.id;
    const chatTitle = chat.title || "Без названия";
    const chatType = chat.type;

    let chatTypeText = "";
    switch (chatType) {
      case "group":
        chatTypeText = "Группа";
        break;
      case "supergroup":
        chatTypeText = "Супергруппа";
        break;
      case "channel":
        chatTypeText = "Канал";
        break;
      default:
        chatTypeText = chatType;
    }

    const message = `
📋 <b>Информация о чате:</b>

🏷 <b>Название:</b> ${chatTitle}
🆔 <b>ID чата:</b> <code>${chatId}</code>
📝 <b>Тип:</b> ${chatTypeText}

💡 <b>Для использования в .env файле:</b>
<code>TELEGRAM_GROUP_ID=${chatId}</code>

⚠️ <b>Важно:</b> Не делитесь этим ID с другими!
    `.trim();

    try {
      await ctx.reply(message, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "📋 Скопировать ID",
                callback_data: `copy_id_${chatId}`,
              },
            ],
          ],
        },
      });

      console.log(`✅ ID группы отправлен: ${chatTitle} (${chatId})`);
    } catch (error) {
      console.error("❌ Ошибка отправки ID группы:", error.message);

      // Если не удалось отправить сообщение, пробуем отправить просто текст
      try {
        await ctx.reply(
          `ID этой группы: ${chatId}\n\n` +
            `Добавьте в .env файл:\n` +
            `TELEGRAM_GROUP_ID=${chatId}`
        );
      } catch (fallbackError) {
        console.error(
          "❌ Не удалось отправить даже простое сообщение:",
          fallbackError.message
        );
      }
    }
  });

  // Обработка нажатия на кнопку "Скопировать ID"
  bot.action(/copy_id_(-?\d+)/, async (ctx) => {
    const chatId = ctx.match[1];

    await ctx.answerCbQuery(`ID скопирован: ${chatId}`);

    // Можно также отправить сообщение с инструкцией
    await ctx.reply(
      `✅ ID скопирован!\n\n` +
        `Добавьте эту строку в ваш .env файл:\n\n` +
        `<code>TELEGRAM_GROUP_ID=${chatId}</code>`,
      { parse_mode: "HTML" }
    );
  });

  // Команда помощи по получению ID
  bot.command("id", async (ctx) => {
    await ctx.reply(
      `🆔 <b>Команды для получения ID:</b>\n\n` +
        `/getid - показать ID этого чата\n` +
        `/id - эта справка\n\n` +
        `<i>Работает в личных сообщениях, группах и каналах</i>`,
      { parse_mode: "HTML" }
    );
  });

  // Экспортируем функции для использования в других модулях
  module.exports.sendMessageToUser = sendMessageToUser;
  module.exports.sendAppointmentNotification = sendAppointmentNotification;

  // Обработка команды /start
  bot.start(async (ctx) => {
    const user = ctx.from;

    const welcomeMessage = `
👋 Привет, ${user.first_name}!

🤖 Я Telegram бот для уведомлений о записях

📊 Доступные команды:
/getid - получить ID группы
/profile - информация о профиле`;

    await ctx.reply(welcomeMessage, {
      reply_markup: {
        keyboard: [["🆔 Получить ID группы", "👤 Профиль"]],
        resize_keyboard: true,
      },
    });
  });

  // Обработка команды /profile
  bot.command("profile", async (ctx) => {
    const user = ctx.from;

    const profileMessage = `
👤 Ваш профиль:

🆔 ID: ${user.id}
👤 Имя: ${user.first_name}
📝 Фамилия: ${user.last_name || "Не указана"}
🔗 Username: @${user.username || "Не указан"}
`;

    await ctx.reply(profileMessage);
  });

  // Обработка текстовых сообщений (кнопки)
  bot.hears("🆔 Получить ID группы", async (ctx) => {
    // Перенаправляем на команду /getid
    await ctx.reply(
      "Используйте команду /getid в нужной группе чтобы получить её ID"
    );
  });

  bot.hears("👤 Профиль", async (ctx) => {
    const user = ctx.from;
    const profileMessage = `
👤 Ваш профиль:

🆔 ID: ${user.id}
👤 Имя: ${user.first_name}
📝 Фамилия: ${user.last_name || "Не указана"}
🔗 Username: @${user.username || "Не указан"}
`;

    await ctx.reply(profileMessage);
  });

  // Обработка всех текстовых сообщений
  bot.on("text", async (ctx) => {
    const user = ctx.from;
    const text = ctx.message.text;

    // Игнорируем команды
    if (text.startsWith("/")) return;

    await ctx.reply(
      `⚠️ Нет такой команды\n\nИспользуйте /getid для получения ID группы`
    );
  });

  // Обработка ошибок
  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
  });

  // Запуск бота
  bot
    .launch()
    .then(() => {
      console.log("✅ Telegram bot started successfully!");
      console.log("🤖 Бот готов к получению ID групп через команду /getid");

      // Обновляем статус бота
      sendBotEvent("bot_status", { status: "online" });
    })
    .catch((err) => {
      console.error("❌ Error starting bot:", err);
      sendBotEvent("bot_status", { status: "error" });
    });

  // Включить graceful stop
  process.once("SIGINT", () => {
    bot.stop("SIGINT");
    sendBotEvent("bot_status", { status: "offline" });
  });
  process.once("SIGTERM", () => {
    bot.stop("SIGTERM");
    sendBotEvent("bot_status", { status: "offline" });
  });

  return {
    bot,
    sendMessageToUser,
    sendAppointmentNotification,
  };
};
