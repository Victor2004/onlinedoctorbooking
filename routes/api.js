// Уточнить что делает. Вроде программа только для тестирования telegram бота 

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const axios = require("axios");

// Получить всех пользователей
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении пользователей" });
  }
});

// Получить пользователя по ID
router.get("/users/:telegramId", async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении пользователя" });
  }
});

// Отправить сообщение пользователю через бота
router.post("/send-message", async (req, res) => {
  try {
    const { telegramId, message } = req.body;

    if (!telegramId || !message) {
      return res
        .status(400)
        .json({ error: "telegramId и message обязательны" });
    }

    // Отправляем сообщение через Telegram Bot API
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: telegramId,
        text: `📢 Сообщение от администратора:\n\n${message}`,
        parse_mode: "HTML",
      }
    );

    res.json({ success: true, message: "Сообщение отправлено" });
  } catch (error) {
    console.error("Error sending message:", error.response?.data);
    res.status(500).json({ error: "Ошибка при отправке сообщения" });
  }
});

// Статистика бота
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today },
    });

    res.json({
      totalUsers,
      newUsersToday,
      serverTime: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении статистики" });
  }
});

module.exports = router;
