// Загрузка данных докторов из файла
fetch("data/doctors.json")
  .then((response) => response.json())
  .then((data) => {
    doctorsMain(data);
  })
  .catch((error) => {
    console.error("Ошибка загрузки данных:", error);
  });

// Обновляем doctorsList.js
function doctorsMain(doctors) {
  const listDoctors = document.querySelector(".list-doctors");

  // Делаем функцию асинхронной
  async function showAllDoctors() {
    listDoctors.innerHTML = "";

    // Используем for...of для асинхронной обработки
    for (const doctor of doctors) {
      // Генерируем календарь для каждого доктора (теперь асинхронно)
      const calendarHTML = await generateCalendarHTML(doctor.id);

      const doctorHTML = `
      <article class="padding-line">
        <div class="doctor">
          <div class="doctor-card">
            <img class="avatar" src="media/doctors/${doctor.avatar}" alt="${doctor.name}" />
            <div class="doctor-info">
              <h2 class="doctor-name">${doctor.name}</h2>
              <p class="specialty">${doctor.specialty}</p>
            </div>
          </div>
          ${calendarHTML}
        </div>
      </article>`;

      listDoctors.innerHTML += doctorHTML;
    }

    // После рендеринга всех календарей инициализируем выбор дат
    setTimeout(() => {
      document.querySelectorAll(".appointment-widget").forEach((widget) => {
        const firstAvailableDay = widget.querySelector(
          ".day-button:not(.disabled)"
        );
        if (firstAvailableDay) {
          const doctorId = widget.dataset.doctorId;
          selectDay(firstAvailableDay, doctorId);
        } else {
          // Если все даты прошедшие или недоступные, показываем сообщение
          const timeGrid = widget.querySelector(".time-grid");
          if (timeGrid) {
            timeGrid.innerHTML = "<p>Нет доступных дат для записи</p>";
          }
        }
      });
    }, 100);
  }

  // Вызываем асинхронную функцию
  showAllDoctors();
}
