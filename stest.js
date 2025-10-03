const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const token = process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN";

// Простой бот
const bot = new TelegramBot(token, { polling: true });

// Храним пользователей в памяти (для теста)
let users = [];

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Команда /start
bot.onText(/\/start/, (msg) => {
  const user = {
    id: msg.from.id,
    name: msg.from.first_name,
    username: msg.from.username,
    date: new Date(),
  };

  users.push(user);

  bot.sendMessage(
    msg.chat.id,
    `👋 Привет, ${msg.from.first_name}!\nБот работает на сервере!`
  );
});

// Команда /stats
bot.onText(/\/stats/, (msg) => {
  bot.sendMessage(msg.chat.id, `📊 Всего пользователей: ${users.length}`);
});

// Веб-интерфейс
app.get("/", (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Тест Бота</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .stats { background: #f0f0f0; padding: 20px; border-radius: 10px; }
            </style>
        </head>
        <body>
            <h1>🤖 Телеграм Бот</h1>
            <div class="stats">
                <h3>Статистика:</h3>
                <p>Пользователей: ${users.length}</p>
                <p>Порт: ${PORT}</p>
            </div>
            <p>Бот работает! Напишите ему в Telegram.</p>
        </body>
        </html>
    `);
});

// API для получения статистики
app.get("/api/stats", (req, res) => {
  res.json({
    users: users.length,
    serverTime: new Date(),
    status: "online",
  });
});

// Запуск сервера
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Веб-интерфейс: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/stats`);
});

// Обработка ошибок
bot.on("error", (error) => {
  console.log("Ошибка бота:", error);
});
