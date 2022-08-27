import * as mongoose from "mongoose";

export interface GuildConfigDocument extends mongoose.Document {
    player_channel: string;
    player_message: string;
}

const GuildConfigSchema = new mongoose.Schema(
    {
        _id: String,
        player_channel: String,
        player_message: String
    },
    {
        _id: false,
        versionKey: false
    }
);

const GuildConfig = mongoose.model<GuildConfigDocument>("GuildConfig", GuildConfigSchema);

export default GuildConfig;