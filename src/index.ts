import MusicController from "./commands/MusicController";
import { Client } from "discord.js";
require('dotenv/config');

const prefix = "!";  

const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'] });
client.login(process.env.BOT_TOKEN);
const musicController = new MusicController(client);

client.on('ready', async () => {
    console.log(`Logado como ${client.user?.tag || "desconhecido"}!`);
    if (client.user) {
        client.user.setActivity("TUDO", { type: "WATCHING"});
    }
});

client.on("messageCreate", async (message: any) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return; 
  
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command == "tocar" || command == "t"){ 
        musicController.play(message);
    }
    if (command == "pular" || command == "p"){
        musicController.skip(message);
    }
});