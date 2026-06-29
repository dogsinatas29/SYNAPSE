import { BootstrapEngine } from './src/bootstrap/BootstrapEngine';
const engine = new BootstrapEngine();
engine.liteBootstrap('/home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod').then(() => console.log('Done'));
