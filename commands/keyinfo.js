const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('keyinfo')
    .setDescription('Zeigt Informationen zu einem Lizenzschlüssel an')
    .addStringOption(option =>
      option.setName('key')
        .setDescription('Der abzufragende Lizenzschlüssel')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const key = interaction.options.getString('key').trim();

    try {
      const url = `https://keyauth.win/api/seller/?sellerkey=${config.sellerKey}&type=info&user=${key}`;
      const response = await axios.get(url);
      const data = response.data;

      if (!data || data.success === false) {
        return interaction.editReply(`❌ **Fehler:** Der Lizenzschlüssel \`${key}\` wurde nicht gefunden oder die Abfrage ist fehlgeschlagen.\n💬 **Nachricht:** ${data.message || 'Keine Angabe'}`);
      }

      // Datum-Konvertierung Hilfsfunktion
      const formatTimestamp = (ts) => {
        if (!ts) return 'Nie';
        const date = new Date(parseInt(ts) * 1000);
        return date.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
      };

      const hwid = data.hwid || 'Nicht zugewiesen / Leer';
      const ip = data.ip || 'Keine IP';
      const created = formatTimestamp(data.createdate);
      const lastLogin = formatTimestamp(data.lastlogin);
      const status = data.banned ? '🔴 Gebannt' : '🟢 Aktiv';
      const banReason = data.banreason || 'Kein Grund angegeben';

      const embed = new EmbedBuilder()
        .setTitle('🔑 Lizenzschlüssel-Informationen')
        .setColor(data.banned ? 0xFF0000 : 0x00FF00)
        .addFields(
          { name: 'Lizenzschlüssel', value: `\`${key}\``, inline: false },
          { name: 'Status', value: status, inline: true },
          { name: 'HWID', value: `\`${hwid}\``, inline: false },
          { name: 'Letzte IP', value: `\`${ip}\``, inline: true },
          { name: 'Erstellungsdatum', value: created, inline: true },
          { name: 'Letzter Login', value: lastLogin, inline: true }
        )
        .setFooter({ text: 'KeyAuth Integration • LR Tweaker' })
        .setTimestamp();

      if (data.banned) {
        embed.addFields({ name: 'Ban-Grund', value: banReason, inline: false });
      }

      // Subscriptions auflisten, falls vorhanden
      if (data.subscriptions && Array.isArray(data.subscriptions)) {
        let subsList = '';
        data.subscriptions.forEach(sub => {
          subsList += `**Sub:** ${sub.subscription} | **Level:** ${sub.keyLevel || '1'} | **Ablauf:** ${formatTimestamp(sub.expiry)}\n`;
        });
        if (subsList) {
          embed.addFields({ name: 'Abonnements', value: subsList, inline: false });
        }
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Fehler beim Abrufen der Lizenz-Informationen von KeyAuth.');
    }
  }
};
