import {
    VoiceConnectionStatus,
} from '@discordjs/voice';
import { Player, QueryType, Queue } from 'discord-player';
import { Client, Message, GatewayIntentBits, ActivityType, ChannelType, EmbedBuilder, ModalBuilder, TextInputBuilder, ButtonBuilder, TextInputStyle, ActionRowBuilder, MessageComponentBuilder, Interaction, InteractionType } from "discord.js";
import { NODATA } from 'dns';

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
        queue.metadata.player?.edit({ embeds });
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
            metadata: { channel: message.channel },
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
                            "custom_id": "add_queue"
                        },
                        /*{
                            "type": 2,
                            "emoji": {
                                "id": ""
                            },
                            "style": 2,
                            "custom_id": "back_track"
                        },*/
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

        console.log("player id: ", plr.id)

        //@ts-ignore
        queue.metadata["player"] = plr;
    }

    public async play(message: any, query: string) {
        try {
            //if (!this.isValid(message)) return;

            const searchResult = await this.player
                .search(query, {
                    requestedBy: message.user,
                    searchEngine: QueryType.AUTO,
                })
                .catch(() => { });
            if (!searchResult || !searchResult.tracks.length) {
                return this.sendAlert(message, `Nenhum resultado encontrado!`, 'FF0000');
            }

            const queue = this.player.getQueue(message.guildId) || await this.player.createQueue(message.guild, {
                ytdlOptions: {
                    quality: "highest",
                    filter: "audioonly",
                    highWaterMark: 1 << 25,
                    dlChunkSize: 0,
                },
                metadata: { channel: message.channel },
            });

            try {
                if (!queue.connection) await queue.connect(message.member.voice.channel);
            } catch {
                void this.player.deleteQueue(message.guildId);
                return; //message.reply({content: '❌ | Não foi possível entrar no canal de voz!',});
            }

            searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
            if (!queue.playing) await queue.play();

            return this.sendAlert(message, `🗿 Coloquei **${searchResult.tracks[0].title}** na fila!`, '00FF00');
        } catch (err) {
            console.error(err);
            return;
        }
    }

    public async sendAlert(message: Message|Interaction, info: string, color: string) {
        const embed = new EmbedBuilder()
            .setDescription(info)
            .setColor(`#${color}`)

        const alert = await message.channel?.send({
            embeds: [embed]
        });

        if (message.type == 3) {
            //@ts-ignore
            message.deferUpdate();
        }

        setTimeout(() => {
            if (alert) alert.delete();
        }, 4000);
    }

    public async skip(message: Interaction) {
        try {
            if (!this.isValid(message)) return;
            if (!message.guildId) return;
            const queue = this.player.getQueue(message.guildId);
            if (!queue || !queue.playing) {
                this.sendAlert(message, '❌ | Não estou tocando nada!', 'FFFF00');
            }
            const currentTrack = queue.current;
            const success = queue.skip();
            return this.sendAlert(message, success ? `Pulei **${currentTrack.title}**!` : '❌ | Algo deu errado!', success ? '00FF00' : 'FF0000');
        } catch (err) {
            console.log(err)
            return false;
        }
    }

    private async isValid(interaction: any): Promise<boolean> {
        try {
            if (!interaction.member.voice.channelId) {
                return await interaction.reply({ content: "Você não está em um canal de voz!", ephemeral: true });
            }
            if (interaction.guild.me.voice.channelId && interaction.member.voice.channelId !== interaction.guild.me.voice.channelId) {
                return await interaction.reply({ content: "Você está em um canal de voz diferente do meu!", ephemeral: true });
            }
            return true;
        }
        catch (err) {
            return false;
        }
    }
}

export default MusicController