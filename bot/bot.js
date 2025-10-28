const { Telegraf } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

module.exports = (botData) => {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const WEB_SERVER_URL = process.env.WEB_SERVER_URL;

  if (!BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN is not set in .env file");
    return;
  }

  const bot = new Telegraf(BOT_TOKEN);

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

  module.exports.sendMessageToUser = sendMessageToUser;

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

  return bot;
};
