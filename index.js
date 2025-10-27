require("dotenv").config();
const express = require("express");
const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");

// ====== Keep-alive Express ======
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("✅ Bot is alive!"));
app.listen(PORT, () => console.log(`🌐 Keep-alive server running on port ${PORT}`));

// ====== Discord Client ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// ====== CONFIG ======
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const THUMBNAIL_URL = process.env.THUMBNAIL_URL;
const COLOR_DEFAULT = process.env.COLOR_DEFAULT || "#7b7b7b";
const COLOR_TICKET_OPEN = process.env.COLOR_TICKET_OPEN || "#2ECC71";
const COLOR_TICKET_CLOSE = process.env.COLOR_TICKET_CLOSE || "#d70001";
const FOOTER_SERVER = process.env.FOOTER_SERVER || "Server Info";
const FOOTER_TICKET = process.env.FOOTER_TICKET || "Ticket System";

// ====== READY ======
client.once("ready", async () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    await guild.members.fetch();
    console.log(`👥 Fetched ${guild.memberCount} members`);
  } catch (err) {
    console.error("❌ Error fetching guild/members:", err);
  }

  client.user.setPresence({
    activities: [{ name: "Attack on Titan", type: 3 }],
    status: "online"
  });
});

// ====== INTERACTION HANDLER ======
client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "main_menu") {
      // --- SERVER INFO ---
      if (interaction.values[0] === "server_info") {
        const serverInfo = new EmbedBuilder()
          .setColor(COLOR_DEFAULT)
          .setTitle("Server Information")
          .setDescription("Server rules, appeals, watchlist, blacklist info...")
          .setThumbnail(THUMBNAIL_URL)
          .setFooter({ text: FOOTER_SERVER });

        await interaction.reply({ embeds: [serverInfo], ephemeral: true });
      }

      // --- TICKET INFO ---
      if (interaction.values[0] === "ticket_info") {
        const ticketInfo = new EmbedBuilder()
          .setColor(COLOR_DEFAULT)
          .setTitle("Appeal and Unappealable Offences")
          .setThumbnail(THUMBNAIL_URL)
          .setFooter({ text: FOOTER_TICKET });

        await interaction.reply({ embeds: [ticketInfo], ephemeral: true });
      }
    }
  }

  // --- BUTTON HANDLER ---
  if (interaction.isButton()) {
    if (interaction.customId === "open_ticket") {
      try {
        const thread = await interaction.channel.threads.create({
          name: `ticket-${interaction.user.username}`,
          type: 12,
          reason: "Support Ticket"
        });

        await thread.members.add(interaction.user.id);

        const staffRole = interaction.guild.roles.cache.get(STAFF_ROLE_ID);
        if (staffRole) {
          staffRole.members.forEach(member => {
            thread.members.add(member.id).catch(() => {});
          });
        }

        await thread.send({
          content: `||<@&${STAFF_ROLE_ID}> New ticket created by <@${interaction.user.id}>||`,
          embeds: [
            new EmbedBuilder()
              .setColor(COLOR_TICKET_OPEN)
              .setTitle("🎟️ Ticket Opened")
              .setDescription("A staff member will be with you shortly.\nClick **Close Ticket** when done.")
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("close_ticket")
                .setLabel("🔒 Close Ticket")
                .setStyle(ButtonStyle.Danger)
            )
          ]
        });

        await interaction.reply({ content: `✅ Ticket created: ${thread}`, ephemeral: true });
      } catch (err) {
        console.error("❌ Error creating ticket thread:", err);
        await interaction.reply({ content: "❌ Failed to create ticket.", ephemeral: true });
      }
    }

    if (interaction.customId === "close_ticket") {
      try {
        await interaction.message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLOR_TICKET_CLOSE)
              .setTitle("🔒 Ticket Closed")
              .setDescription("This ticket has been closed. Thank you!")
          ]
        });
        await interaction.message.channel.setArchived(true);
      } catch (err) {
        console.error("❌ Error closing ticket:", err);
      }
    }
  }
});

// ====== LOGIN ======
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("✅ Bot login successful"))
  .catch(err => console.error("❌ Bot login failed:", err));
