import { Client, GatewayIntentBits, ActivityType, ChannelType } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import { addSpeechEvent } from "discord-speech-recognition";
import MusicController from "./commands/MusicController";
require('dotenv/config');

const prefix = "!"; 
const gatilho = "genésio"; 

const client = new Client({
    intents: [
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ],
});
addSpeechEvent(client, { lang: "pt-BR" });

const musicController = new MusicController(client);

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift()?.toLowerCase();

    if (command == "tocar" || command == "t") {
        if (!message.guild) {
            message.reply({ content: "❌ | Funciono apenas em servidores!" });
            return;
        }
        if (!message.member?.voice.channelId) {
            message.reply({ content: "❌ | Você não está em um canal de voz!" });
            return;
        }
        if (args.length==0) {
            message.reply({ content: `❌ | É preciso informar o que vc quer tocar!` });
            return;
        }
        const { channel } = message.member.voice;
        if (!channel) {
            message.reply({ content: "❌ | Você não está em um canal de voz!" });
            return;
        }
        musicController.play(message.guild, channel, args.join(' '));
    }
    if (command == "pular" || command == "p") {
        if (!message.guild) {
            message.reply({ content: "❌ | Funciono apenas em servidores!" });
            return;
        }
        if (!message.member?.voice.channelId) {
            message.reply({ content: "❌ | Você não está em um canal de voz!" });
            return;
        }
        const { channel } = message.member.voice;
        if (!channel) {
            message.reply({ content: "❌ | Você não está em um canal de voz!" });
            return;
        }
        musicController.skip(message.guild, channel);
    }
    if (command == "entre" || command == "venha") {
        const voiceChannel = message.member?.voice.channel;
        if (voiceChannel) {
            try {
                joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: false,
                });
                message.reply({ content: `✅ | Sim, meu rei. Para me chamar use a palavra **${gatilho}**.` });
            } catch (e) {
                message.reply({ content: "❌ | Aconteceu um erro inesperado!" });
            }
        } else {
            message.reply({ content: "❌ | Você não está em um canal de voz!" });
        }
    }
});

client.on("speech", (msg) => {
    const conteudo = msg.content?.toLowerCase();
    if (!conteudo || !conteudo.includes(gatilho)) return;

    console.log(conteudo);

    if (conteudo.includes('toca') || conteudo.includes('toque') || conteudo.includes('tocar')) {
        musicController.play(msg.channel.guild, msg.channel, conteudo.replace(gatilho, '').replace('toca', '').replace('toque', '').replace('tocar', ''));
    }
    if (conteudo.includes('pula') || conteudo.includes('pular')) {
        musicController.skip(msg.channel.guild, msg.channel);
    }
});

client.on('ready', async () => {
    console.log(`Logado como ${client.user?.tag || "desconhecido"}!`);
    if (client.user) {
        client.user.setActivity("TUDO", { type: ActivityType.Watching });
    }
});

client.login(process.env.BOT_TOKEN);
