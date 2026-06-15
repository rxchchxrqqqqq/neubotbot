const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletekey')
    .setDescription('Löscht einen Lizenzschlüssel aus KeyAuth')
    .addStringOption(option =>
      option.setName('key')
        .setDescription('Der zu löschende Lizenzschlüssel')
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const key = interaction.options.getString('key').trim();

    try {
      const url = `https://keyauth.win/api/seller/?sellerkey=${config.sellerKey}&type=del&key=${key}`;
      const response = await axios.get(url);
      
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
        await interaction.editReply(`✅ **Lizenzschlüssel erfolgreich gelöscht!**\n🔑 **Key:** \`${key}\`\n💬 **Antwort:** ${message}`);
      } else {
        await interaction.editReply(`❌ **Fehler beim Löschen des Lizenzschlüssels:**\n🔑 **Key:** \`${key}\`\n💬 **Antwort:** ${message}`);
      }

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Fehler beim Kommunizieren mit der KeyAuth Seller API.');
    }
  }
};
