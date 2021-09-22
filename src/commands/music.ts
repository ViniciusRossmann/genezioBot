require('dotenv/config');
const ytdl = require("ytdl-core-discord");
const { VoiceChannel } = require('discord.js');
import { getURLfromSearch } from '../utils/youtubeUtils';

import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus,
} from '@discordjs/voice';

const player = createAudioPlayer();
var queue = [];
var connection;

export async function tocar(message, arg) {
    var { channel } = message.member.voice;
    if (!channel) {
        return message.reply(`É necessário estar em um canal de voz!`);
    }
    if (!arg) {
        return message.reply(`É preciso informar o que vc quer tocar!`);
    }

    if (connection) {
        if (connection.state.status == VoiceConnectionStatus.Disconnected || connection.state.status == VoiceConnectionStatus.Destroyed) {
            await connection.rejoin();
        }
        if (connection.joinConfig.channelId != channel.id) {
            return message.reply(`Já estou em outro canal!`);
        }
    }
    else connection = await connectToChannel(channel);

    let url = arg.includes("youtube.com") ? arg : await getURLfromSearch(arg);
    queue.push(url);

    if (player.state.status != AudioPlayerStatus.Playing) {
        processQueue();
        return message.reply(`Ta na mão!`);
    }
    return message.reply(`Coloquei na fila. Posição atual: ${queue.length - 1}.`);
}

export async function pular(message) {
    var { channel } = message.member.voice;
    if (!connection || !player) {
        return message.reply(`Não estou tocando nada!`);
    }
    if (!channel || connection.joinConfig.channelId != channel.id) {
        return message.reply(`Só alguem de dentro do canal em que estou pode fazer isso.`);
    }

    queue.shift();
    processQueue();
    return message.reply(`Ta bão então.`);
}

async function connectToChannel(channel: typeof VoiceChannel) {
    var connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfMute: false
    });
    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
        connection.subscribe(player);

        connection.on('stateChange', (oldState, newState) => {
            if ((newState.status === VoiceConnectionStatus.Disconnected && oldState.status !== VoiceConnectionStatus.Disconnected) || (newState.status === VoiceConnectionStatus.Destroyed && newState.status !== VoiceConnectionStatus.Destroyed)) {
                disconnect();
            }
        });

        return connection;
    } catch (error) {
        connection.destroy();
        throw error;
    }
}

function disconnect() {
    try {
        connection?.disconnect();
        connection?.destroy();
        connection = null;
        if (player) {
            player.removeAllListeners();
            player.stop();
        }
        queue = [];
    } catch (e) { }
}

async function playSong(url: string) {
    try {
        console.log("colocanfo pra tocar")
        let stream = await ytdl(url, { highWaterMark: 1 << 25 });
        const resource = createAudioResource(stream, {
            inputType: StreamType.Opus
        });

        player.play(resource);

        return entersState(player, AudioPlayerStatus.Playing, 5e3);
    }
    catch (e) {
        queue.shift();
        processQueue();
    }
}

player.on('stateChange', (oldState, newState) => {
    if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
        queue.shift();
        processQueue();
    }
});

async function processQueue() {
    try {
        if (queue.length > 0) {
            await playSong(queue[0]);
        }
        else {
            if (connection) {
                connection.disconnect();
                connection.destroy();
                connection = null;
            }
            if (player) {
                player.removeAllListeners();
                player.stop();
            }
            queue = [];
        }
    } catch (e) { }
}

