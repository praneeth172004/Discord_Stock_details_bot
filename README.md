📈 Stock Market Discord Bot
A powerful Discord bot built using Discord.js and Indian Stock Market API that provides real-time stock insights, including most active stocks, upcoming IPOs, trending stocks, and detailed company info.

✨ Features
📌 Most Active Stocks: Get top 5 most active stocks from NSE or BSE.

🆕 Upcoming IPOs: Lists the latest IPOs with dates and price ranges.

🔍 Company Info: Fetch detailed information about a company including prices, industry, and profile.

📊 Trending Stocks: View top gainers and losers in the market.

🛠️ Tech Stack
Node.js

Express.js

Discord.js v14

Axios

Indian Stock Market API

🧪 Commands
Command	Description
/nseactive	Top 5 most active stocks in NSE
/bseactive	Top 5 most active stocks in BSE
/ipoupcoming	List of upcoming IPOs
/companyinfo	Get info about a company (requires name input)
/trendingstocks	Shows top 3 gainers and top 3 losers
📦 Setup Instructions
1. Clone the repository
bash
Copy
Edit
git clone https://github.com/<your-username>/stock-market-discord-bot.git
cd stock-market-discord-bot
2. Install dependencies
bash
Copy
Edit
npm install
3. Create .env file
Create a .env file in the root directory with the following:

env
Copy
Edit
DISCORD_BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_client_id
INDIAN_API_KEY=your_indian_stock_api_key
PORT=3000
🔐 Make sure to keep your tokens and keys secret and never commit .env to GitHub.

4. Run the bot
bash
Copy
Edit
node index.js
Your bot should now be live on Discord and the Express server should keep it awake on platforms like Replit, Railway, or Render.

🧠 Future Improvements
Add support for buttons and pagination

Save company search history

Alerting system for stock price targets

Web dashboard for bot statistics

🤝 Contributions
Contributions, suggestions, and feedback are welcome! Feel free to open an issue or submit a PR.

📄 License
This project is open-sourced under the MIT License.

