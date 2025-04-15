require("dotenv").config();
const express = require('express');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

// Minimal Express server to prevent hosting timeout
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("✅ Discord Bot is running!"));
app.listen(PORT, () => console.log(`🌐 Express server listening on port ${PORT}`));

// Discord client setup
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Slash commands
const commands = [
  new SlashCommandBuilder().setName('nseactive').setDescription('Get the top 5 most active NSE stocks'),
  new SlashCommandBuilder().setName('bseactive').setDescription('Get the top 5 most active BSE stocks'),
  new SlashCommandBuilder().setName('ipoupcoming').setDescription('Get upcoming IPOs'),
  new SlashCommandBuilder()
    .setName('companyinfo')
    .setDescription('Get information about a company')
    .addStringOption(option =>
      option.setName('company').setDescription('Company name').setRequired(true)
    ),
  new SlashCommandBuilder().setName('trendingstocks').setDescription('Show top 3 gainers and losers'),
];

// Register commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log("🚀 Slash commands registered.");
  } catch (err) {
    console.error("❌ Failed to register commands:", err.message);
  }
});

// Command Handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  await interaction.deferReply();

  try {
    switch (commandName) {
      case 'nseactive':
      case 'bseactive': {
        const exchange = commandName === 'nseactive' ? 'NSE' : 'BSE';
        const url = `https://stock.indianapi.in/${exchange}_most_active`;

        const { data } = await axios.get(url, {
          headers: { "x-api-key": process.env.INDIAN_API_KEY }
        });

        if (!data?.length) return interaction.editReply(`❌ No active stocks found for ${exchange}.`);

        const top5 = data.slice(0, 5).map((stock, i) => {
          return `📌 **${i + 1}. ${stock.company} (${stock.ticker})**
💰 Price: ₹${stock.price} | 📈 Change: ${stock.net_change} (${stock.percent_change}%)
🔺 High: ₹${stock.high} | 🔻 Low: ₹${stock.low} | 🕒 Volume: ${stock.volume.toLocaleString()}
📊 Rating: ${stock.overall_rating} | 📉 Trend: ${stock.short_term_trend}, ${stock.long_term_trend}`;
        }).join("\n\n");

        return interaction.editReply(`📢 **Top 5 Most Active ${exchange} Stocks:**\n\n${top5}`);
      }

      case 'ipoupcoming': {
        const { data } = await axios.get("https://stock.indianapi.in/ipo", {
          headers: { "x-api-key": process.env.INDIAN_API_KEY }
        });

        const upcoming = data?.upcoming || [];
        if (!upcoming.length) return interaction.editReply("❌ No upcoming IPOs found.");

        const list = upcoming.slice(0, 5).map((ipo, i) => {
          return `📌 **${i + 1}. ${ipo.name} (${ipo.symbol})**
📄 [Doc](${ipo.document_url || "#"}) | 💸 ₹${ipo.min_price || "TBA"} - ₹${ipo.max_price || "TBA"}
📅 Bidding: ${ipo.bidding_start_date || "TBA"} - ${ipo.bidding_end_date || "TBA"}`;
        }).join("\n\n");

        return interaction.editReply(`📢 **Upcoming IPOs:**\n\n${list}`);
      }

      case 'companyinfo': {
        const companyName = interaction.options.getString("company");
        const { data } = await axios.get(`https://stock.indianapi.in/stock?name=${encodeURIComponent(companyName)}`, {
          headers: { "x-api-key": process.env.INDIAN_API_KEY }
        });

        if (!data || !data.companyName) return interaction.editReply("❌ Company not found.");

        const companyDetails = `
📊 **${data.companyName}**
*Industry:* ${data.industry || "Not Available"}
*Description:* ${data.companyProfile?.companyDescription || "No description available."}

💹 **Stock Info**
- **NSE Price:** ₹${data.currentPrice?.NSE || "Not Available"}
- **BSE Price:** ₹${data.currentPrice?.BSE || "Not Available"}
- **Market Cap:** ₹${data.companyProfile?.peerCompanyList?.[1]?.marketCap || "N/A"} Cr`;

        return interaction.editReply(companyDetails);
      }

      case 'trendingstocks': {
        const { data } = await axios.get("https://stock.indianapi.in/trending", {
          headers: { "x-api-key": process.env.INDIAN_API_KEY }
        });

        const gainers = data?.trending_stocks?.top_gainers || [];
        const losers = data?.trending_stocks?.top_losers || [];

        if (!gainers.length && !losers.length)
          return interaction.editReply("❌ No trending data available at the moment.");

        const gainersText = gainers.slice(0, 3).map((stock, i) => {
          return `📈 **${i + 1}. ${stock.company_name} (${stock.ticker_id})**
💰 Price: ₹${stock.price} | 📊 Change: ${stock.net_change} (${stock.percent_change}%)
🔺 High: ₹${stock.high} | 🔻 Low: ₹${stock.low} | 🕒 Volume: ${parseInt(stock.volume).toLocaleString()}`;
        }).join("\n\n");

        const losersText = losers.slice(0, 3).map((stock, i) => {
          return `📉 **${i + 1}. ${stock.company_name} (${stock.ticker_id})**
💰 Price: ₹${stock.price} | 📊 Change: ${stock.net_change} (${stock.percent_change}%)
🔺 High: ₹${stock.high} | 🔻 Low: ₹${stock.low} | 🕒 Volume: ${parseInt(stock.volume).toLocaleString()}`;
        }).join("\n\n");

        return interaction.editReply(`📢 **Top 3 Gainers:**\n\n${gainersText}\n\n🟥 **Top 3 Losers:**\n\n${losersText}`);
      }

      default:
        return interaction.editReply("⚠️ Unknown command.");
    }

  } catch (error) {
    console.error("Command Error:", error.message);
    const message = error?.response?.data?.message || error.message || "Unknown error.";
    return interaction.editReply(`🚨 Something went wrong: ${message}`);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
