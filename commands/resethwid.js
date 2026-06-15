const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resethwid')
    .setDescription('Setzt die HWID eines Lizenzschlüssels zurück')
    .addStringOption(option =>
      option.setName('key')
        .setDescription('Der Lizenzschlüssel, dessen HWID zurückgesetzt werden soll')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const key = interaction.options.getString('key').trim();

    try {
      const url = `https://keyauth.win/api/seller/?sellerkey=${config.sellerKey}&type=resetuser&user=${key}`;
      const response = await axios.get(url);
      
      // KeyAuth API returns JSON or text.
      // Usually, if successful, it returns {"success": true, "message": "Successfully reset user"} or similar text.
      const responseData = response.data;
      
      let success = false;
      let message = '';
      
      if (typeof responseData === 'object') {
        success = responseData.success;
        message = responseData.message || JSON.stringify(responseData);
      } else {
        const responseText = responseData.toString().toLowerCase();
        success = responseText.includes('success') || responseText.includes('successfully') || responseText.includes('true');
        message = responseData.toString();
      }

      if (success) {
        await interaction.editReply(`✅ **HWID erfolgreich zurückgesetzt!**\n🔑 **Key:** \`${key}\`\n💬 **Antwort:** ${message}`);
      } else {
        await interaction.editReply(`❌ **Fehler beim Zurücksetzen der HWID:**\n🔑 **Key:** \`${key}\`\n💬 **Antwort:** ${message}`);
      }

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Fehler beim Kommunizieren mit der KeyAuth Seller API.');
    }
  }
};
