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
  const listDoctors = document.querySelector(".list-doctors");
  listDoctors.innerHTML = "";

  doctors.forEach((doctor) => {
    const doctorHTML = `
        <article class="padding-line">
            <div class="doctor">
                <div class="doctor-card">
                    <img class="avatar" src="media/doctors/${
                      doctor.avatar
                    }" alt="${doctor.name}" />
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

  // После добавления всех врачей инициализируем календари
  setTimeout(() => {
    document.querySelectorAll(".appointment-widget").forEach((widget) => {
      const firstAvailableDay = widget.querySelector(
        ".day-button:not(.disabled)"
      );
      if (firstAvailableDay) {
        const doctorId = widget.dataset.doctorId;
        selectDay(firstAvailableDay, doctorId);
      }
    });
  }, 100);
}
