import { Client, Message, EmbedBuilder, Channel, TextBasedChannel } from "discord.js";

export async function replyAlert(message: Message, info: string, color: string) {
    const embed = new EmbedBuilder()
        .setDescription(info)
        .setColor(`#${color}`)

    const alert = await message.reply({
        embeds: [embed]
    });

    setTimeout(() => {
        if (alert) alert.delete();
    }, 4000);
}

export async function sendAlert(channel: TextBasedChannel, info: string, color: string) {
    const embed = new EmbedBuilder()
        .setDescription(info)
        .setColor(`#${color}`)

    const alert = await channel.send({
        embeds: [embed]
    });

    setTimeout(() => {
        if (alert) alert.delete();
    }, 4000);
}