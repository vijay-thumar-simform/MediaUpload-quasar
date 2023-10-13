<template>
  <!-- <q-page class="row items-center justify-evenly"> -->
  <q-page class="row items-center justify-evenly">
    <div class="container">
      <div v-if="serverFiles && serverFiles?.length > 0">
        Available files for download
        <div v-for="file in serverFiles" :key="file">
          <button @click="downloadFile(file)">{{ formateFileName(file) }}</button>
          <!-- <button @click="downloadFile(file)">{{ file }}</button> -->
          <div class="progress-bar-container">
            <div :id="file" class="progress-bar"></div>
          </div>
        </div>
      </div>
      <label class="upload-btn">
        Upload Video
        <input type="file" id="fileInput" accept="video/*" :multiple="'true'" @change="splitFile" style="display: none;">
      </label>
      <!-- <div v-for="(item, index) in files" :key="item.id">
        {{ item.name }}
        <div
          :style="{ minWidth: `${fileUploadPer[index] * 2}px`, maxWidth: `${fileUploadPer[index]}px`, backgroundColor: 'green' }">
          {{ fileUploadPer[index] }}</div>
        <button @click="cancelRequest(item)">Pause</button>
        <button @click="resumeUpload(item)">Resume</button>
      </div> -->

      <div v-for="item in allFileId" :key="item.fileId">
        {{ item.error }}
      </div>

      <div v-for="file in allFileId" :key="file.file">
        {{ file.fileName }}
        <div class="progress-wrapper">
          <div
            :style="{ minWidth: `${file.fileUploadPercentage * 2}px`, maxWidth: `${file.fileUploadPercentage * 2}px`, backgroundColor: 'green' }">
            {{ file.fileUploadPercentage }}%</div>
        </div>
        <span class="btns" v-if="file.fileUploadPercentage >= 100">
          Upload completed
        </span>
        <span class="btns" v-else>
          <button @click="cancelRequest(file)">Pause</button>
          <button @click="resumeUpload(file)">Resume</button>
          <!-- <button @click="retryUpload(file.file)">Retry Upload</button> -->
        </span>
      </div>

      <button @click="getFiles()">get files</button>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';

const ENDPOINTS = {
  UPLOAD: 'http://localhost:1234/upload',
  UPLOAD_STATUS: 'http://localhost:1234/upload-status',
  UPLOAD_REQUEST: 'http://localhost:1234/upload-request',
  GET_FILES: 'http://localhost:1234/files',
  DOWNLOAD_FILE: 'http://localhost:1234/download'
}
const serverFiles = ref<string[]>([])
const files = ref<any>([])
// const fileUploadPer = ref<any>([])

let defaultOptions = {
  url: 'http://localhost:1234/upload',
  startingByte: 0,
  fileId: '',
};

const allFileId = ref<any>([]) // created global file for id, file name,

const getFiles = () => {
  fetch(ENDPOINTS.GET_FILES)
    .then(res => {
      console.log('fetch file response: --> ', res)
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    })
    .then(data => {
      console.log('List of files:', data.files);
      serverFiles.value = data.files
    })
    .catch(error => {
      console.log('Error:', JSON.stringify(error));
    });

  // axios.get('http://localhost:1234/files')
  // .then(res => {
  //   console.log('fetch file response: ', res)
  // })
  // .catch(err => {
  //   console.log('files fetch error: ', err)
  // })
}

const formateFileName = (fileName: string) => {
  console.log('fileName ***',fileName)
  const match = fileName.split('-')
  const result = match.filter((str) => str.includes('.'));
  const index = result.length
  return result[index - 1]
}

// const downloadFile = (fileName: string) => {
//   // Function to download a file from the server
//   // Specify the filename as part of the URL
//   console.log('file name -->', { fileName })
//   const query = `${ENDPOINTS.DOWNLOAD_FILE}?fileName=${fileName}`

//   // Make a GET request to download the file
//   fetch(query)
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
//       // Trigger the file download by creating an <a> element with a blob URL
//       return response.blob();
//     })
//     .then((blob) => {
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = fileName;
//       a.style.display = 'none';
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//     })
//     .catch((error) => {
//       console.error('Error:', error);
//     });
// }

function downloadFile(fileName: string) {
  const apiUrl = `${ENDPOINTS.DOWNLOAD_FILE}?fileName=${fileName}`;
  const progressBar = document.getElementById(`${fileName}`);

  fetch(apiUrl).then(async (response) => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const contentLength = response.headers.get('content-length');
    const downloadStream = response.body;

    const reader = downloadStream.getReader();
    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;

      // Update the progress bar
      const percentage = (receivedLength / contentLength) * 100;
      progressBar.style.width = `${percentage}%`;
    }

    // Combine the downloaded chunks into a Blob
    const blob = new Blob(chunks, { type: 'application/octet-stream' });

    // Create a Blob URL and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }).catch((error) => {
    console.error('Error:', error);
  });
}

