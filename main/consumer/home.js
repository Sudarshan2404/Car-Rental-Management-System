const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".menu-items");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});
