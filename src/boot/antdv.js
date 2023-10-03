// src/boot/antdv.js

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import { boot } from 'quasar/wrappers';


export default boot(({app})=>{
  app.use(Antd)
})
