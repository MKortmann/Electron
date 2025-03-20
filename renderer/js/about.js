const information = document.getElementById('info')

console.log('versions:', versions)

if (versions) {
  information.innerText = `This app is using Chrome ${versions.chrome()}, Node.js ${versions.node()}, and Electron ${versions.electron()}`
} else {
  information.innerText = 'Versions information not available.'
}
