import { getURLfromSearch } from '../utils/youtubeUtils';
import { Server } from '../types/interfaces';
import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
    StreamType,
    AudioPlayerStatus,
    VoiceConnectionStatus,
} from '@discordjs/voice';
const ytdl = require("ytdl-core-discord");
const { VoiceChannel } = require('discord.js');


var servers: Server[] = [];

export async function tocar(message: any, arg: any) {
    try{
        var { channel } = message.member.voice;
        if (!channel) {
            return message.reply(`É necessário estar em um canal de voz!`);
        }
        if (!arg) {
            return message.reply(`É preciso informar o que vc quer tocar!`);
        }
        let url = arg.includes("youtube.com") ? arg : await getURLfromSearch(arg);
        var guildId = message.guild.id;
        var server = servers.find(s => s.id == guildId);
        if (!server){
            server = {
                id: guildId,
                player: await createAudioPlayer(),
                connection: await connectToChannel(channel),
                queue: []
            }
            servers.push(server);

            server.connection?.subscribe(server.player);

            server.connection?.on('stateChange', (oldState, newState) => {
                if ((newState.status === VoiceConnectionStatus.Disconnected && oldState.status !== VoiceConnectionStatus.Disconnected) || (newState.status === VoiceConnectionStatus.Destroyed && newState.status !== VoiceConnectionStatus.Destroyed)) {
                    disconnect(server);
                }
            });

            server.player.on('stateChange', (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    server?.queue.shift();
                    processQueue(server);
                }
            });
        }
        server.queue.push(url);
        if (server.connection) {
            if (server.connection.state.status == VoiceConnectionStatus.Disconnected || server.connection.state.status == VoiceConnectionStatus.Destroyed) {
                await server.connection.rejoin();
            }
            if (server.connection.joinConfig.channelId && server.connection.joinConfig.channelId != channel.id) {
                return message.reply(`Já estou em outro canal!`);
            }
        }
        else server.connection = await connectToChannel(channel);

        if (server.player.state.status != AudioPlayerStatus.Playing) {
            processQueue(server);
            return message.reply(`Ta na mão!`);
        }
        return message.reply(`Coloquei na fila. Posição atual: ${server.queue.length - 1}.`);
    } catch (err) {
        return message.reply(`Não deu :( => ${err}`);
    }
}

export async function pular(message: any) {
    try{
        var { channel } = message.member.voice;
        var guildId = message.guild.id;
        var server = servers.find(s => s.id == guildId);
        if (!server || !server.connection || !server.player){
            return message.reply(`Não estou tocando nada!`);
        }
        if (!channel || server.connection.joinConfig.channelId != channel.id) {
            return message.reply(`Só alguem de dentro do canal em que estou pode fazer isso.`);
        }
        server.queue.shift();
        processQueue(server);
        return message.reply(`Ta bão então.`);
    } catch (err) {
        return message.reply(`Não deu :( => ${err}`);
    }
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
        return connection;
    } catch (err) {
        connection.destroy();
        throw err;
    }
}

function disconnect(server: Server|undefined) {
    try {
        if (server){
            if (server.player) {
                server.player.removeAllListeners();
                server.player.stop();
            }
            if (server.connection){
                server.connection.disconnect();
                server.connection.destroy();
                server.connection = null;
            }
            server.queue = [];
    
            var index = servers.indexOf(server);
            if (index !== -1) {
                servers.splice(index, 1);
            }
        }
    } catch (err) { 
        throw err;
    }
}

async function playSong(server: Server, url: string) {
    try {
        let stream = await ytdl(url, { highWaterMark: 1 << 25 });
        const resource = createAudioResource(stream, {
            inputType: StreamType.Opus
        });

        server.player.play(resource);

        return entersState(server.player, AudioPlayerStatus.Playing, 5e3);
    }
    catch (e) {
        server.queue.shift();
        processQueue(server);
    }
}

async function processQueue(server: Server|undefined) {
    try {
        if (server)
        if (server.queue.length > 0) {
            await playSong(server, server.queue[0]);
        }
        else {
            disconnect(server);
        }
    } catch (e) { }
}

