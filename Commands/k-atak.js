const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose(); 
const path = require('path');

const dataAtakName = new SlashCommandBuilder()
    .setName('k-atak')
    .setDescription('Karakter atağını güncelle');

module.exports = {
  data: dataAtakName,
  async execute(interaction) {
    try {
      await interaction.deferReply(); 

      const userId = interaction.user.id;
      const filter = m => m.author.id === userId;

      let db = new sqlite3.Database(path.join(__dirname, '..', 'guildveri.db'), sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error("SQLite veritabanına bağlanırken bir hata oluştu:", err.message);
          return;
        }
        console.log("SQLite veritabanına başarıyla bağlanıldı!");
      });

      db.get('SELECT atak FROM oyuncular WHERE discordid = ?', [userId], async (err, row) => {
        if (err) {
          console.error("Kullanıcı bilgilerini sorgularken bir hata oluştu:", err.message);
          await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
          db.close(); // Hatanın meydana geldiği yerde veritabanı bağlantısını kapat
          return;
        }

        if (!row) {
          await interaction.followUp('Şu anda kayıtlı bir karakter atağınız bulunmamaktadır. Öncelikle atağınızı kaydedin!');
          db.close(); // Veritabanı bağlantısını kapat
          return;
        }

        await interaction.followUp(`Şuanda kayıtlı karakter atağınız '${row.atak}' 'dir. Lütfen yeni karakter atağını giriniz!`);

        const collectedMessages = await interaction.channel.awaitMessages({
          filter: filter,
          max: 1,
          time: 10000,
          errors: ['time']
        });

        if (collectedMessages.size === 0) {
          await interaction.followUp('Zaman aşımı! Lütfen işlemi tekrar başlatın.');
          db.close(); // Hatanın meydana geldiği yerde veritabanı bağlantısını kapat
          return;
        }

        const newAtakName = collectedMessages.first().content;

        db.run('UPDATE oyuncular SET atak = ?, guncellenme_tarihi = ? WHERE discordid = ?', [newAtakName, new Date().toISOString(), userId], async (err) => {
          try {
            if (err) {
              console.error("Atak güncellerken bir hata oluştu:", err.message);
              await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
              return;
            }
            await interaction.followUp('Karakter atağınız başarıyla güncellendi.');
          } catch (error) {
            console.error("Bir hata oluştu:", error);
            await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
          } finally {
            db.close(); // Veritabanı bağlantısını kapat
          }
        });
      });
    } catch (error) {
      console.error("Bir hata oluştu:", error);
      await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  },
};
