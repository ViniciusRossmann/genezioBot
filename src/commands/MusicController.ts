import {
    VoiceConnectionStatus,
} from '@discordjs/voice';
import { Player, QueryType } from 'discord-player';
import { Client } from "discord.js";

class MusicController {
    private player: Player;

    constructor(client: Client) {
        this.player = new Player(client);

        client.on('voiceStateUpdate', async (oldState, newState) => {
            const queue = this.player.getQueue(newState.guild.id);
            if (!queue) return;
            const voiceConnection = queue.connection?.voiceConnection;
            if (!voiceConnection) return;
            setTimeout(()=>{
                if (voiceConnection.state.status == VoiceConnectionStatus.Disconnected || voiceConnection.state.status == VoiceConnectionStatus.Destroyed) {
                    //@ts-ignore
                    queue.metadata.send('❌ | Me derrubaro aqui ó :face_with_symbols_over_mouth: :face_with_symbols_over_mouth: :face_with_symbols_over_mouth:');
                    queue.destroy();
                }
            }, 800);
        })

        this.player.on('trackAdd', (queue: any, track) => {
            queue.metadata.send(`▶ | Coloquei **${track.title}** na fila!`);
        })  
        this.player.on('channelEmpty', (queue: any) => {
            queue.metadata.send('❌ | Meu deixaram sozinho, vou embora :(');
        });
    }

    public async play(message: any) {
        try {
            if (!this.isValid(message)) return;
            const query = message.content.split(' ').slice(1).join(' ');
            if (!query) {
                return message.reply({ content: `❌ | É preciso informar o que vc quer tocar!`, ephemeral: true });
            }

            const searchResult = await this.player
                .search(query, {
                    requestedBy: message.user,
                    searchEngine: QueryType.AUTO,
                })
                .catch(() => { });
            if (!searchResult || !searchResult.tracks.length) {
                return void message.reply({ content: '❌ | Nenhum resultado encontrado!' });
            }

            const queue = this.player.getQueue(message.guildId) || await this.player.createQueue(message.guild, {
                ytdlOptions: {
                    quality: "highest",
                    filter: "audioonly",
                    highWaterMark: 1 << 25,
                    dlChunkSize: 0,
                },
                metadata: message.channel,
            });

            try {
                if (!queue.connection) await queue.connect(message.member.voice.channel);
            } catch {
                void this.player.deleteQueue(message.guildId);
                return message.reply({
                    content: '❌ | Não foi possível entrar no canal de voz!',
                });
            }

            await message.reply({
                content: `⏱ | Carregando ${searchResult.playlist ? 'sua playlist' : 'seu vídeo'}...`,
            });
            searchResult.playlist ? queue.addTracks(searchResult.tracks) : queue.addTrack(searchResult.tracks[0]);
            if (!queue.playing) await queue.play();
        } catch (err) {
            console.log(err)
            return message.reply({ content: `❌ | Erro ao executar comando.`, ephemeral: true });
        }
    }

    public async skip(message: any) {
        try {
            if (!this.isValid(message)) return;
            const queue = this.player.getQueue(message.guildId);
            if (!queue || !queue.playing) {
                return void message.reply({content: '❌ | Não estou tocando nada!'});
            }
            const currentTrack = queue.current;
            const success = queue.skip();
            return void message.reply({
                content: success ? `✅ | Pulei **${currentTrack.title}**!` : '❌ | Algo deu errado!',
            });
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

