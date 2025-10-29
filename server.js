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

// Создаем структуру данных для бота
const botData = {
  users: new Map(),
  messages: [],
  botStatus: "offline",
  startTime: new Date(),
  stats: {
    totalUsers: 0,
    totalMessages: 0,
    usersToday: 0,
  },
};

// Запускаем бота из отдельного файла
const startBot = require("./bot/bot.js");
const telegramBot = startBot(botData);

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

// API для проверки недоступности даты
app.get("/api/date-unavailable/:doctorId/:date", async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const isUnavailable = await database.isDateUnavailable(
      parseInt(doctorId),
      date
    );
    res.json({ isUnavailable });
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

    // Получаем информацию о докторе для уведомления
    const doctors = await database.getDoctors();
    const doctor = doctors.find((d) => d.id === bookingData.doctorId);

    // Формируем данные для уведомления
    const appointmentNotificationData = {
      doctor: {
        name: doctor.name,
        specialty: doctor.specialty,
      },
      date: bookingData.date,
      time: bookingData.time,
      patient: bookingData.patient,
      parentInfo: bookingData.parentInfo,
      appointmentId: appointmentId,
    };

    // Отправляем уведомление в Telegram группу
    try {
      if (telegramBot && telegramBot.sendAppointmentNotification) {
        await telegramBot.sendAppointmentNotification(
          appointmentNotificationData
        );
      }
    } catch (telegramError) {
      console.error("Ошибка отправки уведомления в Telegram:", telegramError);
      // Не прерываем выполнение если не удалось отправить в Telegram
    }

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
