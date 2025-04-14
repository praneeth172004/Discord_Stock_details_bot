require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Slash commands setup
const commands = [
  new SlashCommandBuilder()
    .setName('nseactive')
    .setDescription('Get the top 5 most active NSE stocks'),

  new SlashCommandBuilder()
    .setName('bseactive')
    .setDescription('Get the top 5 most active BSE stocks'),

  new SlashCommandBuilder()
    .setName('ipoupcoming')
    .setDescription('Get upcoming IPOs'),

  new SlashCommandBuilder()
    .setName('companyinfo')
    .setDescription('Get information about a company')
    .addStringOption(option => option.setName('company').setDescription('Company name').setRequired(true)),

  new SlashCommandBuilder()
    .setName('trendingstocks')
    .setDescription('Show top 3 gainers and losers from the stock market'),
];

// Register the commands with Discord
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
    console.error("Error registering commands: ", err);
  }
});

// Command handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'nseactive') {
      await interaction.deferReply();

      const response = await axios.get("https://stock.indianapi.in/NSE_most_active", {
        headers: { "x-api-key": process.env.INDIAN_API_KEY }
      });

      const stocks = response.data;
      if (!stocks || stocks.length === 0) {
        return interaction.editReply("❌ No data found for most active NSE stocks.");
      }

      const topStocks = stocks.slice(0, 5).map((stock, index) => {
        return `📌 **${index + 1}. ${stock.company} (${stock.ticker})**\n` +
          `💰 Price: ₹${stock.price} | 📈 Change: ${stock.net_change} (${stock.percent_change}%)\n` +
          `🔺 High: ₹${stock.high} | 🔻 Low: ₹${stock.low} | 🕒 Volume: ${stock.volume.toLocaleString()}\n` +
          `📊 Rating: ${stock.overall_rating} | 📉 Trend: ${stock.short_term_trend}, ${stock.long_term_trend}`;
      }).join("\n\n");

      return interaction.editReply(`📢 **Top 5 Most Active NSE Stocks:**\n\n${topStocks}`);
    }

    if (commandName === 'bseactive') {
      await interaction.deferReply();

      const response = await axios.get("https://stock.indianapi.in/BSE_most_active", {
        headers: { "x-api-key": process.env.INDIAN_API_KEY }
      });

      const stocks = response.data;
      if (!stocks || stocks.length === 0) {
        return interaction.editReply("❌ No data found for most active BSE stocks.");
      }

      const topStocks = stocks.slice(0, 5).map((stock, index) => {
        return `📌 **${index + 1}. ${stock.company} (${stock.ticker})**\n` +
          `💰 Price: ₹${stock.price} | 📈 Change: ${stock.net_change} (${stock.percent_change}%)\n` +
          `🔺 High: ₹${stock.high} | 🔻 Low: ₹${stock.low} | 🕒 Volume: ${stock.volume.toLocaleString()}\n` +
          `📊 Rating: ${stock.overall_rating} | 📉 Trend: ${stock.short_term_trend}, ${stock.long_term_trend}`;
      }).join("\n\n");

      return interaction.editReply(`📢 **Top 5 Most Active BSE Stocks:**\n\n${topStocks}`);
    }

    if (commandName === 'ipoupcoming') {
      await interaction.deferReply();

      const apiUrl = `https://stock.indianapi.in/ipo`;
      const response = await axios.get(apiUrl, {
        headers: { "x-api-key": process.env.INDIAN_API_KEY },
      });

      const ipoList = response.data.upcoming;
      if (!ipoList || ipoList.length === 0) {
        return interaction.editReply("❌ No upcoming IPOs available.");
      }

      const firstFive = ipoList.slice(0, 5).map((ipo, i) => {
        return `📌 **${i + 1}. ${ipo.name} (${ipo.symbol})**\n` +
          `📄 [Doc](${ipo.document_url}) | 💸 ₹${ipo.min_price || "TBA"} - ₹${ipo.max_price || "TBA"}\n` +
          `📅 Bidding: ${ipo.bidding_start_date || "TBA"} - ${ipo.bidding_end_date || "TBA"}`;
      }).join("\n\n");

      return interaction.editReply(`📢 **Upcoming IPOs (1–5):**\n\n${firstFive}`);
    }

    if (commandName === 'companyinfo') {
      await interaction.deferReply();

      const companyName = interaction.options.getString("company");
      const response = await axios.get(`https://stock.indianapi.in/stock?name=${encodeURIComponent(companyName)}`, {
        headers: { "x-api-key": process.env.INDIAN_API_KEY },
      });

      const data = response.data;
      if (data && data.companyName) {
        return interaction.editReply(`
📊 **${data.companyName}**
**Industry:** ${data.industry || "Not Available"}
**Description:** ${data.companyProfile?.companyDescription || "No description available."}
💹 **Stock Info**
- **Current Price NSE:** ₹${data.currentPrice?.NSE || "Not Available"}
- **Current Price BSE:** ₹${data.currentPrice?.BSE || "Not Available"}
- **Market Cap:** ₹${data.companyProfile?.peerCompanyList[1].marketCap || "Not Available"} Cr
        `);
      } else {
        return interaction.editReply("❌ Company data not found.");
      }
    }

    if (commandName === 'trendingstocks') {
      await interaction.deferReply();

      const response = await axios.get("https://stock.indianapi.in/trending", {
        headers: { "x-api-key": process.env.INDIAN_API_KEY }
      });

      const gainers = response.data?.trending_stocks?.top_gainers || [];
      const losers = response.data?.trending_stocks?.top_losers || [];

      if (gainers.length === 0 && losers.length === 0) {
        return interaction.editReply("❌ No trending data available at the moment.");
      }

      const gainersText = gainers.slice(0, 3).map((stock, index) => {
        return `📈 **${index + 1}. ${stock.company_name} (${stock.ticker_id})**\n` +
          `💰 Price: ₹${stock.price} | 📊 Change: ${stock.net_change} (${stock.percent_change}%)\n` +
          `🔺 High: ₹${stock.high} | 🔻 Low: ₹${stock.low} | 🕒 Volume: ${parseInt(stock.volume).toLocaleString()}`;
      }).join("\n\n");

      const losersText = losers.slice(0, 3).map((stock, index) => {
        return `📉 **${index + 1}. ${stock.company_name} (${stock.ticker_id})**\n` +
          `💰 Price: ₹${stock.price} | 📊 Change: ${stock.net_change} (${stock.percent_change}%)\n` +
          `🔺 High: ₹${stock.high} | 🔻 Low: ₹${stock.low} | 🕒 Volume: ${parseInt(stock.volume).toLocaleString()}`;
      }).join("\n\n");

      return interaction.editReply(
        `📢 **Top 3 Gainers**:\n\n${gainersText}\n\n🟥 **Top 3 Losers**:\n\n${losersText}`
      );
    }

  } catch (error) {
    console.error(error);
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply("🚨 Error occurred. Please try again later.");
    } else {
      return interaction.reply("🚨 Error occurred. Please try again later.");
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
