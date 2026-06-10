#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node scripts/create-account.js <username> <password>');
    process.exit(1);
}

const [username, password] = args;
const accountsPath = path.resolve(__dirname, '..', 'demo', 'data', 'accounts.json');

let store = { accounts: [] };
if (fs.existsSync(accountsPath)) {
    store = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
}

const existing = store.accounts.find((a) => a.username === username);
if (existing) {
    console.error(`Account already exists: ${username} (${existing.userId})`);
    process.exit(1);
}

const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

store.accounts.push({
    userId,
    username,
    passwordHash,
    createdAt: Date.now(),
});

fs.writeFileSync(accountsPath, JSON.stringify(store, null, 2), 'utf8');
console.log(`Account created: ${username} (${userId})`);
