<template>
  <q-page class="row items-center justify-evenly">
    <example-component title="Example component" active :todos="todos" :meta="meta"></example-component>
    <input type="file" id="fileInput" @change="splitFile">
    <ejs-uploader id='chunkupload' name="UploadFiles" :asyncSettings="path" ref="uploadObj"> </ejs-uploader>
  </q-page>
</template>

<script setup lang="ts">
import { Todo, Meta } from 'components/models';
import ExampleComponent from 'components/ExampleComponent.vue';
import { ref } from 'vue';

const path =  {
            saveUrl: 'https://ej2.syncfusion.com/services/api/uploadbox/Save',
            removeUrl: 'https://ej2.syncfusion.com/services/api/uploadbox/Remove',
            chunkSize: 500000
          }


const todos = ref<Todo[]>([
  {
    id: 1,
    content: 'ct1'
  },
  {
    id: 2,
    content: 'ct2'
  },
  {
    id: 3,
    content: 'ct3'
  },
  {
    id: 4,
    content: 'ct4'
  },
  {
    id: 5,
    content: 'ct5'
  }
]);
const meta = ref<Meta>({
  totalCount: 1200
});

const splitFile = async (event: any) => {
  const fileInput = event.target;
  console.log(fileInput);
  const file = fileInput.files[0];
  console.log({ file });

  const chunkSize = 1024 * 1024; // 1MB chunks (you can adjust this size)
  console.log({ chunkSize });

  const chunks = [];
  console.log({ chunks });

  let offset = 0;
  console.log(offset);


  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    console.log({ chunk });

    chunks.push(chunk);
    offset += chunkSize;
    console.log({ offset, chunkSize });

  }

  // Send chunks to the backend (Node.js server)
  for (const chunk of chunks) {
    // // You can use Fetch API or Axios to send the chunks to the server.
    // // Make a POST request to your Node.js server and send the chunk data.
    // const response = await fetch('/#', {
    //   method: 'POST',
    //   body: chunk,
    // });
    // // Handle the server's response if needed.
    // console.log({ response });

    console.log('chunk of file: ', chunk);

  }
}
</script>
