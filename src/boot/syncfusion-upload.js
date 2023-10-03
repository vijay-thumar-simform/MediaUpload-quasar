// src/boot/antdv.js

import { UploaderPlugin } from '@syncfusion/ej2-vue-inputs';
import { boot } from 'quasar/wrappers';

export default boot(({ app }) => {
  app.use(UploaderPlugin);
});
