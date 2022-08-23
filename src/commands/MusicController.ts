import { Client, Message, VoiceBasedChannel, Guild, VoiceState } from "discord.js";
import { getURLfromSearch } from '../utils/youtubeSearch';
import { Server } from '../interfaces';
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

class MusicController {
    private client: Client;
    private servers: Server[];

    constructor(client: Client) {
        this.client = client;
        this.servers = [];
    }

    public async play(guild: Guild, channel: VoiceBasedChannel, query: string) {
        try {
            const guildId = guild.id;
            
            var server = this.servers.find(s => s.id == guildId);
            if (!server) {
                server = {
                    id: guildId,
                    player: await createAudioPlayer(),
                    connection: await this.connectToChannel(channel),
                    queue: [],
                    text_channel: guild.channels.cache.filter((item: any) => {return item.type==0}).at(0) || null
                }
                this.servers.push(server);

                server.connection?.subscribe(server.player);

                server.connection?.on('stateChange', (oldState, newState) => {
                    if ((newState.status === VoiceConnectionStatus.Disconnected && oldState.status !== VoiceConnectionStatus.Disconnected) || (newState.status === VoiceConnectionStatus.Destroyed && newState.status !== VoiceConnectionStatus.Destroyed)) {
                        this.disconnect(server);
                    }
                });

                server.player.on('stateChange', (oldState, newState) => {
                    if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                        server?.queue.shift();
                        this.processQueue(server);
                    }
                });
            }

            const result = query.includes("youtube.com") ? { link: query, title: null } : await getURLfromSearch(query);

            if (!result) return this.sendText(server.text_channel, `❌ | Nenhum resultado encontrado!`);

            server.queue.push(result.link);
            if (server.connection) {
                if (server.connection.state.status == VoiceConnectionStatus.Disconnected || server.connection.state.status == VoiceConnectionStatus.Destroyed) {
                    await server.connection.rejoin();
                }
                if (server.connection.joinConfig.channelId && server.connection.joinConfig.channelId != channel?.id) {
                    return this.sendText(server.text_channel, `❌ | Já estou em outro canal!`);
                }
            }
            else server.connection = await this.connectToChannel(channel);

            if (server.player.state.status != AudioPlayerStatus.Playing) {
                this.processQueue(server);
                return this.sendText(server.text_channel, `▶ | Tocando **${result.title||result.link}**!`);
            }
            return this.sendText(server.text_channel, `✅ | Coloquei **${result.title||result.link}** na fila!`);

        } catch (err) {
            console.error(err);
        }
    }

    public async skip(guild: Guild, channel: VoiceBasedChannel) {
        try {
            var guildId = guild.id;
            var server = this.servers.find(s => s.id == guildId);
            if (!server) return;

            if (!server.connection || !server.player){
                return this.sendText(server.text_channel, `❌ | Não estou tocando nada!`);
            }
            if (!channel || server.connection.joinConfig.channelId != channel.id) {
                return this.sendText(server.text_channel, `❌ | Só alguem de dentro do canal em que estou pode fazer isso.`);
            }
            server.queue.shift();
            this.processQueue(server);
            return this.sendText(server.text_channel, `✅ | Tá bão então.`);
        } catch (err) {
            console.error(err);
        }
    }

    private async connectToChannel(channel: any) {
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
    
    private disconnect(server: Server|undefined) {
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
        
                var index = this.servers.indexOf(server);
                if (index !== -1) {
                    this.servers.splice(index, 1);
                }
            }
        } catch (err) { 
            throw err;
        }
    }
    
    private async playSong(server: Server, url: string) {
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
            this.processQueue(server);
        }
    }
    
    private async processQueue(server: Server|undefined) {
        try {
            if (server)
            if (server.queue.length > 0) {
                await this.playSong(server, server.queue[0]);
            }
        } catch (e) { }
    }

    private sendText(channel: any, text: String) {
        channel.send(text);
    }
}

export default MusicController;