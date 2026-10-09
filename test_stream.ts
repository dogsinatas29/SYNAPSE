import * as fs from 'fs';
import * as readline from 'readline';

async function test() {
    console.log("Writing temp...");
    const tempPath = 'temp.ndjson';
    const outPath = 'out.ndjson';
    const tempStream = fs.createWriteStream(tempPath);
    for (let i=0; i<100000; i++) {
        const canWrite = tempStream.write(JSON.stringify({ i, foo: 'bar' }) + '\n');
        if (!canWrite) {
            await new Promise(r => tempStream.once('drain', r));
        }
    }
    tempStream.end();
    await new Promise(r => tempStream.once('finish', r));
    console.log("Reading temp and writing out...");
    
    const rl = readline.createInterface({ input: fs.createReadStream(tempPath) });
    const outStream = fs.createWriteStream(outPath);
    
    for await (const line of rl) {
        const obj = JSON.parse(line);
        obj.edgeCreated = obj.i % 2 === 0;
        const canWrite = outStream.write(JSON.stringify(obj) + '\n');
        if (!canWrite) {
            await new Promise(r => outStream.once('drain', r));
        }
    }
    outStream.end();
    await new Promise(r => outStream.once('finish', r));
    console.log("Done");
}
test();
