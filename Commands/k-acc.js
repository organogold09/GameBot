const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose(); 
const path = require('path');

const dataAccName = new SlashCommandBuilder()
    .setName('k-acc')
    .setDescription('ACC kaydet veya düzenle');

module.exports = {
  data: dataAccName,
  async execute(interaction) {
    try {
      await interaction.deferReply(); 

      const userId = interaction.user.id;
      const filter = m => m.author.id === userId;

      let db = new sqlite3.Database(path.join(__dirname, '..', 'guildveri.db'), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error("SQLite veritabanına bağlanırken bir hata oluştu:", err.message);
          return;
        }
        console.log("SQLite veritabanına başarıyla bağlanıldı!");
      });

      db.get('SELECT acc FROM oyuncular WHERE discordid = ?', [userId], async (err, row) => {
        if (err) {
          console.error("Kullanıcı bilgilerini sorgularken bir hata oluştu:", err.message);
          await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
          return;
        }

        if (row) {
          await interaction.followUp(`Şuanda Kayıtlı ACCniz '${row.acc}'. Lütfen yeni ACC giriniz!`);
        } else {
          await interaction.followUp('Şu anda kayıtlı bir ACCniz bulunmamaktadır. Lütfen ACC giriniz!');
        }

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

        const newAccName = collectedMessages.first().content;

        if (row) {
          db.run('UPDATE oyuncular SET acc = ?, guncellenme_tarihi = ? WHERE discordid = ?', [newAccName, new Date().toISOString(), userId], async (err) => {
            try {
              if (err) {
                console.error("ACC güncellerken bir hata oluştu:", err.message);
                await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.Update');
                return;
              }
              await interaction.followUp('ACCniz başarıyla güncellendi.');
            } catch (error) {
              console.error("Bir hata oluştu:", error);
              await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
            } finally {
              db.close(); // Veritabanı bağlantısını kapat
            }
          });
        } else {
          db.run('INSERT INTO oyuncular (discordid, acc, guncellenme_tarihi) VALUES (?, ?, ?)', [userId, newAccName, new Date().toISOString()], async (err) => {
            try {
              if (err) {
                console.error("ACC eklerken bir hata oluştu:", err.message);
                await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.Register');
                return;
              }
              await interaction.followUp('ACCniz başarıyla kaydedildi.');
            } catch (error) {
              console.error("Bir hata oluştu:", error);
              await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
            } finally {
              db.close(); // Veritabanı bağlantısını kapat
            }
          });
        }
      });
    } catch (error) {
      console.error("Bir hata oluştu:", error);
      await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  },
};
