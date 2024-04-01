const {Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, MessageEmbed, ButtonBuilder, Events, ActionRowBuilder,ButtonStyle} = require('discord.js');
const fs = require('fs');




const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration
        ],
        partials: [
            'USER',
            'MESSAGE',
            'CHANNEL',
            'GUILD_MEMBER',
            'THREAD_MEMBER',
            'REACTION'
        ],
    allowedMentions: {
        repliedUser: false,
    },
});
const commands = [];

client.commands = new Collection();
client.config = require('./config.json');

client.on("ready", async (client) => {
    console.log("Now Online: " + client.user.tag);

    const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./Commands/${file}`);
        commands.push(command.data.toJSON());
    }

    try {
        await client.application.commands.set(commands);
        console.log('Slash commands added successfully!');
    } catch (error) {
        console.error('Error adding slash commands:', error);
    }
});

client.on('guildCreate', guild => {
    const defaultChannel = guild.systemChannel;
    if (defaultChannel) {
        const embed = new MessageEmbed()
            .setColor('#e01444')
            .setTitle('Merhaba!')
            .setDescription("Beni sunucuna eklediğin için teşekkürler!\n'/' ön ekini kullanarak ile komutları çağırabilirsin.\n\nHerhangi bir kanala '/help' yazarak beni kullanmaya başlayabilirsin");
        defaultChannel.send({ embeds: [embed] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const commandName = interaction.commandName;
    const commandFile = `./Commands/${commandName}.js`;

    if (fs.existsSync(commandFile)) {
        const command = require(commandFile);
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Komutlar Hatalı', ephemeral: true });
        }
    } else {
        console.log(`Belirtilen Komut Bulunamadı ${commandName}`);
    }
});


client.login(client.config.token)
 
