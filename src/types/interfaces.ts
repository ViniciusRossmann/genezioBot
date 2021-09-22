import {
    AudioPlayer,
    VoiceConnection
} from '@discordjs/voice';

export interface Server {
    id: string;
    queue: string[];
    player: AudioPlayer;
    connection: VoiceConnection|null
}