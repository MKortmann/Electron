const form = document.querySelector('#form')
const btnSelectImg = document.querySelector('#select-image-btn')
const outputPath = document.querySelector('#output-path')
const filename = document.querySelector('#filename')
const inputFolder = document.querySelector('#input-folder')
const height = document.querySelector('#height')
const width = document.querySelector('#width')
const btnChangeDir = document.querySelector('#btn-change-dir')

let currentOutputPath = window.path.join(window.os.homedir(), 'image-resizer')
inputFolder.innerHTML = window.path.join(os.homedir(), 'image-resizer')

outputPath.innerHTML = currentOutputPath
let selectedFilePath = null

function sendImage(e) {
  e.preventDefault()

  if (!selectedFilePath) {
    alertError('Please upload an image file')
    return
  }

  if (!height.value || !width.value) {
    alertError('Please enter the height and width')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    console.log('Sending image to main process: ', selectedFilePath)
    ipcRenderer.send('image:resize', {
      fileName: selectedFilePath.split('\\').pop(),
      fileData: reader.result,
      outputPath: currentOutputPath,
      width: width.value,
      height: height.value,
    })
  }
  fetch(`file://${selectedFilePath}`)
    .then((response) => response.blob())
    .then((blob) => {
      reader.readAsArrayBuffer(blob)
    })
    .catch((err) => {
      alertError('Failed to load image file: ' + err.message)
    })
}

function isFileImage(file) {
  const image = new Image()
  image.src = URL.createObjectURL(file)

  image.onload = () => {
    console.log(image.width, image.height)
    width.value = image.width
    height.value = image.height
  }

  const acceptedImageTypes = ['image/gif', 'image/jpeg', 'image/png']
  return file && acceptedImageTypes.includes(file['type'])
}

btnSelectImg.addEventListener('click', () => {
  ipcRenderer.send('select:image')
})

ipcRenderer.on('image:selected', (filePath) => {
  console.log('Selected file:', filePath)
  selectedFilePath = filePath

  const fileName = filePath.split('\\').pop()

  filename.innerText = fileName

  const image = new Image()
  image.src = `file://${filePath}`
  image.onload = () => {
    console.log(`Width: ${image.width}, Height: ${image.height}`)
    width.value = image.width
    height.value = image.height
    form.classList.remove('hidden')
    const lastSeparatorIndex = filePath.lastIndexOf('\\')
    inputFolder.innerText = filePath.substring(0, lastSeparatorIndex)
  }
})

const alertError = (msg) => {
  window.Toastify.toast({
    text: msg,
    duration: 5000,
    close: false,
    gravity: 'top',
    position: 'center',
    backgroundColor: '#ff0000',
    color: 'white',
  })
}

const alertSucess = (msg) => {
  window.Toastify.toast({
    text: msg,
    duration: 7000,
    close: false,
    gravity: 'top',
    position: 'center',
    backgroundColor: '#00ff00',
    color: 'white',
  })
}

ipcRenderer.on('image:done', (event, data) => {
  alertSucess(
    `Image resized successfully to: ${width.value} x ${height.value} at ${outputPath.innerText}`,
  )
  form.classList.add('hidden')
})

ipcRenderer.on('dir:changed', (dir) => {
  currentOutputPath = dir
  outputPath.innerText = dir
})

btnChangeDir.addEventListener('click', (e) => {
  e.preventDefault()
  ipcRenderer.send('change:dir')
})

form.addEventListener('submit', sendImage)
