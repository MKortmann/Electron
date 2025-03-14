const form = document.querySelector("#img-form");
const img = document.querySelector("#select-image-btn");
const outputPath = document.querySelector("#output-path");
const filename = document.querySelector("#filename");
const inputFolder = document.querySelector("#input-folder");
const heightInput = document.querySelector("#height");
const widthInput = document.querySelector("#width");
const btnChangeDir = document.querySelector("#btn-change-dir");

let currentOutputPath = path.join(os.homedir(), "image-resizer");
let currentInputPath = path.join(os.homedir(), "image-resizer");
inputFolder.innerHTML = currentInputPath;
let selectedFile = null;

// function loadImage(e) {
//   const file = e.target.files[0];

//   if (!isFileImage(file)) {
//     console.log("Please select an image file");
//     return;
//   } else {
//     alertSucess("Image selected!");
//   }

//   filename.innerText = file.name;
//   outputPath.innerText = currentOutputPath;

//   if (img.files[0]) {
//     filename.innerText = img.files[0].name;
//     form.classList.remove("hidden");
//   }
// }

function sendImage(e) {
  e.preventDefault();
  debugger;

  if (!selectedFile) {
    alertError("Please upload an image file");
    return;
  }

  if (!heightInput.value || !widthInput.value) {
    alertError("Please enter the height and width");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    console.log("Sending image to main process: ", selectedFile);
    ipcRenderer.send("image:resize", {
      fileName: selectedFile.split("\\").pop(),
      fileData: reader.result,
      outputPath: currentOutputPath,
      width: widthInput.value,
      height: heightInput.value,
    });
  };
  fetch(`file://${selectedFile}`)
    .then((response) => response.blob())
    .then((blob) => {
      reader.readAsArrayBuffer(blob); // Read as ArrayBuffer for binary data
    })
    .catch((err) => {
      alertError("Failed to load image file: " + err.message);
    });
}

function isFileImage(file) {
  const image = new Image();
  image.src = URL.createObjectURL(file);

  image.onload = () => {
    console.log(image.width, image.height);
    widthInput.value = image.width;
    heightInput.value = image.height;
  };

  const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];
  return file && acceptedImageTypes.includes(file["type"]);
}

// img.addEventListener("change", loadImage);

img.addEventListener("click", () => {
  ipcRenderer.send("select:image");
});

ipcRenderer.on("image:selected", (filePath) => {
  console.log("Selected file:", filePath);
  selectedFile = filePath;

  const fileName = filePath.split("\\").pop();

  filename.innerText = fileName;
  inputFolder.innerText = filePath;

  const image = new Image();
  image.src = `file://${filePath}`;
  image.onload = () => {
    console.log(`Width: ${image.width}, Height: ${image.height}`);
    widthInput.value = image.width;
    heightInput.value = image.height;
  };

  // Unhide the form
  form.classList.remove("hidden");
  currentInputPath = filePath;
});

const alertError = (msg) => {
  Toastify.toast({
    text: msg,
    duration: 5000,
    close: false,
    gravity: "top",
    position: "center",
    backgroundColor: "#ff0000",
    color: "white",
  });
};

const alertSucess = (msg) => {
  Toastify.toast({
    text: msg,
    duration: 7000,
    close: false,
    gravity: "top",
    position: "center",
    backgroundColor: "#00ff00",
    color: "white",
  });
};

ipcRenderer.on("image:done", (event, data) => {
  alertSucess(
    `Image resized successfully to: ${widthInput.value} x ${heightInput.value} at ${outputPath.innerText}`
  );
  form.classList.add("hidden");
});

ipcRenderer.on("dir:changed", (dir) => {
  currentOutputPath = dir;
  outputPath.innerText = dir;
});

btnChangeDir.addEventListener("click", (e) => {
  e.preventDefault();
  ipcRenderer.send("change:dir");
});

form.addEventListener("submit", sendImage);
