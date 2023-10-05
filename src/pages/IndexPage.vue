<template>
  <!-- <q-page class="row items-center justify-evenly"> -->
  <q-page class="row items-center justify-evenly">
    <div class="container">
      <input type="file" id="fileInput" :multiple="'true'" @change="splitFile">
      <div v-for="(item, index) in files" :key="item.id">
        {{ item.name }}
        <div
          :style="{ minWidth: `${fileUploadPer[index] * 2}px`, maxWidth: `${fileUploadPer[index]}px`, backgroundColor: 'green' }">
          {{ fileUploadPer[index] }}</div>
        <!-- {{ fileUploadPer[index] }} -->
        <!-- ! below pause code is working but there are some bugs that we have to solve edge case -->
        <button @click="cancelRequest(item)">Pause</button>
        <button @click="resumeUpload(item)">Resume</button>

      </div>
      <!-- <button @click="cancelRequest">cancel</button> -->
    </div>
  </q-page>
</template>

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
</style>

<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';

const ENDPOINTS = {
  UPLOAD: 'http://localhost:1234/upload',
  UPLOAD_STATUS: 'http://localhost:1234/upload-status',
  UPLOAD_REQUEST: 'http://localhost:1234/upload-request'
}

const files = ref<any>([])
const fileUploadPer = ref<any>([])

let defaultOptions = {
  url: 'http://localhost:1234/upload',
  startingByte: 0,
  fileId: '',
};

let allFileId: any = []; // created global file for id, file name,

// Chunk upload apiCall
const uploadFileChunks = (file: any, defaultOptions: any, index: number) => {
  // created form data for media to append
  const formData = new FormData();
  formData.append('file', file, file.name)
  formData.append('fileId', defaultOptions.fileId)
  // formData.append('fileName', file.name)

  // header for file upload.
  const chunk = file.slice(defaultOptions.startingByte);
  const headers = {
    'X-File-Id': defaultOptions.fileId,
    'Content-Length': chunk.size,
    'Content-Range': `bytes=${defaultOptions.startingByte}-${defaultOptions.startingByte + chunk.size}/${file.size}`,
  };

  // created token to trace api call request
  const specificToken = axios.CancelToken.source();
  allFileId.find((f: any) => f.file === file.name && (f.apiToken = specificToken, true)); // add that token globally

  // file upload api call form axios
  axios.post(ENDPOINTS.UPLOAD, formData,
    {
      cancelToken: specificToken.token,
      headers: headers,
      onUploadProgress(progressEvent) {
        console.log('process event', progressEvent)
        let percentage = 0
        if (progressEvent.total) {
          percentage = Math.round(
            ((progressEvent.loaded) / (progressEvent.total)) * 100
          );
        }

        fileUploadPer.value[index] = percentage
        console.log(`Upload Progress: ${percentage}%`);
      },
      ...defaultOptions
    })
}

const uploadFile = (file: any, index: number) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  axios.post(ENDPOINTS.UPLOAD_REQUEST, JSON.stringify({ fileName: file.name }), {
    headers: headers
  })
  .then((res: any) => {
    console.log('responce form uploadfile request-upload: ', res)
    allFileId.push({ file: file.name, fileId: res.data.fileId })
    defaultOptions = { ...defaultOptions, fileId: res.data.fileId }
    console.log('default options: ', defaultOptions)
    uploadFileChunks(file, defaultOptions, index) // This is call for file chunk upload
  })
}

const splitFile = (e: any) => {
  console.log('whole event: ', e)
  files.value = Array.from(e.target.files)
  console.log('files that are selected: ', files.value, 'type of files: ', typeof (files.value))
  files.value.map((file: any, index: number) => {
    uploadFile(file, index)
  })
  // for (var pair of formData.entries()) {
  //   console.log(pair[0], ',', pair[1])
  //   // console.log(pair[0]+ ', ' + pair[1]);
  // }
}

const resumeUpload = (file: any) => {
  const specificFile = allFileId.find((f: any) => f.file == file.name)

  const query = `${ENDPOINTS.UPLOAD_STATUS}?fileName=${file.name}&fileId=${specificFile.fileId}`

  axios.get(query)
    .then((res) => {
      console.log(res)
    }).catch((e) => { console.log('error while calling an resume: ', e) })
}

const cancelRequest = (file: any) => {
  allFileId.find((f: any) => {
    f.file == file.name && f.apiToken.cancel('Request canceled by user.'), true
  })
};
</script>
