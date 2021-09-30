import MusicPlayer from "./commands/music";
const { Client } = require('discord.js');
require('dotenv/config');

//chat commands prefix
const prefix = "!";  

//discord.js client
const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'] });
client.login(process.env.BOT_TOKEN);

//my music player class 
var musicPlayer = new MusicPlayer(client);

//client ready
client.on('ready', async () => {
    console.log(`Logado como ${client.user.tag}!`);
    client.user.setActivity("TUDO", { type: "WATCHING"});
});

//on receive chat messages
client.on("messageCreate", async (message: any) => {
    if (message.author.bot) return; //not answer bots
    if (!message.content.startsWith(prefix)) return; //verify command prefix
  
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command == "tocar" || command == "t"){ //play music from search term or youtube link
        musicPlayer.tocar(message, args.join(" "));
    }
    if (command == "pular" || command == "p"){ //skip music (or leave channel)
        musicPlayer.pular(message);
    }
});


