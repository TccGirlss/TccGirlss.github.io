window.showCycleAlert = function (title, message) {
  const alertBox = document.createElement("div");
  alertBox.className = "cycle-alert";

  alertBox.innerHTML = `
    <div class="cycle-alert-content">
      <h3>${title}</h3>
      <p>${message}</p>
      <button class="alert-btn" id="alertSaibaMais">Saiba mais</button>
      <span class="alert-close">&times;</span>
    </div>
  `;

  document.body.appendChild(alertBox);

  alertBox.querySelector(".alert-close").onclick = () => fadeOut(alertBox);

  alertBox.querySelector("#alertSaibaMais").onclick = () => {
    window.location.href = "/html/periodos.html";
  };

  setTimeout(() => alertBox.classList.add("show"), 10);

  setTimeout(() => fadeOut(alertBox), 6000);

  function fadeOut(el) {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 500);
  }
};
