import {
    AudioPlayer,
    VoiceConnection
} from '@discordjs/voice';
import { GuildBasedChannel } from 'discord.js';

export interface Server {
    id: string;
    queue: string[];
    player: AudioPlayer;
    connection: VoiceConnection|null;
    text_channel: GuildBasedChannel|null;
}