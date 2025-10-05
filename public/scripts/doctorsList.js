// Загрузка данных докторов из файла
fetch("data/doctors.json")
  .then((response) => response.json())
  .then((data) => {
    doctorsMain(data);
  })
  .catch((error) => {
    console.error("Ошибка загрузки данных:", error);
  });

function doctorsMain(doctors) {
  // Элементы DOM
  const listDoctors = document.querySelector(".list-doctors");

  // Функция для отображения списка докторов
  function showAllDoctors() {
    listDoctors.innerHTML = "";

    doctors.forEach((doctor) => {
      const doctorHTML = `
      <article class="padding-line">
        <div class="doctor">
          <div class="doctor-card">
            <img class="avatar" src="media/doctors/${doctor.avatar}" alt="${
        doctor.name
      }" />
            <div class="doctor-info">
              <h2 class="doctor-name">${doctor.name}</h2>
              <p class="specialty">${doctor.specialty}</p>
            </div>
          </div>
          ${generateCalendarHTML(doctor.id)}
        </div>
      </article>`;

      listDoctors.innerHTML += doctorHTML;
    });
  }

  // Вызываем функцию отображения
  showAllDoctors();
}
