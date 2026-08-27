// index.js - بوت يقرأ أوامر من مجلد commands
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ========== إعدادات البوت ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ========== جمع الأوامر ==========
client.commands = new Collection();

// قراءة مجلد الأوامر
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('name' in command && 'execute' in command) {
    client.commands.set(command.name, command);
    console.log(`✅ Loaded command: ${command.name}`);
  } else {
    console.log(`⚠️ Command ${file} is missing name or execute property`);
  }
}

// ========== إعدادات السيرفر ==========
const app = express();
const PORT = process.env.PORT || 3000;

// ========== أحداث البوت ==========
client.on('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  console.log(`📡 Bot invited to ${client.guilds.cache.size} servers`);
  console.log(`📚 Loaded ${client.commands.size} commands`);
});

// معالجة الأوامر
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(process.env.PREFIX || '!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`❌ Error executing command ${commandName}:`, error);
    await message.reply('❌ حدث خطأ أثناء تنفيذ الأمر');
  }
});

// ========== إعدادات السيرفر الإضافية ==========
app.get('/', (req, res) => {
  res.json({
    status: 'Bot is running',
    botName: client.user?.tag || 'Not connected',
    servers: client.guilds?.cache.size || 0,
    commands: client.commands?.size || 0,
    uptime: process.uptime()
  });
});

app.get('/commands', (req, res) => {
  const commandsList = Array.from(client.commands.keys());
  res.json({
    total: commandsList.length,
    commands: commandsList
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ========== تشغيل السيرفر ==========
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Commands list: http://localhost:${PORT}/commands`);
});

// ========== تشغيل البوت ==========
client.login(process.env.DISCORD_TOKEN);

// ========== معالجة الأخطاء ==========
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});
