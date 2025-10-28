const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

// Функция для получения названия дня недели
function getDayName(date) {
  const days = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ];
  return days[date.getDay()];
}

// Функция для получения короткого названия месяца
function getShortMonthName(date) {
  const months = [
    "янв.",
    "фев.",
    "мар.",
    "апр.",
    "мая",
    "июн.",
    "июл.",
    "авг.",
    "сен.",
    "окт.",
    "ноя.",
    "дек.",
  ];
  return months[date.getMonth()];
}

// Форматирование даты для API (YYYY-MM-DD)
function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Получение даты из текста (например: "15 янв.")
function parseDateFromText(dateText, baseDate = new Date()) {
  const [day, monthText] = dateText.split(" ");
  const monthNames = [
    "янв.",
    "фев.",
    "мар.",
    "апр.",
    "мая",
    "июн.",
    "июл.",
    "авг.",
    "сен.",
    "окт.",
    "ноя.",
    "дек.",
  ];
  const monthIndex = monthNames.findIndex((name) => name === monthText);

  if (monthIndex !== -1) {
    const year = baseDate.getFullYear();
    const targetDate = new Date(year, monthIndex, parseInt(day));

    // Если дата в прошлом относительно базовой даты, берем следующий год
    if (targetDate < baseDate) {
      targetDate.setFullYear(year + 1);
    }
    return targetDate;
  }
  return baseDate;
}

let currentDoctorId = null;
let currentSelectedDate = null;

// ДОДЕЛАТЬ ФУНКЦИЮ!
function toggleClinicDropdown() {
  alert("Здесь будет открыт список клиник");
}

// Проверка является ли дата прошедшей
function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Сбрасываем время для сравнения только дат
  return date < today;
}

// Проверка является ли временной слот прошедшим
function isPastTime(date, timeString) {
  const now = new Date();
  const [hours, minutes] = timeString.split(":").map(Number);

  // Создаем дату слота с правильным временем
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);

  return slotDateTime < now;
}

// Обновляем функцию selectDay с проверкой прошедших дат
function selectDay(button, doctorId) {
  // Проверяем, не является ли дата прошедшей
  const dateText = button.querySelector(".date-full").textContent;
  const selectedDate = parseDateFromText(dateText);

  if (isPastDate(selectedDate)) {
    // Не позволяем выбирать прошедшие даты
    return;
  }

  // Убираем выделение со всех кнопок в этом виджете
  const widget = button.closest(".appointment-widget");
  if (widget) {
    widget.querySelectorAll(".day-button").forEach((btn) => {
      btn.classList.remove("selected");
    });
  }

  // Добавляем выделение выбранной кнопке
  button.classList.add("selected");

  // Сохраняем текущего доктора и дату
  currentDoctorId = doctorId;
  currentSelectedDate = selectedDate;
  const formattedDate = formatDateForAPI(currentSelectedDate);

  // Загружаем доступное время для выбранной даты
  updateTimeSlots(formattedDate, doctorId, widget);
}

function openCalendar() {
  alert("Здесь будет открыт полный календарь");
}

