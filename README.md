# LordARAM

LordARAM is a Discord bot that retrieves the latest meta builds for League of Legends champions in ARAM. The bot utilizes *axios* and *cheerio* to scrape data from various sources and provide up-to-date statistics and build recommendations.

![A screenshot of the widget generated by the bot](https://i.imgur.com/DraXLfC.png)

## Self-hosting

### Requirements

- Node.js installed (v14 or higher)
- npm (Node package manager)
- A Discord bot token (You can create a bot on the [Discord Developer Portal](https://discord.com/developers/applications))

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/lord-aram.git
    cd lord-aram
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `config.json` file in the root directory and add your Discord bot token:
    ```json
    {
      "token": "your-bot-token-here"
    }
    ```

4. Start the bot:
    ```bash
    node index.js
    ```

## Usage

[Invite](https://discord.com/oauth2/authorize?client_id=1239836778148663307&scope=bot&permissions=0) the bot to your Discord server and use the `/aram` command!

To get the ARAM stats for the champion "Corki":
```bash
/aram Corki
```
