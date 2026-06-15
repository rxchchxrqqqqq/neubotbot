const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('genkeywasd')
    .setDescription('Generiert einen Key für WASD Tweaker und sendet ihn an den User')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der User, der den Key erhalten soll')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('tage')
        .setDescription('Gültigkeit des Keys in Tagen (Standard: 30)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const targetUser = interaction.options.getUser('user');
    const expiryDays = interaction.options.getInteger('tage') || 30;
    const level = config.wasdKeyLevel || 2;

    try {
      const url = `https://keyauth.win/api/seller/?sellerkey=${config.sellerKey}&type=add&expiry=${expiryDays}&mask=WASD-******-******-******-******&level=${level}&amount=1&format=text`;
      const response = await axios.get(url);
      const generatedKey = response.data.trim();

      if (!generatedKey || generatedKey.includes('error') || generatedKey.length < 5) {
        return interaction.editReply(`❌ Fehler bei der Key-Generierung durch KeyAuth: ${response.data}`);
      }

      // Rollenzuweisung
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      let roleAssigned = false;
      let roleName = '';
      if (member) {
        const role = interaction.guild.roles.cache.get(config.customerRoleId);
        if (role) {
          roleName = role.name;
          await member.roles.add(role);
          roleAssigned = true;
        }
      }

      // DM an den User senden
      let dmSent = false;
      try {
        await targetUser.send(
          `🔑 **WASD Tweaker Lizenzschlüssel**\n\n` +
          `Hallo ${targetUser},\n` +
          `hier ist dein Lizenzschlüssel für den **WASD Tweaker**:\n` +
          `\`${generatedKey}\`\n\n` +
          `**Gültigkeit:** ${expiryDays} Tage\n\n` +
          `*Bitte gib diesen Key nicht an Dritte weiter!*`
        );
        dmSent = true;
      } catch (dmError) {
        console.error('DM konnte nicht gesendet werden:', dmError);
      }

      let responseText = `✅ **WASD Key erfolgreich generiert!**\n\n`;
      responseText += `👤 **Nutzer:** ${targetUser} (${targetUser.tag})\n`;
      responseText += `🔑 **Key:** \`${generatedKey}\`\n`;
      responseText += `📅 **Gültigkeit:** ${expiryDays} Tage\n`;
      responseText += `🏷️ **Rolle zugewiesen:** ${roleAssigned ? `Ja (@${roleName})` : 'Nein (Rolle oder User nicht im Server gefunden)'}\n`;
      responseText += `✉️ **DM gesendet:** ${dmSent ? 'Ja' : '⚠️ **Nein (DMs geschlossen! Bitte dem User den Key manuell senden)**'}`;

      await interaction.editReply(responseText);

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Fehler beim Generieren des Keys.');
    }
  }
};
