const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose(); // sqlite3 modülünü ekleyin
const path = require('path');
const config = require('../config.json');

const kGosterCommand = new SlashCommandBuilder()
    .setName('k-goster')
    .setDescription('Kullanıcı bilgilerini göster')
    .addStringOption(option =>
        option.setName('kullanici')
            .setDescription('Kullanıcı adı veya Discord ID')
            .setRequired(true));

module.exports = {
    data: kGosterCommand,
    async execute(interaction) {
        const kullanici = interaction.options.getString('kullanici');

         // Kullanıcı adı etiketlemesi (@kullanici) kullanıldıysa
         const userRegex = /^<@!?(\d+)>$/; // Etiketli kullanıcıyı tanımlamak için düzen ifadesi
         const match = kullanici.match(userRegex);

        // Kullanıcı adı etiketlemesi (@kullanici) kullanıldıysa
        if (match) {
            const userID = match[1]
            await displayUserInfo(interaction, userID, true);
        } else {
            await displayUserInfo(interaction, kullanici, false);
        }
    }
};

async function displayUserInfo(interaction, identifier, isDiscordID) {
    let db;
    try {
        db = new sqlite3.Database(path.join(__dirname, '..', 'guildveri.db'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
              console.error("SQLite veritabanına bağlanırken bir hata oluştu:", err.message);
              return;
            }
            console.log("SQLite veritabanına başarıyla bağlanıldı!");
        });

        let query;
        if (isDiscordID) {
            query = 'SELECT * FROM oyuncular WHERE discordID = ?';
        } else {
            query = 'SELECT * FROM oyuncular WHERE karaktername LIKE ?';
            identifier = `%${identifier}%`;
        }

        db.get(query, [identifier], async (err, row) => {
            if (err) {
                console.error("Veritabanından kullanıcı bilgileri alınırken bir hata oluştu:", err.message);
                await interaction.reply('Kullanıcı bilgileri alınırken bir hata oluştu.');
                return;
            }

            if (row) {
                const responseMessage = `\nİstenilen Kullanıcının Bilgileri Aşağıdaki Gibidir.\nSon Güncelleme Tarihi: ${formatDate(row.guncellenme_tarihi)}\nAdı: ${row.realname}\nNick: ${row.karaktername}\nLevel: ${row.level}\nSınıf: ${row.sinif}\nGüç: ${row.guc}\nAtak: ${row.atak}\nDefans: ${row.def}\nACC: ${row.acc}\nGuild: ${row.guild}`;

                function formatDate(date) {
                    const options = { day: 'numeric', month: 'long', year: 'numeric' };
                    const datePart = new Date(date).toLocaleDateString('tr-TR', options).replace(',', '');
                    const timePart = new Date(date).toLocaleTimeString('tr-TR', { hour: 'numeric', minute: 'numeric' });
                    return `${datePart} - Saat: ${timePart}`;
                }

                await interaction.reply(responseMessage);
            } else {
                await interaction.reply('Belirtilen kullanıcı bulunamadı.');
            }
        });
    } catch (error) {
        console.error("Bir hata oluştu:", error);
        await interaction.reply('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        if (db) db.close();
    }
}
