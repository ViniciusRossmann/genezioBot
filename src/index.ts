import { Client, GatewayIntentBits, ActivityType, GuildBasedChannel, ChannelType, EmbedBuilder, TextBasedChannel, ModalBuilder, TextInputBuilder, ButtonBuilder, TextInputStyle, ActionRowBuilder, MessageComponentBuilder } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import { addSpeechEvent } from "discord-speech-recognition";
import MusicController from "./commands/MusicController";
require('dotenv/config');

const prefix = "!"; 
const gatilho = "jamal"; 

const client = new Client({
    intents: [
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages
    ],
});
addSpeechEvent(client, { lang: "pt-BR" });

const musicController = new MusicController(client);

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const command = message.content;

    if (command == "musica") {
        musicController.sendPlayer(message);
    }
    else if (command == "entre" || command == "venha") {
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
    else {
        //@ts-ignore
        if (message.channel?.name?.includes('⏩')) {
            console.log("teste")
            const messages = message.channel.messages.cache;
            console.log("teste ", messages)
            await musicController.play(message, message.content);
            try { message.delete(); } catch {}
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId=="add_queue") {
            const modal = new ModalBuilder()
                .setCustomId('search_modal')
                .setTitle('Adicionar à fila');
    
            const queryInput = new TextInputBuilder()
                .setCustomId('query_song')
                .setLabel("O que você quer tocar?")
                .setStyle(TextInputStyle.Short);
    
            const firstActionRow: any = new ActionRowBuilder().addComponents(queryInput);
    
            modal.addComponents(firstActionRow);
    
            await interaction.showModal(modal);
        }
        if (interaction.customId=="skip_track") {
            musicController.skip(interaction);
        }
    }
    if (interaction.isModalSubmit()) {
        const query = interaction.fields.fields.get('query_song')?.value;
        if (query) musicController.play(interaction, query);
        //interaction.reply({ content: 'ok' });
    }
});

client.on("speech", (msg) => {
    const conteudo = msg.content?.toLowerCase();
    if (!conteudo || !conteudo.includes(gatilho)) return;

    console.log(conteudo);

    /*if (conteudo.includes('toca') || conteudo.includes('toque') || conteudo.includes('tocar')) {
        musicController.play(msg.channel.guild, msg.channel, conteudo.replace(gatilho, '').replace('toca', '').replace('toque', '').replace('tocar', ''));
    }
    if (conteudo.includes('pula') || conteudo.includes('pular')) {
        musicController.skip(msg.channel.guild, msg.channel);
    }*/
});

client.on('ready', async () => {
    console.log(`Logado como ${client.user?.tag || "desconhecido"}!`);
    if (client.user) {
        client.user.setActivity("TUDO", { type: ActivityType.Watching });
    }
});

client.login(process.env.BOT_TOKEN);
