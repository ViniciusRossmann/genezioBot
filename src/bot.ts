import { Client, GatewayIntentBits, ActivityType } from "discord.js";
import { addSpeechEvent } from "discord-speech-recognition";
import MusicController from "./player/MusicController";
import GuildConfig, { GuildConfigDocument } from "./models/GuildConfigModel";
import { replyAlert } from './utils/ChatAlert';
import { dictionary } from './utils/Dictionary';

async function getGuildConfig(id: string): Promise<GuildConfigDocument|null> {
    try {
        const config = await GuildConfig.findById(id);
        return config;
    } catch {
        return null;
    }
}

async function setGuildConfig(_id: string, player_channel: string, player_message: string) {
    const config = { _id, player_channel, player_message };
    try {
        await GuildConfig.findOneAndUpdate({ _id: config._id }, config, { new: true, upsert: true });
        return true;
    } catch {
        return false;
    }
}

async function initBot(token: string) {
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
        if (message.author.bot || !message.guildId) return;

        if (message.content == "!setup") {
            const guild_player = await musicController.sendPlayer(message);
            if (!guild_player) return await replyAlert(message, "Não foi possível concluir o setup.", "FF0000");
            const res = await setGuildConfig(message.guildId, message.channelId, guild_player);
            if (!res) replyAlert(message, "Não foi possível concluir o setup.", "FF0000");
            return;
        }

        const guildConfig = await getGuildConfig(message.guildId);

        if (message.channelId != guildConfig?.player_channel) return;

        if (!guildConfig) {
            return await replyAlert(message, "Não foram encontradas configurações para esse servidor. \nUse o comando !setup em algum canal.", "FFFF00");
        }

        if (!message.member?.voice?.channelId) { 
            await replyAlert(message, "Você não está em um canal de voz!", "FFFF00");
            try { message.delete() } catch {}
            return;
        }

        const player_channel = await client.channels.fetch(guildConfig.player_channel);
        if (!player_channel || !player_channel.isTextBased()) { 
            await replyAlert(message, "Não foi possível concluir o comando. \nTente executar o !setup novamente.", "FF0000");
            try { message.delete() } catch {}
            return;
        }
        
        const player_message = await player_channel.messages.fetch(guildConfig.player_message);
        if (!player_message) { 
            await replyAlert(message, "Não foi possível concluir o comando. \nTente executar o !setup novamente.", "FF0000");
            try { message.delete() } catch {}
            return;
        }

        await musicController.play(message.author, player_message, message.content);
        try { message.delete() } catch {}
    });

    client.on('interactionCreate', async interaction => {
        if (interaction.isButton()) {
            if (!interaction.guildId) return;
            const guildConfig = await getGuildConfig(interaction.guildId);
            if (!guildConfig) return;

            const player_channel = await client.channels.fetch(guildConfig.player_channel);
            if (!player_channel || !player_channel.isTextBased()) return;
            const player_message = await player_channel.messages.fetch(guildConfig.player_message);
            if (!player_message) return;

            if (interaction.customId == "play") {
                musicController.play(interaction.user, player_message, "");
            }
            if (interaction.customId == "stop_queue") {
                musicController.stop(interaction.user, player_message);
            }
            if (interaction.customId == "skip_track") {
                musicController.skip(interaction.user, player_message);
            }
            interaction.deferUpdate();
        }
    });

    client.on("speech", async msg => {
        console.log(msg.content)

        let content: string = msg.content?.toLowerCase()||"";
        if (!content || !content.includes(dictionary.hotword)) return;

        content = content.replace(dictionary.hotword, '').trim();
        console.log(content);

        const guildConfig = await getGuildConfig(msg.guild.id);
        if (!guildConfig) return;
        const player_channel = await client.channels.fetch(guildConfig.player_channel);
        if (!player_channel || !player_channel.isTextBased()) return;
        const player_message = await player_channel.messages.fetch(guildConfig.player_message);
        if (!player_message) return;

        let find_command = false;

        for (let index in dictionary.play) {
            const word = dictionary.play[index];
            if (content.includes(word)) {
                find_command = true;
                const query = content.replace(word, '').trim();
                musicController.play(msg.author, player_message, query);
                break;
            }
        }

        if (find_command) return;

        for (let index in dictionary.skip) {
            const word = dictionary.skip[index];
            if (content.includes(word)) {
                find_command = true;
                musicController.skip(msg.author, player_message);
                break;
            }
        }
    });

    client.on('ready', async () => {
        console.log(`Logged as ${client.user?.tag || "unknown"}`);
        //setting bot activity
        if (client.user) client.user.setActivity("METFLIX", { type: ActivityType.Watching });
    });

    client.login(token);
}

export default initBot;