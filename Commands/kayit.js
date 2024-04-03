const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose(); 
const path = require('path');
const config = require('../config.json');

const dataKayit = new SlashCommandBuilder()
    .setName('kayit')
    .setDescription('Kullanıcı kaydı oluşturur.');

module.exports = {
  data: dataKayit,
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const userId = interaction.user.id;
      const filter = m => m.author.id === userId;

      let db = new sqlite3.Database(path.join(__dirname, '..', 'guildveri.db'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
        if (err) {
          console.error("SQLite veritabanına bağlanırken bir hata oluştu:", err.message);
          await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
          return;
        }
        console.log("SQLite veritabanına başarıyla bağlanıldı!");

        // Kullanıcının kaydının olup olmadığını kontrol etmek için sorgu yap
        db.get('SELECT * FROM oyuncular WHERE discordid = ?', [userId], async (err, row) => {
          if (err) {
            console.error("Kullanıcı sorgulanırken bir hata oluştu:", err.message);
            await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
            return;
          }
          if (row) {
            // Kullanıcının kaydı bulundu, bilgilendirme yap ve işlemi sonlandır
            await interaction.followUp('Daha önce kaydınız bulunmaktadır. Lütfen /k-komutu ile ilgili alanlardan güncelleme işlemini yapınız. Turkcell Müşteri Hizmetlerinin Katkılarıyla.Sağlıklı Günler Dileriz. İyi Oyunlar');
            return;
          }

          // Kullanıcının kaydı bulunamadı, kayıt işlemine devam et
          const questions = [
            "Lütfen Adınızı Giriniz",
            "Lütfen Karakter Adınızı Giriniz",
            "Lütfen Levelinizi Giriniz",
            "Lütfen Sınıfınızı Giriniz",
            "Lütfen Gücünüzü Giriniz",
            "Lütfen Atağınızı Giriniz",
            "Lütfen Defansınızı Giriniz",
            "Lütfen ACC'nizi Giriniz"
          ];

          const answers = [];

          for (const question of questions) {
            await interaction.followUp(question);
            const collectedMessages = await interaction.channel.awaitMessages({
              filter: filter,
              max: 1,
              time: 10000,
              errors: ['time']
            });
            if (collectedMessages.size === 0) {
              await interaction.followUp('Zaman aşımı! Lütfen işlemi tekrar başlatın.');
              return;
            }
            answers.push(collectedMessages.first().content);
          }

          const newGuild = "KabusTR";
          const [newRealName, newKarakterName, newLevel, newSinif, newGuc, newAtak, newDef, newAcc] = answers;

          db.run('INSERT INTO oyuncular (discordid, realname, karaktername, level, sinif, guc, atak, def, acc, guild) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [userId, newRealName, newKarakterName, newLevel, newSinif, newGuc, newAtak, newDef, newAcc, newGuild], async (err) => {
            if (err) {
              console.error("Kayıt işlemi sırasında bir hata oluştu:", err.message);
              await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
              return;
            }
            await interaction.followUp('Kayıt başarıyla tamamlandı.');
          });

          db.close(); // Veritabanı bağlantısını kapat
        });
      });
    } catch (error) {
      console.error("Bir hata oluştu:", error);
      await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  },
};
