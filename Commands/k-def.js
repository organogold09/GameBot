const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose(); 
const path = require('path');

const dataDefName = new SlashCommandBuilder()
    .setName('k-def')
    .setDescription('Karakter defansını güncelle');

module.exports = {
  data: dataDefName,
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

      db.get('SELECT def FROM oyuncular WHERE discordid = ?', [userId], async (err, row) => {
        if (err) {
          console.error("Kullanıcı bilgilerini sorgularken bir hata oluştu:", err.message);
          await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
          db.close(); // Hatanın meydana geldiği yerde veritabanı bağlantısını kapat
          return;
        }

        if (!row) {
          await interaction.followUp('Şu anda kayıtlı bir karakter defansınız bulunmamaktadır. Öncelikle defansınızı kaydedin!');
          db.close(); // Veritabanı bağlantısını kapat
          return;
        }

        await interaction.followUp(`Şuanda kayıtlı karakter defansınız '${row.def}' 'dir. Lütfen yeni karakter defansını giriniz!`);

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

        const newDefName = collectedMessages.first().content;

        db.run('UPDATE oyuncular SET def = ?, guncellenme_tarihi = ? WHERE discordid = ?', [newDefName, new Date().toISOString(), userId], async (err) => {
          try {
            if (err) {
              console.error("Defansı güncellerken bir hata oluştu:", err.message);
              await interaction.followUp('Bir hata oluştu. Lütfen tekrar deneyin.');
              return;
            }
            await interaction.followUp('Karakter defansınız başarıyla güncellendi.');
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
