// database.js
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    try {
      this.db = await open({
        filename: path.join(__dirname, "database.sqlite"),
        driver: sqlite3.Database,
      });

      await this.createTables();
      // await this.insertSampleData();
      console.log("✅ SQLite database initialized");
    } catch (error) {
      console.error("❌ Database initialization error:", error);
    }
  }

  async createTables() {
    // Таблица докторов
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS doctors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                specialty TEXT NOT NULL,
                avatar TEXT
            )
        `);

    // Таблица записей
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doctor_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                patient_name TEXT NOT NULL,
                patient_phone TEXT NOT NULL,
                patient_email TEXT,
                patient_birthdate TEXT,
                is_mobile_patient BOOLEAN DEFAULT 0,
                is_child BOOLEAN DEFAULT 0,
                parent_name TEXT,
                parent_phone TEXT,
                status TEXT DEFAULT 'confirmed',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doctor_id) REFERENCES doctors (id)
            )
        `);

    // Таблица недоступных дат
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS unavailable_dates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                doctor_id INTEGER,
                reason TEXT,
                FOREIGN KEY (doctor_id) REFERENCES doctors (id)
            )
        `);

    // Индексы для быстрого поиска
    await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_appointments_date_time 
            ON appointments(date, time, doctor_id)
        `);

    await this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_appointments_doctor 
            ON appointments(doctor_id)
        `);
  }

  // async insertSampleData() {
  //   // Проверяем, есть ли уже доктора
  //   const doctorsCount = await this.db.get(
  //     "SELECT COUNT(*) as count FROM doctors"
  //   );

  //   if (doctorsCount.count === 0) {
  //     // Добавляем тестовых докторов
  //     await this.db.run(
  //       `
  //               INSERT INTO doctors (name, specialty, avatar)
  //               VALUES (?, ?, ?)
  //           `,
  //       ["Иванов Иван Иванович", "Кардиолог", "doctor1.jpg"]
  //     );

  //     await this.db.run(
  //       `
  //               INSERT INTO doctors (name, specialty, avatar)
  //               VALUES (?, ?, ?)
  //           `,
  //       ["Петрова Мария Сергеевна", "Невролог", "doctor2.jpg"]
  //     );

  //     console.log("✅ Sample doctors added");
  //   }

  //   // Добавляем несколько недоступных дат для теста
  //   const tomorrow = new Date();
  //   tomorrow.setDate(tomorrow.getDate() + 1);
  //   const formattedTomorrow = tomorrow.toISOString().split("T")[0];

  //   await this.db.run(
  //     `
  //           INSERT OR IGNORE INTO unavailable_dates (date, doctor_id, reason)
  //           VALUES (?, ?, ?)
  //       `,
  //     [formattedTomorrow, 1, "Выходной"]
  //   );

  //   console.log("✅ Sample unavailable dates added");
  // }

  // Проверка доступности времени
  async isTimeSlotAvailable(doctorId, date, time) {
    try {
      // Проверяем недоступные даты
      const unavailable = await this.db.get(
        `
                SELECT 1 FROM unavailable_dates 
                WHERE date = ? AND (doctor_id IS NULL OR doctor_id = ?)
            `,
        [date, doctorId]
      );

      if (unavailable) {
        return false;
      }

      // Проверяем занятые слоты
      const booked = await this.db.get(
        `
                SELECT 1 FROM appointments 
                WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'cancelled'
            `,
        [doctorId, date, time]
      );

      return !booked;
    } catch (error) {
      console.error("Error checking time slot availability:", error);
      return false;
    }
  }

  async isDateUnavailable(doctorId, date) {
    try {
      // Проверяем недоступные даты
      const unavailable = await this.db.get(
        `
              SELECT 1 FROM unavailable_dates 
              WHERE date = ? AND (doctor_id IS NULL OR doctor_id = ?)
          `,
        [date, doctorId]
      );

      return !!unavailable;
    } catch (error) {
      console.error("Error checking date availability:", error);
      return false;
    }
  }

  // Создание записи
  async createAppointment(bookingData) {
    try {
      const result = await this.db.run(
        `
                INSERT INTO appointments (
                    doctor_id, date, time, patient_name, patient_phone, patient_email,
                    patient_birthdate, is_mobile_patient, is_child, parent_name, parent_phone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        [
          bookingData.doctorId,
          bookingData.date,
          bookingData.time,
          bookingData.patient.fullName,
          bookingData.patient.phone,
          bookingData.patient.email || null,
          bookingData.patient.birthDate,
          bookingData.patient.isMobilePatient ? 1 : 0,
          bookingData.patient.isChild ? 1 : 0,
          bookingData.parentInfo?.fullName || null,
          bookingData.parentInfo?.phone || null,
        ]
      );

      return result.lastID;
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  }

  // Получение занятых слотов для доктора на дату
  async getBookedSlots(doctorId, date) {
    try {
      return await this.db.all(
        `
                SELECT time FROM appointments 
                WHERE doctor_id = ? AND date = ? AND status != 'cancelled'
            `,
        [doctorId, date]
      );
    } catch (error) {
      console.error("Error getting booked slots:", error);
      return [];
    }
  }

  // Получение всех докторов
  async getDoctors() {
    try {
      return await this.db.all("SELECT * FROM doctors");
    } catch (error) {
      console.error("Error getting doctors:", error);
      return [];
    }
  }

  // Получение записи по ID
  async getAppointment(id) {
    try {
      return await this.db.get("SELECT * FROM appointments WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error getting appointment:", error);
      return null;
    }
  }

  // Добавление недоступной даты
  async addUnavailableDate(date, doctorId = null, reason = "") {
    try {
      await this.db.run(
        `
                INSERT INTO unavailable_dates (date, doctor_id, reason)
                VALUES (?, ?, ?)
            `,
        [date, doctorId, reason]
      );
    } catch (error) {
      console.error("Error adding unavailable date:", error);
      throw error;
    }
  }

  // Получение недоступных дат
  async getUnavailableDates(doctorId = null) {
    try {
      if (doctorId) {
        return await this.db.all(
          `
                    SELECT * FROM unavailable_dates 
                    WHERE doctor_id IS NULL OR doctor_id = ?
                `,
          [doctorId]
        );
      } else {
        return await this.db.all("SELECT * FROM unavailable_dates");
      }
    } catch (error) {
      console.error("Error getting unavailable dates:", error);
      return [];
    }
  }
}

module.exports = new Database();
