const fs = require("fs");
const database = require("./database");

async function migrateFromJSON() {
  // Очищаем базу данных перед началом миграции
  await database.init();

  // Удаляем все существующие данные
  await database.db.run("DELETE FROM appointments");
  await database.db.run("DELETE FROM doctors");

  // Сбрасываем автоинкрементные счетчики (для SQLite)
  await database.db.run("DELETE FROM sqlite_sequence WHERE name='doctors'");
  await database.db.run(
    "DELETE FROM sqlite_sequence WHERE name='appointments'"
  );

  // Миграция докторов
  const doctorsData = JSON.parse(fs.readFileSync("public/data/doctors.json"));
  for (const doctor of doctorsData) {
    await database.db.run(
      "INSERT OR IGNORE INTO doctors (name, specialty, avatar) VALUES (?, ?, ?)",
      [doctor.name, doctor.specialty, doctor.avatar]
    );
  }

  // Миграция записей (если есть)
  if (fs.existsSync("public/data/appointments.json")) {
    const appointmentsData = JSON.parse(
      fs.readFileSync("public/data/appointments.json")
    );
    for (const appointment of appointmentsData.appointments) {
      await database.createAppointment(appointment);
    }
  }

  console.log("✅ Migration completed");
}

migrateFromJSON();
