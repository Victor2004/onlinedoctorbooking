// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const database = require("./database"); // исправленный импорт

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Инициализация БД при старте
database
  .init()
  .then(() => {
    console.log("✅ Database ready");
  })
  .catch(console.error);

// API для получения докторов
app.get("/api/doctors", async (req, res) => {
  try {
    const doctors = await database.getDoctors();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для проверки доступности
app.get("/api/availability/:doctorId/:date", async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const bookedSlots = await database.getBookedSlots(parseInt(doctorId), date);
    res.json({ bookedSlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для создания записи
app.post("/api/appointments", async (req, res) => {
  try {
    const bookingData = req.body;

    // Проверяем доступность
    const isAvailable = await database.isTimeSlotAvailable(
      bookingData.doctorId,
      bookingData.date,
      bookingData.time
    );

    if (!isAvailable) {
      return res.status(400).json({ error: "Время уже занято" });
    }

    const appointmentId = await database.createAppointment(bookingData);
    res.json({ success: true, appointmentId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для получения информации о записи
app.get("/api/appointments/:id", async (req, res) => {
  try {
    const appointment = await database.getAppointment(parseInt(req.params.id));
    if (!appointment) {
      return res.status(404).json({ error: "Запись не найдена" });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API для управления недоступными датами (для админки)
app.get("/api/unavailable-dates", async (req, res) => {
  try {
    const doctorId = req.query.doctorId ? parseInt(req.query.doctorId) : null;
    const dates = await database.getUnavailableDates(doctorId);
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/unavailable-dates", async (req, res) => {
  try {
    const { date, doctorId, reason } = req.body;
    await database.addUnavailableDate(date, doctorId, reason);
    res.json({ success: true });
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
    framework: "Node.js + Express + SQLite",
    endpoints: {
      "/api/doctors": "Get doctors list",
      "/api/availability/:doctorId/:date": "Get available time slots",
      "/api/appointments": "Create appointment (POST)",
      "/api/appointments/:id": "Get appointment details",
      "/api/unavailable-dates": "Manage unavailable dates",
    },
  });
});

// Запуск сервера
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/stats`);
  console.log(`🤖 Bot: Integrated in server`);
  console.log(`💾 Database: SQLite (database.sqlite)`);
});

// В конце server.js добавьте:
const { Telegraf } = require("telegraf");

// Инициализация бота
async function initializeBot() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token || token === "your_bot_token_here") {
      console.log("⚠️  TELEGRAM_BOT_TOKEN not set, bot disabled");
      return null;
    }

    const bot = new Telegraf(token);

    // Проверяем бота
    const botInfo = await bot.telegram.getMe();
    console.log(
      `✅ Telegram bot: ${botInfo.first_name} (@${botInfo.username})`
    );

    // Базовые команды
    bot.start((ctx) => {
      ctx.reply("🤖 Бот работает! Используйте /help для списка команд.");
    });

    bot.help((ctx) => {
      ctx.reply(
        "📖 Доступные команды:\n/start - начать\n/help - помощь\n/stats - статистика"
      );
    });

    bot.command("stats", (ctx) => {
      ctx.reply("📊 Статистика: Бот активен и работает!");
    });

    await bot.launch();
    console.log("✅ Telegram bot started successfully");
    return bot;
  } catch (error) {
    console.error("❌ Bot error:", error.message);
    return null;
  }
}

// Запуск бота при старте сервера
let telegramBot = null;
initializeBot().then((bot) => {
  telegramBot = bot;
});

// Обновляем API info endpoint
app.get("/api/info", (req, res) => {
  res.json({
    message: "Telegram Bot Dashboard API",
    version: "1.0.0",
    botStatus: telegramBot ? "online" : "offline",
    website: "working",
    endpoints: ["/api/doctors", "/api/availability", "/api/appointments"],
  });
});