// Обновление доступных временных слотов
async function updateTimeSlots(selectedDate, doctorId, widgetElement) {
  let timeGrid;

  if (widgetElement) {
    timeGrid = widgetElement.querySelector(".time-grid");
  } else {
    timeGrid = document.querySelector(".time-grid");
  }

  if (!timeGrid) {
    console.error("Time grid not found");
    return;
  }

  // Показываем индикатор загрузки
  timeGrid.innerHTML = "<p>Загрузка времени...</p>";

  try {
    // Получаем занятые слоты с сервера
    const response = await fetch(
      `/api/availability/${doctorId}/${selectedDate}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const bookedSlots = data.bookedSlots
      ? data.bookedSlots.map((slot) => slot.time)
      : [];

    // Проверяем, является ли выбранная дата сегодняшним днем
    const today = new Date();
    const isToday = selectedDate === formatDateForAPI(today);

    // Генерируем кнопки времени с проверкой занятости и прошедшего времени
    let timeButtons = "";
    const step = 15;
    const breakStart = 12.5; // 12:30
    const breakEnd = 14; // 14:00

    for (let decimalHour = 9; decimalHour <= 17; decimalHour += 0.25) {
      // Пропускаем время перерыва
      if (decimalHour >= breakStart && decimalHour < breakEnd) {
        continue;
      }

      const hours = Math.floor(decimalHour);
      const minutes = (decimalHour % 1) * 60;
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;

      // Проверяем, занят ли слот в БД
      const isBooked = bookedSlots.includes(timeString);

      // Проверяем, не является ли время прошедшим (только для сегодняшнего дня)
      // ИСПРАВЛЕНА СИНТАКСИЧЕСКАЯ ОШИБКА - убрана лишняя запятая
      const isPast =
        isToday && isPastTime(new Date(selectedDate + "T00:00:00"), timeString);

      // Слот недоступен если занят или прошел
      const isDisabled = isBooked || isPast;
      const buttonClass = isDisabled ? "time-button disabled" : "time-button";

      timeButtons += `<button class="${buttonClass}" 
                    ${
                      isDisabled
                        ? "disabled"
                        : `onclick="openBookingForm('${selectedDate}', '${timeString}', ${doctorId})"`
                    }>
                    ${timeString}
                </button>\n`;
    }

    timeGrid.innerHTML = timeButtons;

    if (timeButtons === "") {
      timeGrid.innerHTML = "<p>Нет доступного времени</p>";
    }
  } catch (error) {
    console.error("Ошибка загрузки доступного времени:", error);
    timeGrid.innerHTML = "<p>Ошибка загрузки времени</p>";
  }
}

// Генерация кнопок времени (для инициализации)
function generateTimeButtons(doctorId = 1) {
  let timeButtons = "";
  const step = 15;
  const breakStart = 12.5;
  const breakEnd = 14;

  for (let decimalHour = 9; decimalHour <= 17; decimalHour += 0.25) {
    if (decimalHour >= breakStart && decimalHour < breakEnd) {
      continue;
    }

    const hours = Math.floor(decimalHour);
    const minutes = (decimalHour % 1) * 60;
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
    const formattedDate = formatDateForAPI(today);

    timeButtons += `<button class="time-button" 
            onclick="openBookingForm('${formattedDate}', '${timeString}', ${doctorId})">
            ${timeString}
        </button>\n`;
  }

  return timeButtons;
}

// Функция открытия формы записи
function openBookingForm(date, time, doctorId) {
  // Закрываем предыдущую форму если есть
  closeBookingForm();

  const formHTML = `
        <div class="modal-overlay" id="bookingModal" onclick="handleOverlayClick(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Запись на прием</h2>
                    <button class="close-button" onclick="closeBookingForm()">×</button>
                </div>
                
                <form id="bookingForm" class="booking-form">
                    <input type="hidden" name="doctorId" value="${doctorId}">
                    <input type="hidden" name="date" value="${date}">
                    <input type="hidden" name="time" value="${time}">
                    
                    <div class="appointment-info">
                        <h3>Детали записи</h3>
                        <p><strong>Дата:</strong> ${formatDisplayDate(date)}</p>
                        <p><strong>Время:</strong> ${time}</p>
                    </div>
                    
                    <div class="form-section">
                        <h3>Информация о пациенте</h3>
                        
                        <div class="form-group">
                            <label>ФИО *</label>
                            <input type="text" name="fullName" required placeholder="Иванов Иван Иванович">
                        </div>
                        
                        <div class="form-group">
                            <label>Телефон *</label>
                            <input type="tel" name="phone" required placeholder="+7 (912) 345-67-89">
                        </div>
                        
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" placeholder="example@mail.ru">
                        </div>
                        
                        <div class="form-group">
                            <label>Дата рождения *</label>
                            <input type="date" name="birthDate" required max="${
                              new Date().toISOString().split("T")[0]
                            }">
                        </div>
                        
                        <div class="form-checkbox">
                            <label>
                                <input type="checkbox" name="isMobilePatient" onchange="toggleMobilePatient(this)">
                                Не мобильный пациент (инвалид)
                            </label>
                        </div>
                        
                        <div class="form-checkbox">
                            <label>
                                <input type="checkbox" name="isChild" onchange="toggleParentInfo(this)">
                                Это ребенок
                            </label>
                        </div>
                    </div>
                    
                    <!-- Блок данных родителя -->
                    <div class="form-section" id="parentInfoSection" style="display: none;">
                        <h3>Данные родителя/законного представителя</h3>
                        
                        <div class="form-group">
                            <label>ФИО родителя *</label>
                            <input type="text" name="parentFullName" placeholder="Петрова Мария Сергеевна">
                        </div>
                        
                        <div class="form-group">
                            <label>Телефон родителя *</label>
                            <input type="tel" name="parentPhone" placeholder="+7 (912) 345-67-89">
                        </div>
                        
                        <div class="form-group">
                            <label>Email родителя</label>
                            <input type="email" name="parentEmail" placeholder="parent@mail.ru">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="closeBookingForm()">Отмена</button>
                        <button type="submit" class="btn-submit">Записаться</button>
                    </div>
                </form>
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", formHTML);

  // Обработка формы
  document
    .getElementById("bookingForm")
    .addEventListener("submit", handleBookingSubmit);

  // Обработчик клавиши Escape
  document.addEventListener("keydown", handleEscapeKey);
}

// Форматирование даты для отображения
function formatDisplayDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  const day = date.getDate();
  const month = getShortMonthName(date);
  const year = date.getFullYear();
  const dayName = getDayName(date);
  return `${day} ${month} ${year} (${dayName})`;
}

