require('dotenv/config');
const { Client } = require('discord.js');
import MusicPlayer from "./commands/music";

const prefix = "!";

const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'] });
client.login(process.env.BOT_TOKEN);

var musicPlayer = new MusicPlayer(client);

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("TUDO", { type: "WATCHING"})
});

client.on("messageCreate", async (message: any) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
  
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command == "tocar" || command == "t"){
        musicPlayer.tocar(message, args.join(" "));
    }
    if (command == "pular" || command == "p"){
        musicPlayer.pular(message);
    }
});


