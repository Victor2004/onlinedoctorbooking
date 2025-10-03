const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const User = require("../models/User");

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Сохраняем пользователя в базу
async function saveUser(msg) {
  try {
    const user = await User.findOneAndUpdate(
      { telegramId: msg.from.id },
      {
        firstName: msg.from.first_name,
        lastName: msg.from.last_name || "",
        username: msg.from.username || "",
        languageCode: msg.from.language_code || "en",
        lastActivity: new Date(),
      },
      { upsert: true, new: true }
    );
    return user;
  } catch (error) {
    console.error("Error saving user:", error);
  }
}

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await saveUser(msg);

  const welcomeMessage = `
👋 Привет, ${msg.from.first_name}!

Я пример Telegram бота с веб-интерфейсом.

Доступные команды:
/start - начать работу
/help - помощь
/profile - информация о профиле
/website - ссылка на сайт
  `;

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      keyboard: [
        ["📊 Мой профиль", "🌐 Сайт"],
        ["📞 Связаться", "ℹ️ Помощь"],
      ],
      resize_keyboard: true,
    },
  });
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `
📖 Помощь по боту:

Это демонстрационный бот с интеграцией веб-сайта.

Функции:
• Управление профилем
• Интеграция с веб-сайтом
• База данных пользователей
• REST API
  `
  );
});

// Команда /profile
bot.onText(/\/profile/, async (msg) => {
  const chatId = msg.chat.id;
  const user = await User.findOne({ telegramId: msg.from.id });

  if (user) {
    const profileMessage = `
👤 Ваш профиль:

ID: ${user.telegramId}
Имя: ${user.firstName}
Фамилия: ${user.lastName || "Не указана"}
Username: @${user.username || "Не указан"}
Зарегистрирован: ${user.createdAt.toLocaleDateString()}
    `;

    bot.sendMessage(chatId, profileMessage);
  }
});

// Команда /website
bot.onText(/\/website/, (msg) => {
  const chatId = msg.chat.id;
  const websiteUrl = process.env.WEBSITE_URL || "http://localhost:3000";

  bot.sendMessage(chatId, `🌐 Посетите наш сайт: ${websiteUrl}`, {
    reply_markup: {
      inline_keyboard: [[{ text: "📱 Открыть сайт", url: websiteUrl }]],
    },
  });
});

// Обработка текстовых сообщений
bot.on("message", async (msg) => {
  if (msg.text && !msg.text.startsWith("/")) {
    const chatId = msg.chat.id;

    switch (msg.text) {
      case "📊 Мой профиль":
        const user = await User.findOne({ telegramId: msg.from.id });
        if (user) {
          bot.sendMessage(
            chatId,
            `👤 Ваш ID: ${user.telegramId}\nИмя: ${user.firstName}`
          );
        }
        break;

      case "🌐 Сайт":
        const websiteUrl = process.env.WEBSITE_URL || "http://localhost:3000";
        bot.sendMessage(chatId, `Перейдите на наш сайт: ${websiteUrl}`);
        break;

      case "📞 Связаться":
        bot.sendMessage(
          chatId,
          "📧 Email: support@example.com\n📱 Телефон: +7 (999) 999-99-99"
        );
        break;

      case "ℹ️ Помощь":
        bot.sendMessage(chatId, "Для помощи используйте команду /help");
        break;

      default:
        bot.sendMessage(
          chatId,
          "Я не понимаю эту команду. Используйте /help для списка команд."
        );
    }
  }
});

// Обработка ошибок
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

module.exports = bot;
