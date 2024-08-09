const { Client, IntentsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder } = require('discord.js')
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.MessageContent
    ]
})
const chalk = require('chalk')
require('dotenv').config({ path: require('find-config')('.env') })
const db = require('pro.db')
const BotConfig = require('./Bot.json')

client.on('ready', async () => {
    console.log(chalk.blue('The Client has been Connected to : ') + chalk.red(client.user.username))
})


client.on('messageCreate', async Message => {
    if (!BotConfig.OwnersId.includes(Message.author.id)) return;
    if (!Message.content.startsWith(BotConfig.Prefix)) return;
    const Cmd = Message.content.slice(BotConfig.Prefix.length).trim().split(' ')
    const Command = Cmd.shift()
    
    if (Command == 'setup') {
        Message.delete()
        const Embed = new EmbedBuilder()
            .setAuthor({ name: 'Temporary Voice Dashboard', iconURL: client.user.displayAvatarURL() })
            .setDescription(`Click on the Button to Control your Temporary Channel`)
            .setTimestamp()
            .setFooter({ text: Message.guild.name, iconURL: Message.guild.iconURL() })

        const RowTwo = new ActionRowBuilder()
            .addComponents(
                // new ButtonBuilder()
                //     .setStyle(ButtonStyle.Secondary)
                //     .setEmoji('1084915797463404614')
                //     .setLabel('Customize Users')
                //     .setCustomId('Customize_UserLimit'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('1079515860516999290')
                    .setLabel('Disconnect')
                    .setCustomId('Disconnect'))
        const RowThree = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('1079515862928740363')
                    .setLabel('Delete  Channel')
                    .setCustomId('Delete_Channel'),
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🗒️')
                    .setLabel('Rename')
                    .setCustomId('RenameChannel')
            )
        Message.channel.send({ embeds: [Embed], components: [RowTwo, RowThree] })
    }
})

client.on('voiceStateUpdate', async (OldVoice, NewVoice) => {
    if (BotConfig.ChannelsId.includes(NewVoice.channelId)){
        await NewVoice.guild.channels.create({
            name: `${NewVoice.member.user.username}'s Channel`,
            type: ChannelType.GuildVoice,
            parent: NewVoice.member.voice.channel.parentId,
            userLimit: BotConfig.MaxUsers || NewVoice.member.voice.channel.userLimit
        }).then(async Channel => {
            db.set(`Temporary_${Channel.id}_${OldVoice.member.user.id}`, Channel.id)
            await NewVoice.member.voice.setChannel(Channel)
        })
    }

    const interval = setInterval(async () => {
        if(!db.has(`Temporary_${OldVoice.channelId}_${OldVoice.member.user.id}`)) return clearInterval(interval)
        if (OldVoice.channelId !== null) {
            if (OldVoice.channel.members.filter(x => !x.user.bot).size == 0) {
                let channel = OldVoice.guild.channels.cache.get(OldVoice.channelId)
                await channel.delete();
                db.delete(`Temporary_${OldVoice.channelId}_${OldVoice.member.user.id}`);
				clearInterval(interval)
            }
        }
		
    }, 2000)
})

