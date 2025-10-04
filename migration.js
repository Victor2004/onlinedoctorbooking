const fs = require("fs");
const database = require("./database");

async function migrateFromJSON() {
  await database.init();

  // Миграция докторов
  const doctorsData = JSON.parse(fs.readFileSync("data/doctors.json"));
  for (const doctor of doctorsData) {
    await database.db.run(
      "INSERT OR IGNORE INTO doctors (name, specialty, avatar) VALUES (?, ?, ?)",
      [doctor.name, doctor.specialty, doctor.avatar]
    );
  }

  // Миграция записей (если есть)
  if (fs.existsSync("data/appointments.json")) {
    const appointmentsData = JSON.parse(
      fs.readFileSync("data/appointments.json")
    );
    for (const appointment of appointmentsData.appointments) {
      await database.createAppointment(appointment);
    }
  }

  console.log("✅ Migration completed");
}

migrateFromJSON();
