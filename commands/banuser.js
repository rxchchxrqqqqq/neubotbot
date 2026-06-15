const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../config.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banuser')
    .setDescription('Bannt einen Lizenzschlüssel in KeyAuth')
    .addStringOption(option =>
      option.setName('key')
        .setDescription('Der zu bannende Lizenzschlüssel')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Grund für den Ban (Optional)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const key = interaction.options.getString('key').trim();
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';

    try {
      const url = `https://keyauth.win/api/seller/?sellerkey=${config.sellerKey}&type=banuser&user=${key}&reason=${encodeURIComponent(reason)}`;
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
        await interaction.editReply(`✅ **Lizenzschlüssel erfolgreich gebannt!**\n🔑 **Key:** \`${key}\`\n📝 **Grund:** ${reason}\n💬 **Antwort:** ${message}`);
      } else {
        await interaction.editReply(`❌ **Fehler beim Bannen des Lizenzschlüssels:**\n🔑 **Key:** \`${key}\`\n💬 **Antwort:** ${message}`);
      }

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Fehler beim Kommunizieren mit der KeyAuth Seller API.');
    }
  }
};