client.on('interactionCreate', async Interaction => {
    if (Interaction.isButton()) {
        const Channel = Interaction.member.voice.channel;
        if (!Channel) return Interaction.reply({ content: `You are not in voice channel.`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        const Data = db.get(`Temporary_${Channel.id}_${Interaction.user.id}`)
        if (Data !== Channel.id) return Interaction.reply({ content: `You are not a owner if the temporary channel`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        switch (Interaction.customId) {
            case 'LockChannel': 
			if(Interaction.member.roles.cache.has('881269913728204851')){
				Interaction.user.send("Sebaiknya jangan berduaan kalo cowo cewe, sekedar mengingatkan 🙏")
				console.log('WASEKJEN')
				                await Interaction.deferUpdate().catch(() => { })
                Interaction.member.voice.channel.permissionOverwrites.set([
                    {
                        id: Interaction.guild.roles.everyone.id,
                        deny: [
                            PermissionsBitField.Flags.Connect
                        ]
                    },
                    {
                        id: Interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.Connect
                        ]
                    }
                ])
			}else{
				Interaction.reply({ content: `Ngunci channel gabisa dulu yah.`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
			}
			
			{

            }
                break;
            case 'UnlockChannel': {
                await Interaction.deferUpdate().catch(() => { })
                Interaction.member.voice.channel.permissionOverwrites.set([
                    {
                        id: Interaction.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.Connect
                        ]
                    }
                ])
            }
                break;
            case 'HideChannel':
			if(Interaction.member.roles.cache.has('881269913728204851')){
				await Interaction.deferUpdate().catch(() => { })
                Interaction.member.voice.channel.permissionOverwrites.set([
                    {
                        id: Interaction.guild.roles.everyone.id,
                        deny: [
                            PermissionsBitField.Flags.ViewChannel
                        ]
                    },
                    {
                        id: Interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel
                        ]
                    }
                ])
			}else{
                Interaction.reply({ content: `Fitur ngumpet sementara gabisa ya :)`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
            }
                break;
            case 'UnhideChannel': {
                await Interaction.deferUpdate().catch(() => { })
                Interaction.member.voice.channel.permissionOverwrites.set([
                    {
                        id: Interaction.guild.roles.everyone.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel
                        ]
                    }
                ])
            }
                break;
            case 'RenameChannel': {
                const Modal = new ModalBuilder()
                    .setCustomId('RenameModal')
                    .setTitle('Rename Channel')
                const Name = new TextInputBuilder()
                    .setStyle(TextInputStyle.Short)
                    .setLabel('THE NEW NAME')
                    .setMaxLength(50)
                    .setCustomId('Name')
                    .setRequired(true)
                const Row = new ActionRowBuilder().addComponents(Name)
                Modal.addComponents(Row)
                Interaction.showModal(Modal)
            }
                break;
            case 'Mute': {
                await Interaction.deferUpdate().catch(() => { })
                Channel.members.forEach(async Members => {
                    const Member = Interaction.guild.members.cache.get(Members.id)
                    if (Member.id !== Interaction.user.id) Member.voice.setMute(true)
                })
            }
                break;
            case 'Unmute': {
                await Interaction.deferUpdate().catch(() => { })
                Channel.members.forEach(async Members => {
                    const Member = Interaction.guild.members.cache.get(Members.id)
                    if (Member.id !== Interaction.user.id) Member.voice.setMute(false)
                })
            }
                break;
            case 'Disconnect': {
                await Interaction.deferUpdate().catch(() => { })
                Channel.members.forEach(async Members => {
                    const Member = Interaction.guild.members.cache.get(Members.id)
                    if (Member.id !== Interaction.user.id) Member.voice.disconnect()
                })
            }
                break;
            case 'Delete_Channel': {
                await Interaction.deferUpdate().catch(() => { })
                db.delete(`Temporary_${Channel.id}_${Interaction.user.id}`)
                await Channel.delete()
            }
                break;
            case 'Ban_Member': {
                const User = new UserSelectMenuBuilder().setPlaceholder('Select the User').setCustomId('UserMenu').setMaxValues(1)
                const Row = new ActionRowBuilder().addComponents(User)
                Interaction.reply({ content: `_ _`, components: [Row], ephemeral: true })
            }
                break;
            case 'UsersManager': {
                const Row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('1085177845065728062')
                        .setLabel('Mute')
                        .setCustomId('UsersManager_Mute'),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('1085177849322946612')
                        .setLabel('Unmute')
                        .setCustomId('UsersManager_Unmute'),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('1085177846911221770')
                        .setLabel('Deafen')
                        .setCustomId('UsersManager_Deafen'),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('1085177842016452698')
                        .setLabel('Undeafen')
                        .setCustomId('UsersManager_Undeafen'))
                Interaction.reply({ content: '_ _', components: [Row], ephemeral: true })
            }
                break;
            case 'Customize_UserLimit': {
                const Modal = new ModalBuilder()
                    .setCustomId('Customize_UsersLimit')
                    .setTitle('Customize Users Limit')
                const Number = new TextInputBuilder()
                    .setStyle(TextInputStyle.Short)
                    .setLabel('The Number')
                    .setMaxLength(2)
                    .setCustomId('The_Number')
                    .setRequired(true)
                const Row = new ActionRowBuilder().addComponents(Number)
                Modal.addComponents(Row)
                Interaction.showModal(Modal)
            }
        }
    } else if (Interaction.isStringSelectMenu()) {
        const Channel = Interaction.member.voice.channel;
        if (!Channel) return Interaction.reply({ content: `You are not in voice channel.`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        const Data = db.get(`Temporary_${Channel.id}_${Interaction.user.id}`)
        if (Data !== Channel.id) return Interaction.reply({ content: `You are not a owner if the temporary channel`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        if (Interaction.customId == 'Menu') {
            await Interaction.deferUpdate().catch(() => { })
            if (Interaction.guild.channels.cache.get(Channel.id).type === ChannelType.GuildVoice) {
                Interaction.guild.channels.cache.get(Channel.id).setUserLimit(Interaction.values[0])
            }
        }
    } else if (Interaction.isModalSubmit()) {
        const Channel = Interaction.member.voice.channel;
        if (!Channel) return Interaction.reply({ content: `You are not in voice channel.`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        const Data = db.get(`Temporary_${Channel.id}_${Interaction.user.id}`)
        if (Data !== Channel.id) return Interaction.reply({ content: `You are not a owner if the temporary channel`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        if (Interaction.customId == 'RenameModal') {
            const Name = Interaction.fields.getTextInputValue('Name')
            await Channel.setName(Name)
            Interaction.reply({ content: `The channel has been successfully changed.`, ephemeral: true })
        } else if (Interaction.customId == 'Customize_UsersLimit') {
            const Number = Interaction.fields.getTextInputValue('The_Number')
            if (Channel.userLimit == Number) return Interaction.reply({ content: `The users limit is already \`${Number}\``, ephemeral: true })
            Interaction.reply({ content: `The users limit has been changed from \`${Channel.userLimit || '0'}\` to \`${Number}\``, ephemeral: true })
            await Channel.setUserLimit(Number)
        }
    }
})

/* Users Manager */

client.on('interactionCreate', async Interaction => {
    if (Interaction.isButton()) {
        const Channel = Interaction.member.voice.channel;
        if (!Channel) return Interaction.reply({ content: `You are not in voice channel.`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        const Data = db.get(`Temporary_${Channel.id}_${Interaction.user.id}`)
        if (Data !== Channel.id) return Interaction.reply({ content: `You are not a owner if the temporary channel`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        switch (Interaction.customId) {
            case 'UsersManager_Mute': {
                const Row = new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                            .setPlaceholder('Select the User from the Menu')
                            .setCustomId('UserManager_Mute')
                            .setMaxValues(1)
                    )
                Interaction.reply({ content: '_ _', components: [Row], ephemeral: true })
            }
                break;
            case 'UsersManager_Unmute': {
                const Row = new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                            .setPlaceholder('Select the User from the Menu')
                            .setCustomId('UserManager_Unmute')
                            .setMaxValues(1))
                Interaction.reply({ content: '_ _', components: [Row], ephemeral: true })
            }
                break;
            case 'UsersManager_Deafen': {
                const Row = new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                            .setPlaceholder('Select the User from the Menu')
                            .setCustomId('UserManager_Deafen')
                            .setMaxValues(1)
                    )
                Interaction.reply({ content: '_ _', components: [Row], ephemeral: true })
            }
                break;
            case 'UsersManager_Undeafen': {
                const Row = new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                            .setPlaceholder('Select the User from the Menu')
                            .setCustomId('UserManager_Undeafen')
                            .setMaxValues(1)
                    )
                Interaction.reply({ content: '_ _', components: [Row], ephemeral: true })
            }
        }
    } else if (Interaction.isUserSelectMenu()) {
        const Channel = Interaction.member.voice.channel;
        if (!Channel) return Interaction.reply({ content: `You are not in voice channel.`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        const Data = db.get(`Temporary_${Channel.id}_${Interaction.user.id}`)
        if (Data !== Channel.id) return Interaction.reply({ content: `You are not a owner if the temporary channel`, ephemeral: true }).then(msg => {setTimeout(() => msg.delete(), 3000)})
        switch (Interaction.customId) {
            case 'UserManager_Mute': {
                await Interaction.deferUpdate().catch(() => { })
                Interaction.member.voice.channel.members.filter((Member) => Member.user.id == Interaction.values[0]).forEach((User) => {
                    const Member = Interaction.guild.members.cache.get(User.id)
                    Member.voice.setMute(true)
                })
            }
                break;
            case 'UserManager_Unmute': {
                await Interaction.deferUpdate().catch(() => { })
                Interaction.member.voice.channel.members.filter((Member) => Member.user.id == Interaction.values[0]).forEach((User) => {
                    const Member = Interaction.guild.members.cache.get(User.id)
                    Member.voice.setMute(false)
                })
            }
                break;
            case 'UserManager_Deafen': {
                await Interaction.deferUpdate().catch(() => { })
                Interaction.member.voice.channel.members.filter((Member) => Member.user.id == Interaction.values[0]).forEach((User) => {
                    const Member = Interaction.guild.members.cache.get(User.id)
                    Member.voice.setDeaf(true)
                })
            }
                break;
            case 'UserManager_Undeafen': {
                await Interaction.deferUpdate().catch(() => { })
                Interaction.member.voice.channel.members.filter((Member) => Member.user.id == Interaction.values[0]).forEach((User) => {
                    const Member = Interaction.guild.members.cache.get(User.id)
                    Member.voice.setDeaf(false)
                })
            }
        }
    }
})


client.login(process.env.TOKEN).catch(() => {
    console.log(chalk.red('The Token is invalid'))
})

async function cleanups() {
    await db.disconnect()
     client.destroy()
     console.log(chalk.red('The Client has been Disconnected'))
}
process.once('uncaughtException', async () => {return })
process.once('uncaughtExceptionMonitor', async () => {return })
process.once('unhandledRejection', async () => {return })
process.once('exit', async () => {cleanups(); return })