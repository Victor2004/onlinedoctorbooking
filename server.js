const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Храним данные в памяти
const botData = {
  users: new Map(), // userId -> userData
  messages: [],
  botStatus: "offline",
  startTime: new Date(),
  stats: {
    totalUsers: 0,
    totalMessages: 0,
    usersToday: 0,
  },
};

// Функции для работы с данными
const updateUser = (userId, userData) => {
  if (!botData.users.has(userId)) {
    botData.stats.totalUsers++;
    // Проверяем новых пользователей за сегодня
    const today = new Date().toDateString();
    const userFirstSeen = botData.users.get(userId)?.firstSeen;
    if (!userFirstSeen || new Date(userFirstSeen).toDateString() !== today) {
      botData.stats.usersToday++;
    }
  }

  botData.users.set(userId, {
    ...botData.users.get(userId),
    ...userData,
    lastActivity: new Date(),
    firstSeen: botData.users.get(userId)?.firstSeen || new Date(),
  });
};

const addMessage = (messageData) => {
  botData.messages.push({
    ...messageData,
    time: new Date(),
    id: Date.now() + Math.random(),
  });
  botData.stats.totalMessages++;

  // Ограничиваем историю сообщений
  if (botData.messages.length > 1000) {
    botData.messages = botData.messages.slice(-500);
  }
};

// API маршруты
app.get("/api/stats", (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const recentMessages = botData.messages.filter(
    (msg) => new Date(msg.time) > todayStart
  ).length;

  res.json({
    users: {
      total: botData.stats.totalUsers,
      today: botData.stats.usersToday,
      active: Array.from(botData.users.values()).length,
    },
    messages: {
      total: botData.stats.totalMessages,
      today: recentMessages,
    },
    botStatus: botData.botStatus,
    serverTime: now,
    uptime: Math.floor((now - botData.startTime) / 1000),
    lastMessages: botData.messages.slice(-10).reverse(),
  });
});

app.get("/api/users", (req, res) => {
  const usersArray = Array.from(botData.users.entries()).map(
    ([userId, userData]) => ({
      id: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      firstSeen: userData.firstSeen,
      lastActivity: userData.lastActivity,
      messageCount: botData.messages.filter((msg) => msg.userId === userId)
        .length,
    })
  );

  res.json(
    usersArray.sort(
      (a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)
    )
  );
});

app.get("/api/messages", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const messages = botData.messages
    .slice(-limit)
    .reverse()
    .map((msg) => ({
      ...msg,
      user: botData.users.get(msg.userId) || { firstName: "Unknown" },
    }));

  res.json(messages);
});

// Вебхук для бота
app.post("/api/bot-event", (req, res) => {
  const { type, data } = req.body;

  try {
    switch (type) {
      case "user_start":
        updateUser(data.userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
        });
        addMessage({
          type: "start",
          userId: data.userId,
          text: "/start",
        });
        break;

      case "user_message":
        updateUser(data.userId, {
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
        });
        addMessage({
          type: "message",
          userId: data.userId,
          text: data.text,
        });
        break;

      case "bot_status":
        botData.botStatus = data.status;
        break;
    }

    res.json({ success: true, message: "Event processed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HTML маршруты
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

app.get("/users", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "users.html"));
});

app.get("/messages", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "messages.html"));
});

// Информация о API
app.get("/api/info", (req, res) => {
  res.json({
    message: "Telegram Bot Dashboard API",
    version: "1.0.0",
    framework: "Node.js + Express + Telegraf",
    storage: "In-memory",
    endpoints: {
      "/api/stats": "Get bot statistics",
      "/api/users": "Get users list",
      "/api/messages": "Get messages history",
      "/api/bot-event": "Bot webhook (POST)",
    },
  });
});

// Запуск сервера
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/stats`);
  console.log(`🤖 Bot: http://localhost:${PORT}/bot/bot.js`);
  console.log(`💾 Storage: In-memory (no database)`);

  // Запускаем бота
  require("./bot/bot.js")(botData);
});
