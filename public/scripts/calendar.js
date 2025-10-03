const today = new Date(); // Сегодня
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Завтра
const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000); // Послезавтра

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

function toggleClinicDropdown() {
  alert("Здесь будет открыт список клиник");
}

function selectDay(button) {
  // Убираем выделение со всех кнопок
  document.querySelectorAll(".day-button").forEach((btn) => {
    btn.classList.remove("selected");
  });
  // Добавляем выделение выбранной кнопке
  button.classList.add("selected");

  // Здесь можно добавить загрузку доступного времени для выбранной даты
  updateTimeSlots(button.querySelector(".date-full").textContent);
}

function openCalendar() {
  alert("Здесь будет открыт полный календарь");
}

function updateTimeSlots(selectedDate) {
  console.log("Загрузка времени для даты:", selectedDate);
  // Здесь будет логика обновления доступного времени
}

// Инициализация
document.addEventListener("DOMContentLoaded", function () {
  // Автоматически выбираем первый доступный день
  const firstAvailableDay = document.querySelector(
    ".day-button:not(.disabled)"
  );
  if (firstAvailableDay) {
    firstAvailableDay.classList.add("selected");
  }
});

function generateTimeButtons() {
  let timeButtons = "";
  const step = 15; // 15 минут шаг

  // Перерыв: с 12:30 до 14:00
  const breakStart = 12.6; // 12:30 в десятичном формате
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

    timeButtons += `<a href="/ticket/profiles?time=${timeString}" class="time-button">${timeString}</a>\n`;
  }

  return timeButtons;
}

const calendarHTML = `<div class="appointment-widget">
        <!-- Выбор клиники -->
        <button class="dropdown-button" onclick="toggleClinicDropdown()">
            <div class="clinic-info">
                <div class="clinic-name">НЕБОЛИТ на Ленинском проспекте</div>
                <div class="clinic-address">пр-кт Ленинский, д.66</div>
            </div>
            <svg class="dropdown-arrow" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M5.01771 6.86347L8.43025 3.69806C8.7945 3.36018 9.37137 3.36594 9.72832 3.71103C10.0959 4.06634 10.0897 4.64424 9.71463 4.99214L5.66304 8.75033C5.30415 9.08322 4.73887 9.08253 4.38089 8.7524C4.37749 8.74936 4.3741 8.74629 4.37073 8.7432L0.288397 4.99086C-0.0894586 4.64355 -0.0970255 4.06347 0.271649 3.70706C0.627404 3.36314 1.20192 3.35613 1.56654 3.69127L5.01771 6.86347Z" fill="#9B9B9B"/>
            </svg>
        </button>

        <!-- Информация о клинике -->
        <div class="address-info">
            <div class="metro-stations">
                <div class="metro-station">Университет</div>
                <div class="metro-station">Октябрьская</div>
            </div>
            <a href="https://www.google.com/maps/dir/?api=1&destination=55.6905518,37.5482292" 
               target="_blank" class="map-link">На карте</a>
        </div>

        <!-- Выбор дня -->
        <div class="day-grid">
            <button class="day-button selected" onclick="selectDay(this)">
                <time class="day-name">${getDayName(today)}</time>
                <time class="date-full">${today.getDate()} ${getShortMonthName(
  today
)}</time>
            </button>
            <button class="day-button selected" onclick="selectDay(this)>
                <time class="day-name">${getDayName(tomorrow)}</time>
                <time class="date-full">${tomorrow.getDate()} ${getShortMonthName(
  tomorrow
)}</time>
            </button>
            <button class="day-button disabled">
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
        <div class="time-grid">
            ${generateTimeButtons()}
        </div>
    </div>`;