// Chunk upload apiCall
const uploadFileChunks = (file: any, options: any) => { // This will take file and create a chunk and upload a file chunk that is remaining
  // created form data for media to append
  const formData = new FormData();
  const fileIndex = allFileId.value.findIndex((f: any) => f.fileName === file.name)
  const selectedFile = allFileId.value[fileIndex]
  // formData.append('fileName', file.name)
  const chunk = file.slice(options.startingByte, file.size);
  formData.append('file', chunk, file.name)
  formData.append('fileId', selectedFile.fileId)
  // header for file upload.
  const headers = { // File chunk upload header
    'X-File-Id': selectedFile.fileId,
    // 'Content-Length': chunk.size,
    'Content-Range': `bytes=${options.startingByte}-${options.startingByte + chunk.size}/${file.size}`,
  };

  const specificToken = axios.CancelToken.source(); // created token to trace api call request
  allFileId.value.find((f: any) => f.fileName === file.name && (f.apiToken = specificToken, true)); // add that token globally

  axios.post(ENDPOINTS.UPLOAD, formData, // file upload api call form Axios
    {
      cancelToken: specificToken.token,
      headers: headers,
      onUploadProgress(progressEvent) {
        console.log('process event', progressEvent)
        if (options.startingByte > 0) {
          const loaded = options.startingByte + progressEvent.loaded
          progressEvent.loaded = loaded;
          const totalSize = selectedFile.file.size
          progressEvent.total = totalSize
        }
        let percentage = 0
        if (progressEvent.total) {
          percentage = Math.round(
            ((progressEvent.loaded) / (progressEvent.total)) * 100
          );
        }
        // fileUploadPer.value[index] = percentage
        allFileId.value.find((f: any) => f.fileName === file.name && (f.fileUploadPercentage = percentage, true))
        console.log(`Upload Progress: ${percentage}%`);
      },
      ...defaultOptions
    }).then((res) => {
      console.log(res)
    })
    .catch((err) => {
      allFileId[fileIndex].error = err
      console.log(err)
    })
}

const uploadFile = (file: any) => { // Upload file request it will create an empty file and return id for it to append same file via chunks
  const headers = {
    'Content-Type': 'application/json',
  };

  axios.post(ENDPOINTS.UPLOAD_REQUEST, JSON.stringify({ fileName: file.name }), {
    headers: headers
  })
    .then((res: any) => {
      console.log('responce form uploadfile request-upload: ', res)
      allFileId.value.push({ file: file, fileName: file.name, fileId: res.data.fileId })
      defaultOptions = { ...defaultOptions, fileId: res.data.fileId }
      console.log('default options: ', defaultOptions)
      uploadFileChunks(file, defaultOptions) // This is call for file chunk upload
    })
}

const splitFile = (e: any) => { // First call all file will be gather here
  console.log('whole event: ', e)
  files.value = Array.from(e.target.files)
  console.log('files that are selected: ', files.value, 'type of files: ', typeof (files.value))
  files.value.map((file: any) => {
    console.log('file length: ', file.size)
    uploadFile(file)
  })
  // for (var pair of formData.entries()) {
  //   console.log(pair[0], ',', pair[1])
  //   // console.log(pair[0]+ ', ' + pair[1]);
  // }
}

const resumeUpload = (file: any) => {
  // const specificFile = allFileId.value.find((f: any) => f.fileName == file.name)
  const query = `${ENDPOINTS.UPLOAD_STATUS}?fileName=${file.fileName}&fileId=${file.fileId}`
  axios.get(query)
    .then((res: any) => {
      defaultOptions.startingByte = res.data.totalChunkUploaded
      uploadFileChunks(file.file, { ...defaultOptions, startingByte: res.data.totalChunkUploaded })
    })
    .catch((e) => {
      console.log('error while calling an resume: ', e)
    })
}

const retryUpload = (file: any) => {
  uploadFileChunks(file, defaultOptions)
}

const cancelRequest = (file: any) => {
  // allFileId.value.find((f: any) => {
  //   f.fileName == file.name && f.apiToken.cancel('Request canceled by user.'), true
  // })
  file.apiToken.cancel('Request canceled by user.')
}
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: auto auto;
  justify-content: center;
  /* align-items: left; */
  /* width: 100%; */
  max-width: fit-content;
}

.upload-btn {
  background: #607D8B;
  color: #fff;
  border-radius: 5px;
  padding: 15px 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
}

.progress-wrapper {
  display: inline-block;
  background-color: #bbb;
  min-width: 200px;
  max-width: 200px;
}

.btns {
  padding: 6px 12px;
}

.progress-bar {
  /* display: inline-block; */
  height: 15px;
  /* height: inherit; */
  background-color: blue;
  margin-bottom: 12px;
  width: 0;
}

.progress-bar-container{
  background-color: #bbb;
}
</style>
