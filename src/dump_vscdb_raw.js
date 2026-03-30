const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('os').homedir();

const dbPath = '/home/dogsinatas/.config/Antigravity/User/globalStorage/state.vscdb';
if (!fs.existsSync(dbPath)) {
    console.error('DB not found at:', dbPath);
    process.exit(1);
}

// Copy to avoids lock
const tmpPath = '/tmp/state_dump.vscdb';
fs.copyFileSync(dbPath, tmpPath);

const db = new sqlite3.Database(tmpPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Failed to open SQLite:', err);
        process.exit(1);
    }
    
    console.log('[DUMP] Querying ItemTable for history keys...');
    const query = "SELECT key, value FROM ItemTable WHERE key LIKE '%history%' OR key LIKE '%chat%' OR key LIKE '%gemini%' LIMIT 10";
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Query failed:', err);
        } else {
            rows.forEach(row => {
                console.log(`\n--- KEY: ${row.key} ---`);
                const blob = row.value;
                if (blob) {
                    console.log(`[BLOB Size: ${blob.length} bytes]`);
                    // First 128 bytes hex dump
                    const hex = blob.slice(0, 128).toString('hex');
                    console.log(`[HEX (128b)]: ${hex}`);
                    
                    // Simple ASCII view
                    const ascii = blob.slice(0, 256).toString('ascii').replace(/[^\x20-\x7E]/g, '.');
                    console.log(`[ASCII (256b)]: ${ascii}`);
                }
            });
        }
        db.close();
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    });
});
