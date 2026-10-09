import { BootstrapEngine } from './src/bootstrap/BootstrapEngine';

async function main() {
    const engine = new BootstrapEngine();
    console.log("Running autoDiscover to generate traces...");
    await engine.autoDiscover(process.cwd());
    console.log("Done.");
}
main().catch(console.error);
