const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static(path.join(__dirname, "public")));

// Подключение к MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/telegram_bot",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Модели
const User = require("./models/User");

// Маршруты API
app.use("/api", require("./routes/api"));

// Запуск Telegram бота
const bot = require("./bot/bot");

// HTML маршруты
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// app.get("/admin", (req, res) => {
//   res.sendFile(path.join(__dirname, "views", "admin.html"));
// });

// app.get("/users", (req, res) => {
//   res.sendFile(path.join(__dirname, "views", "users.html"));
// });

// API маршрут для главной страницы (если нужен JSON)
app.get("/api/info", (req, res) => {
  res.json({
    message: "Telegram Bot Backend is running!",
    version: "1.0.0",
    endpoints: ["/api/users", "/api/stats", "/api/send-message"],
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Website: http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
