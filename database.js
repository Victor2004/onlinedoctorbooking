const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    await this.createTables();
    console.log("✅ SQLite database initialized");
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

  // Проверка доступности времени
  async isTimeSlotAvailable(doctorId, date, time) {
    const unavailable = await this.db.get(
      `
            SELECT 1 FROM unavailable_dates 
            WHERE date = ? AND (doctor_id IS NULL OR doctor_id = ?)
        `,
      [date, doctorId]
    );

    if (unavailable) return false;

    const booked = await this.db.get(
      `
            SELECT 1 FROM appointments 
            WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'cancelled'
        `,
      [doctorId, date, time]
    );

    return !booked;
  }

  // Создание записи
  async createAppointment(bookingData) {
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
        bookingData.patient.email,
        bookingData.patient.birthDate,
        bookingData.patient.isMobilePatient ? 1 : 0,
        bookingData.patient.isChild ? 1 : 0,
        bookingData.parentInfo?.fullName || null,
        bookingData.parentInfo?.phone || null,
      ]
    );

    return result.lastID;
  }

  // Получение занятых слотов для доктора на дату
  async getBookedSlots(doctorId, date) {
    return await this.db.all(
      `
            SELECT time FROM appointments 
            WHERE doctor_id = ? AND date = ? AND status != 'cancelled'
        `,
      [doctorId, date]
    );
  }

  // Добавление недоступной даты
  async addUnavailableDate(date, doctorId = null, reason = "") {
    await this.db.run(
      `
            INSERT INTO unavailable_dates (date, doctor_id, reason)
            VALUES (?, ?, ?)
        `,
      [date, doctorId, reason]
    );
  }
}

module.exports = new Database();