// Переключение блока данных родителя
function toggleParentInfo(checkbox) {
  const parentSection = document.getElementById("parentInfoSection");
  const parentInputs = parentSection.querySelectorAll('input[name^="parent"]');

  if (checkbox.checked) {
    parentSection.style.display = "block";
    parentInputs.forEach((input) => {
      if (input.name === "parentFullName" || input.name === "parentPhone") {
        input.required = true;
      }
    });
  } else {
    parentSection.style.display = "none";
    parentInputs.forEach((input) => (input.required = false));
  }
}

// Переключение мобильного пациента (можно добавить дополнительную логику)
function toggleMobilePatient(checkbox) {
  // Здесь можно добавить дополнительную логику для мобильных пациентов
  console.log("Мобильный пациент:", checkbox.checked);
}

// Обработчик клика по overlay
function handleOverlayClick(event) {
  // Закрываем окно только если кликнули именно на overlay (не на content)
  if (event.target.id === "bookingModal") {
    closeBookingForm();
  }
}

// Обработчик клавиши Escape
function handleEscapeKey(event) {
  if (event.key === "Escape") {
    closeBookingForm();
  }
}

// Функция закрытия формы
function closeBookingForm() {
  const modal = document.getElementById("bookingModal");
  if (modal) {
    modal.remove();
    // Удаляем обработчик клавиши Escape
    document.removeEventListener("keydown", handleEscapeKey);
  }
}

// Обработчик отправки формы
async function handleBookingSubmit(event) {
  event.preventDefault();

  const submitButton = event.target.querySelector(".btn-submit");
  const originalText = submitButton.textContent;
  submitButton.textContent = "Запись...";
  submitButton.disabled = true;

  try {
    const formData = new FormData(event.target);
    const bookingData = {
      doctorId: parseInt(formData.get("doctorId")),
      date: formData.get("date"),
      time: formData.get("time"),
      patient: {
        fullName: formData.get("fullName").trim(),
        phone: formData.get("phone").trim(),
        email: formData.get("email").trim() || null,
        birthDate: formData.get("birthDate"),
        isMobilePatient: formData.get("isMobilePatient") === "on",
        isChild: formData.get("isChild") === "on",
      },
      parentInfo:
        formData.get("isChild") === "on"
          ? {
              fullName: formData.get("parentFullName").trim(),
              phone: formData.get("parentPhone").trim(),
              email: formData.get("parentEmail").trim() || null,
            }
          : null,
    };

    // Валидация телефона
    if (!isValidPhone(bookingData.patient.phone)) {
      throw new Error("Введите корректный номер телефона");
    }

    // Валидация email если указан
    if (bookingData.patient.email && !isValidEmail(bookingData.patient.email)) {
      throw new Error("Введите корректный email");
    }

    const result = await saveAppointment(bookingData);

    if (result.success) {
      console.log("Запись успешно создана!");
      console.log(bookingData);

      // Закрываем форму
      closeBookingForm();

      // ПРОСТАЯ ПЕРЕЗАГРУЗКА СТРАНИЦЫ ПОСЛЕ УСПЕШНОЙ ЗАПИСИ
      // alert("Запись успешно создана! Страница будет перезагружена.");
      // location.reload();
      setTimeout(() => {
        location.reload();
      }, 1500); // Перезагрузка через 1.5 секунды
    } else {
      console.log("Ошибка при создании записи");
      console.log(result.error);
      throw new Error(result.error || "Ошибка при создании записи");
    }
  } catch (error) {
    alert("Ошибка: " + error.message);
  } finally {
    submitButton.textContent = originalText;
    submitButton.disabled = false;
  }
}

