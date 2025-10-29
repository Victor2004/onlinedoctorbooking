// Команда для запуска:
// pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "Online doctor booking",
      script: "server.js",
      instances: "max", // Использовать все ядра CPU
      exec_mode: "cluster",
      autorestart: true, // Автоперезапуск при падении
      watch: true, // Следить за изменениями файлов (включите для разработки)
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
