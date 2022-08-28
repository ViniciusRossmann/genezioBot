import {
    VoiceConnectionStatus,
} from '@discordjs/voice';
import { Player, QueryType, Queue } from 'discord-player';
import { Client, Message, GatewayIntentBits, ActivityType, ChannelType, EmbedBuilder, ModalBuilder, TextInputBuilder, ButtonBuilder, TextInputStyle, ActionRowBuilder, MessageComponentBuilder, Interaction, InteractionType, User, Guild } from "discord.js";
import { sendAlert } from '../utils/ChatAlert';

class MusicController {
    private player: Player;

    constructor(client: Client) {
        this.player = new Player(client); 

        this.player.on('trackStart', (queue, track) => {
            this.updatePlayer(queue);
        });
        this.player.on('trackEnd', (queue) => {
            this.updatePlayer(queue);
        });
        this.player.on('queueEnd', (queue) => {
            this.updatePlayer(queue);
        });
        this.player.on('trackAdd', (queue) => {
            this.updatePlayer(queue);
        });
        this.player.on('tracksAdd', (queue) => {
            this.updatePlayer(queue);
        });
    }

    private async updatePlayer(queue: Queue) {
        let embeds = [];

        embeds.push(
            new EmbedBuilder()
                .setTitle('GenézioPlayer - Não aceite imitações')
                .setFields({ name: 'Tocando agora:', value: this.getShortName(queue.playing ? queue.current.title : "") }, { name: "Na fila:", value: queue.tracks.length > 0 ? queue.tracks.map(item => { return this.getShortName(item.title); }).join('\n') : "-" })
                .setColor('#d32256')
        );
        
        //@ts-ignore
        queue.metadata.player_message?.edit({ embeds });
    }

    private getShortName(title: string) {
        if (!title) return "-";
        if (title.length > 41) return `${title.substring(0, 38)}...`;
        return title;
    }

    public async sendPlayer(message: Message) {
        if (!message.guildId || !message.guild) return;
        const queue = this.player.getQueue(message.guildId) || await this.player.createQueue(message.guild, {
            ytdlOptions: {
                quality: "highest",
                filter: "audioonly",
                highWaterMark: 1 << 25,
                dlChunkSize: 0,
            },
            metadata: { player_message: null },
            leaveOnEnd: false
        });

        const embed = new EmbedBuilder()
            .setTitle('GenézioPlayer - Não aceite imitações')
            .setFields({ name: 'Tocando agora:', value: this.getShortName(queue.playing ? queue.current.title : "") }, { name: "Na fila:", value: queue.tracks.length > 0 ? queue.tracks.map(item => { return this.getShortName(item.title); }).join('\n') : "-" })
            .setColor('#d32256')

        const plr = await message.channel.send({
            embeds: [embed],
            "components": [
                {
                    "type": 1,
                    "components": [
                        {
                            "type": 2,
                            "emoji": {
                                "id": "971015680600199178"
                            },
                            "style": 2,
                            "custom_id": "play"
                        },
                        {
                            "type": 2,
                            "emoji": {
                                "id": "971015680654729216"
                            },
                            "style": 2,
                            "custom_id": "skip_track"
                        },
                        {
                            "type": 2,
                            "emoji": {
                                "id": "971015680696672356"
                            },
                            "style": 2,
                            "custom_id": "stop_queue"
                        }
                    ]
                }
            ]
        })

        //@ts-ignore
        queue.metadata['player_message'] = plr;

        return plr.id;
    }

    public async play(author: User, player_message: Message, query: string) {
        try {
            if (!player_message.guild || !this.isValid(author, player_message)) return;

            const queue = this.player.getQueue(player_message.guild.id) || await this.player.createQueue(player_message.guild, {
                ytdlOptions: {
                    quality: "highest",
                    filter: "audioonly",
                    highWaterMark: 1 << 25,
                    dlChunkSize: 0,
                },
                metadata: { player_message: player_message },
                leaveOnEnd: false
            });

            try {
                const member_voice_channel = player_message.guild?.members.cache.find(item => item.id == author.id)?.voice.channel;
                if (!queue.connection && member_voice_channel) await queue.connect(member_voice_channel);
            } catch {
                this.player.deleteQueue(player_message.guild.id);
                return sendAlert(player_message.channel, `Não foi possível entrar no canal de voz!`, 'FF0000');
            }

            if (!query) return;

            const searchResult = await this.player
                .search(query, {
                    requestedBy: author,
                    searchEngine: QueryType.AUTO,
                })
                .catch(() => { });
            if (!searchResult || !searchResult.tracks.length) {
                return sendAlert(player_message.channel, `Nenhum resultado encontrado!`, 'FF0000');
            }

            searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
            if (!queue.playing) await queue.play();

            return sendAlert(player_message.channel, `🗿 Coloquei **${searchResult.tracks[0].title}** na fila!`, '00FF00');
        } catch (err) {
            console.error(err);
            return;
        }
    }

    public async skip(author: User, player_message: Message) {
        try {
            if (!player_message.guild || !this.isValid(author, player_message)) return;
            const queue = this.player.getQueue(player_message.guild.id);
            if (!queue || !queue.playing) {
                return sendAlert(player_message.channel, 'Não estou tocando nada!', 'FFFF00');
            }
            const currentTrack = queue.current;
            const success = queue.skip();
            return sendAlert(player_message.channel, success ? `Pulei **${currentTrack.title}**!` : '❌ | Algo deu errado!', success ? '00FF00' : 'FF0000');
        } catch (err) {
            console.error(err);
        }
    }

    public async stop(author: User, player_message: Message) {
        try {
            if (!player_message.guild || !this.isValid(author, player_message)) return;
            const queue = this.player.getQueue(player_message.guild.id);
            if (!queue) return;
            queue.clear();
            queue.stop();
        } catch (err) {
            console.error(err)
        }
    }

    private isValid(user: User, player_message: Message): boolean {
        try {
            const member_voice_id = player_message.guild?.members.cache.find(item => item.id == user.id)?.voice.channelId;
            if (!member_voice_id) {
                sendAlert(player_message.channel, "Você não está em um canal de voz!", 'FFFF00');
                return false;
            }
            if (player_message.guild.members.me?.voice.channelId && member_voice_id != player_message.guild.members.me?.voice.channelId) {
                sendAlert(player_message.channel, "Você não está no mesmo canal de voz que eu!", 'FFFF00');
                return false;
            }
            return true;
        }
        catch (err) {
            return false;
        }
    }
}

export default MusicController