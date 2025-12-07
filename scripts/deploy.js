#!/usr/bin/env node

/**
 * Custom IOTA Deploy Script
 * 
 * Tự động deploy contract và cập nhật:
 * - Package ID
 * - Game State ID
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'lib', 'config.ts');
const CONTRACT_PATH = path.join(__dirname, '..', 'contract', 'vua_tien_gviet');

console.log('🚀 Deploying Vua Tieng Viet Smart Contract...\n');

try {
    // Build contract first
    console.log('📦 Building contract...');
    execSync('iota move build', { cwd: CONTRACT_PATH, stdio: 'inherit' });

    // Deploy contract
    console.log('\n📤 Publishing contract...');
    const output = execSync('iota client publish --gas-budget 100000000 --json', {
        cwd: CONTRACT_PATH,
        encoding: 'utf-8'
    });

    // Parse JSON output
    const result = JSON.parse(output);

    if (result.effects?.status?.status !== 'success') {
        console.error('❌ Deploy failed:', result.effects?.status);
        process.exit(1);
    }

    // Find Package ID (Published Objects)
    let packageId = null;
    let gameStateId = null;
    let adminCapId = null;

    // Tìm trong objectChanges
    if (result.objectChanges) {
        for (const change of result.objectChanges) {
            // Package ID
            if (change.type === 'published') {
                packageId = change.packageId;
            }
            // Game State (Shared object với type chứa "GameState")
            if (change.type === 'created' && change.objectType?.includes('::contract::GameState')) {
                gameStateId = change.objectId;
            }
            // Admin Cap
            if (change.type === 'created' && change.objectType?.includes('::contract::AdminCap')) {
                adminCapId = change.objectId;
            }
        }
    }

    if (!packageId) {
        console.error('❌ Could not find Package ID in deploy output');
        process.exit(1);
    }

    if (!gameStateId) {
        console.error('❌ Could not find Game State ID in deploy output');
        process.exit(1);
    }

    console.log('\n✅ Deploy successful!\n');
    console.log('📋 Contract Information:');
    console.log('─'.repeat(60));
    console.log(`   Package ID:    ${packageId}`);
    console.log(`   Game State ID: ${gameStateId}`);
    if (adminCapId) {
        console.log(`   Admin Cap ID:  ${adminCapId}`);
    }
    console.log('─'.repeat(60));

    // Update config.ts
    console.log('\n📝 Updating lib/config.ts...');

    let configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');

    // Update DEVNET_PACKAGE_ID
    configContent = configContent.replace(
        /export const DEVNET_PACKAGE_ID = "[^"]*"/,
        `export const DEVNET_PACKAGE_ID = "${packageId}"`
    );

    // Update GAME_STATE_ID
    configContent = configContent.replace(
        /export const GAME_STATE_ID = "[^"]*"/,
        `export const GAME_STATE_ID = "${gameStateId}"`
    );

    fs.writeFileSync(CONFIG_PATH, configContent);

    console.log('✅ Config updated successfully!\n');

    // Show transaction digest
    if (result.digest) {
        console.log(`🔗 Transaction Digest: ${result.digest}`);
    }

    console.log('\n🎉 Done! You can now run: npm run dev\n');

} catch (error) {
    if (error.stdout) {
        console.error('Output:', error.stdout);
    }
    if (error.stderr) {
        console.error('Error:', error.stderr);
    }
    console.error('❌ Deploy failed:', error.message);
    process.exit(1);
}