// Валидация телефона
function isValidPhone(phone) {
  const phoneRegex =
    /^(\+7|8)[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// Валидация email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Сохранение записи через API
async function saveAppointment(bookingData) {
  try {
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error("Ошибка сети: " + error.message);
  }
}

// Инициализация календаря при загрузке
// Обновляем инициализацию для правильной работы с несколькими врачами
document.addEventListener("DOMContentLoaded", function () {
  // Ждем немного чтобы все виджеты успели отрендериться
  setTimeout(() => {
    document.querySelectorAll(".appointment-widget").forEach((widget) => {
      // Выбираем первую доступную (не прошедшую) дату
      const firstAvailableDay = widget.querySelector(
        ".day-button:not(.disabled)"
      );
      if (firstAvailableDay) {
        const doctorId = widget.dataset.doctorId;
        selectDay(firstAvailableDay, doctorId);
      } else {
        // Если все даты прошедшие, показываем сообщение
        const timeGrid = widget.querySelector(".time-grid");
        if (timeGrid) {
          timeGrid.innerHTML = "<p>Нет доступных дат для записи</p>";
        }
      }
    });
  }, 100);
});

// Генерация HTML календаря для доктора
function generateCalendarHTML(doctorId) {
  // Проверяем, какие даты являются прошедшими
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

  const isTodayPast = isPastDate(today);
  const isTomorrowPast = isPastDate(tomorrow);
  const isDayAfterTomorrowPast = isPastDate(dayAfterTomorrow);

  // Определяем, какая дата должна быть выбрана по умолчанию (первая доступная)
  let defaultSelectedDate = null;
  if (!isTodayPast) {
    defaultSelectedDate = today;
  } else if (!isTomorrowPast) {
    defaultSelectedDate = tomorrow;
  } else if (!isDayAfterTomorrowPast) {
    defaultSelectedDate = dayAfterTomorrow;
  }

  return `
    <div class="appointment-widget" data-doctor-id="${doctorId}">
        <button class="dropdown-button">
            <div class="clinic-info">
                <div class="clinic-name">12 каб "Шаги к здоровью"</div>
                <div class="clinic-address">155900, Ивановская область, г. Шуя площадь Фрунзе дом 6 Бизнес-центр</div>
            </div>
        </button>

        <div class="address-info">
            <a href="https://yandex.ru/maps/-/CLRyAT22"
               target="_blank" class="map-link">На карте</a>
        </div>

        <!-- Выбор дня -->
        <div class="day-grid">
            <button class="day-button ${
              !isTodayPast && defaultSelectedDate?.getDate() === today.getDate()
                ? "selected"
                : ""
            } ${isTodayPast ? "disabled" : ""}" 
                ${
                  isTodayPast
                    ? "disabled"
                    : `onclick="selectDay(this, ${doctorId})"`
                }>
                <time class="day-name">${getDayName(today)}</time>
                <time class="date-full">${today.getDate()} ${getShortMonthName(
    today
  )}</time>
            </button>
            <button class="day-button ${
              !isTomorrowPast &&
              defaultSelectedDate?.getDate() === tomorrow.getDate()
                ? "selected"
                : ""
            } ${isTomorrowPast ? "disabled" : ""}" 
                ${
                  isTomorrowPast
                    ? "disabled"
                    : `onclick="selectDay(this, ${doctorId})"`
                }>
                <time class="day-name">${getDayName(tomorrow)}</time>
                <time class="date-full">${tomorrow.getDate()} ${getShortMonthName(
    tomorrow
  )}</time>
            </button>
            <button class="day-button ${
              !isDayAfterTomorrowPast &&
              defaultSelectedDate?.getDate() === dayAfterTomorrow.getDate()
                ? "selected"
                : ""
            } ${isDayAfterTomorrowPast ? "disabled" : ""}" 
                ${
                  isDayAfterTomorrowPast
                    ? "disabled"
                    : `onclick="selectDay(this, ${doctorId})"`
                }>
                <time class="day-name">${getDayName(dayAfterTomorrow)}</time>
                <time class="date-full">${dayAfterTomorrow.getDate()} ${getShortMonthName(
    dayAfterTomorrow
  )}</time>
            </button>
            <button class="calendar-button" onclick="openCalendar()">
                <svg class="calendar-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2.90917 15H13.091C13.5973 15 14.0829 14.7988 14.4409 14.4408C14.7989 14.0828 15.0001 13.5972 15.0001 13.0909V4.18178C15.0001 3.67545 14.7989 3.18987 14.4409 2.83185C14.0829 2.47382 13.5973 2.27269 13.091 2.27269H12.4546V1.63632C12.4546 1.46755 12.3876 1.30569 12.2682 1.18635C12.1489 1.067 11.987 0.999959 11.8183 0.999959C11.6495 0.999959 11.4876 1.067 11.3683 1.18635C11.2489 1.30569 11.1819 1.46755 11.1819 1.63632V2.27269H4.81827V1.63632C4.81827 1.46755 4.75122 1.30569 4.63188 1.18635C4.51254 1.067 4.35068 0.999959 4.1819 0.999959C4.01313 0.999959 3.85127 1.067 3.73193 1.18635C3.61258 1.30569 3.54554 1.46755 3.54554 1.63632V2.27269H2.90917C2.40285 2.27269 1.91727 2.47382 1.55924 2.83185C1.20122 3.18987 1.00008 3.67545 1.00008 4.18178V13.0909C1.00008 13.5972 1.20122 14.0828 1.55924 14.4408C1.91727 14.7988 2.40285 15 2.90917 15ZM13.091 13.7272H2.90917C2.7404 13.7272 2.57854 13.6602 2.4592 13.5408C2.33986 13.4215 2.27281 13.2596 2.27281 13.0909V7.3636H13.7274V13.0909C13.7274 13.2596 13.6603 13.4215 13.541 13.5408C13.4216 13.6602 13.2598 13.7272 13.091 13.7272ZM2.90917 3.54541H3.54554V4.18178C3.54554 4.35055 3.61258 4.51241 3.73193 4.63175C3.85127 4.7511 4.01313 4.81814 4.1819 4.81814C4.35068 4.81814 4.51254 4.7511 4.63188 4.63175C4.75122 4.51241 4.81827 4.35055 4.81827 4.18178V3.54541H11.1819V4.18178C11.1819 4.35055 11.2489 4.51241 11.3683 4.63175C11.4876 4.7511 11.6495 4.81814 11.8183 4.81814C11.987 4.81814 12.1489 4.7511 12.2682 4.63175C12.3876 4.51241 12.4546 4.35055 12.4546 4.18178V3.54541H13.091C13.2598 3.54541 13.4216 3.61246 13.541 3.7318C13.6603 3.85114 13.7274 4.013 13.7274 4.18178V6.09087H2.27281V4.18178C2.27281 4.013 2.33986 3.85114 2.4592 3.7318C2.57854 3.61246 2.7404 3.54541 2.90917 3.54541Z"/>
                </svg>
            </button>
        </div>

        <!-- Выбор времени -->
        <div class="time-grid" id="timeGrid-${doctorId}">
            <!-- Время будет загружено после выбора дня -->
        </div>
    </div>`;
}
