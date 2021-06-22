const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');
videoSelectBtn.onclick = getVideoSources;

const { desktopCapturer, remote } = require('electron');
const { dialog, Menu } = remote;

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const vidoeOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      }
    })
  )

  vidoeOptionsMenu.popup();

}

let mediaRecorder;
const recordedChunks = []

async function selectSource(source) {
  videoSelectBtn.innerText = source.name
  console.log(source)

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id,
      }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  videoElement.srcObject = stream;
  videoElement.play()

  const options = {
    mimeType: 'video/webm;codecs=vp9'
  }
  mediaRecorder = new MediaRecorder(stream, options)

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop
}

function handleDataAvailable(e) {
  recordedChunks.push(e.data)
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm;codecs=vp9'

  })

  const buffer = Buffer.from(await blob.arrayBuffer())

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  })

  writeFile(filePath, buffer, () => { })
}

const { writeFile } = require('fs')

startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger')
  startBtn.innerText = 'Recording'
}

stopBtn.onclick = e => {
  mediaRecorder.stop();
  startBtn.classList.remove('.is-danger');
  startBtn.innerText = 'Start'
}