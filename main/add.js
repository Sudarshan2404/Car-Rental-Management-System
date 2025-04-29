const add = document.querySelector("#submit");

function updateFileName(input) {
  const fileName = input.files.length > 0 ? input.files[0].name : "Upload";
  document.getElementById("file-name").textContent = fileName;
}

add.addEventListener("click", () => {
  alert("New car added Sucessfully");
});
