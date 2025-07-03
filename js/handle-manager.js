function trackHandle() {
  const handle = document.getElementById("handleInput").value.trim();
  if (handle) {
    window.location.href = `dashboard.html?handle=${handle}`;
  }
}

document
  .getElementById("handleInput")
  .addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      trackHandle();
    }
  });

const error = localStorage.getItem("error");
if (error) {
  const popup = document.getElementById("popup");
  popup.textContent = error;
  popup.classList.remove("hidden");
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
    popup.classList.add("hidden");
    localStorage.removeItem("error");
  }, 4000);
}
