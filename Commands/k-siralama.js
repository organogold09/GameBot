const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config.json');
const { MessageEmbed } = require('discord.js');

const dataToplu = new SlashCommandBuilder()
    .setName('k-siralama')
    .setDescription('Guild İçinde Sıralamayı gösterir');

module.exports = {
  data: dataToplu,
  async execute(interaction) {
    let db;
    try {
      db = new sqlite3.Database(path.join(__dirname, '..', 'guildveri.db'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
      console.log("SQLite veritabanına başarıyla bağlanıldı!");

      const query = 'SELECT * FROM oyuncular ORDER BY guc DESC LIMIT 50;';
      db.all(query, async (err, rows) => {
        if (err) {
          console.error("Veritabanından kullanıcı bilgileri alınırken bir hata oluştu:", err);
          await interaction.reply('Kullanıcı bilgileri alınırken bir hata oluştu.');
          return;
        }

        if (rows.length === 0) {
          await interaction.reply('Kayıtlı kullanıcı bulunamadı.');
          return;
        }

        let responseMessage = '-------------------- Güç Sıralaması --------------------\n';
        rows.forEach((userInfo, index) => {
          responseMessage += `${index + 1}. Üyemiz\nSon Güncelleme Tarihi: ${formatDate(userInfo.guncellenme_tarihi)}\nAdı: ${userInfo.realname}\nNick: ${userInfo.karaktername}\nLevel: ${userInfo.level}\nSınıf: ${userInfo.sinif}\nGüç: ${userInfo.guc}\nAtak: ${userInfo.atak}\nDefans: ${userInfo.def}\nACC: ${userInfo.acc}\nGuild: ${userInfo.guild}\n-------------------- Güç Sıralaması --------------------\n`;
        });

        await interaction.reply(responseMessage);
      });
    } catch (error) {
      console.error("SQLite veritabanına bağlanırken bir hata oluştu:", error);
      await interaction.reply('Kullanıcı bilgileri alınırken bir hata oluştu.');
    } finally {
      if (db) db.close();
    }
  },
};

function formatDate(date) {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const datePart = new Date(date).toLocaleDateString('tr-TR', options).replace(',', '');
  const timePart = new Date(date).toLocaleTimeString('tr-TR', { hour: 'numeric', minute: 'numeric' });
  return `${datePart} - Saat: ${timePart}`;
}
