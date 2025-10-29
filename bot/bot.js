const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

module.exports = (botData) => {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const WEB_SERVER_URL = process.env.WEB_SERVER_URL;
  const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_ID; // Добавляем ID группы

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

  // Экспортируем функции для использования в других модулях
  module.exports.sendMessageToUser = sendMessageToUser;
  module.exports.sendAppointmentNotification = sendAppointmentNotification;

  // Обработка команды /start
  bot.start(async (ctx) => {
    const user = ctx.from;

    // Отправляем событие на сервер
    // await sendBotEvent("user_start", {
    //   userId: user.id,
    //   firstName: user.first_name,
    //   lastName: user.last_name,
    //   username: user.username,
    //   chatId: ctx.chat.id,
    // });

    const welcomeMessage = `
👋 Привет, ${user.first_name}!

🤖 Я Telegram бот буду

📊 Доступные команды:
/profile - информация о профиле`;

    await ctx.reply(welcomeMessage, {
      reply_markup: {
        keyboard: [
          // ["📊 Статистика", "👤 Профиль"],
          // ["🌐 Сайт", "ℹ️ Помощь"],
          ["👤 Профиль"],
        ],
        resize_keyboard: true,
      },
    });

    //     sendMessageToUser(
    //       99999,
    //       `👤 ${user.first_name} ${user.last_name || "Не указана"} @${
    //         user.username || "Не указан"
    //       }
    // ID: ${user.id}
    // Команда: /start`
    //     );
  });

  // Обработка команды /help
  //   bot.help(async (ctx) => {
  //     const helpMessage = `
  // 📖 Помощь по боту:

  // Это демонстрационный Telegram бот с веб-интерфейсом.

  // 🔧 Функции:
  // • Отслеживание пользователей
  // • Статистика в реальном времени
  // • История сообщений
  // • Веб-панель управления

  // 💻 Технологии:
  // • Backend: Node.js + Express
  // • Bot: Telegraf
  // • Frontend: HTML/CSS/JS
  // • Хранилище: In-memory

  // 🌐 Веб-сайт: ${WEB_SERVERURL}
  //     `;

  //     await ctx.reply(helpMessage);
  //   });

  // Обработка команды /stats
  //   bot.command("stats", async (ctx) => {
  //     const userCount = botData.stats.totalUsers;
  //     const messageCount = botData.stats.totalMessages;

  //     const statsMessage = `
  // 📊 Статистика бота:

  // 👥 Всего пользователей: ${userCount}
  // 💬 Всего сообщений: ${messageCount}
  // 🆔 Ваш ID: ${ctx.from.id}
  // 🌐 Сайт: ${WEB_SERVER_URL}
  //     `;

  //     await ctx.reply(statsMessage);
  //   });

  // Обработка команды /profile
  bot.command("profile", async (ctx) => {
    const user = ctx.from;
    // const userData = botData.users.get(user.id);

    const profileMessage = `
👤 Ваш профиль:

🆔 ID: ${user.id}
👤 Имя: ${user.first_name}
📝 Фамилия: ${user.last_name || "Не указана"}
🔗 Username: @${user.username || "Не указан"}
`;

    await ctx.reply(profileMessage);
  });

  // Обработка команды /website
  // bot.command("website", async (ctx) => {
  //   await ctx.reply(`🌐 Наш веб-сайт: ${WEB_SERVER_URL}`, {
  //     reply_markup: {
  //       inline_keyboard: [
  //         [
  //           {
  //             text: "📱 Открыть сайт",
  //             url: WEB_SERVER_URL,
  //           },
  //         ],
  //       ],
  //     },
  //   });
  // });

  // Обработка текстовых сообщений (кнопки)
  bot.hears("📊 Статистика", async (ctx) => {
    const userCount = botData.stats.totalUsers;
    const messageCount = botData.stats.totalMessages;

    await ctx.reply(
      `📊 Статистика:\nПользователей: ${userCount}\nСообщений: ${messageCount}`
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

  bot.hears("🌐 Сайт", async (ctx) => {
    await ctx.reply(`🌐 Сайт: ${WEB_SERVER_URL}`);
  });

  bot.hears("ℹ️ Помощь", async (ctx) => {
    await ctx.reply("Для помощи используйте команду /help");
  });

  // Обработка всех текстовых сообщений
  bot.on("text", async (ctx) => {
    const user = ctx.from;
    const text = ctx.message.text;

    // Игнорируем команды
    if (text.startsWith("/")) return;

    // Отправляем событие на сервер
    // await sendBotEvent("user_message", {
    //   userId: user.id,
    //   firstName: user.first_name,
    //   lastName: user.last_name,
    //   username: user.username,
    //   text: text,
    //   chatId: ctx.chat.id,
    // });

    // Эхо-ответ
    // await ctx.reply(`🔁 Вы сказали: "${text}"`);
    await ctx.reply(`⚠️ Нет такой команды`);
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
