# 🌊 Aqua Bot — Telegram Bot

A full-featured Telegram bot named **Aqua** (inspired by KONOSUBA), built with [Telegraf v4](https://telegraf.js.org/).

---

## 🚀 Features

| Category | Commands |
|---|---|
| ⚙️ **Admin** | kick, ban, unban, mute, unmute, warn, promote, demote, lock, unlock, tagall, invitelink, stafflist, anti-link |
| 💰 **Economy** | balance, daily, weekly, monthly, work, beg, crime, fish, dig, heist, deposit, withdraw, market, inventory, prestige |
| 🎲 **Gambling** | coinflip, slots, blackjack, roulette, dice, crash, lottery, high/low |
| 🎉 **Fun** | joke, quote, fact, truth, dare, wyr, 8ball, rock-paper-scissors |
| 💞 **Interactions** | hug, kiss, pat, slap, punch, bite, cuddle, poke, tickle, wave, highfive, dance, cry, laugh |
| 🎮 **Games** | hangman, riddle, trivia, mathquiz, word scramble, guess number, fast type, minesweeper |
| 🐾 **Pokémon** | choose starter, hunt, catch, party, PC, heal — with real PokeAPI images |
| ⬇️ **Downloader** | YouTube MP3/MP4, TikTok, Instagram, Facebook |
| ⚔️ **RPG** | hunt, boss, dungeon, raid, quests, skills, forge, shop |
| 🏰 **Guild** | create, join, leave, view, top guilds |
| 🎴 **Cards** | collection, deck, bronze/silver/gold/platinum/diamond packs |
| 🔥 **Vibe** | vibe check, aura, rizz, sigma, ratio, NPC, cope, mood, slay, clout |
| 📱 **Media** | upscale, enhance, remini, remove BG, night/sunset/rain filters |
| 💸 **Payments** | in-bot wallet transfers with `.pay` |

---

## 📋 Requirements

- Node.js 18+
- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `BOT_TOKEN` | **Required** — Your Telegram bot token | — |
| `OWNER_ID` | Your Telegram user ID (for owner commands) | — |
| `BOT_PREFIX` | Command prefix | `.` |
| `CURRENCY_SYMBOL` | In-game currency icon | `💎` |
| `STARTING_BALANCE` | Starting wallet balance for new users | `500` |
| `DAILY_REWARD` | Base daily reward | `200` |
| `WEEKLY_REWARD` | Base weekly reward | `1000` |
| `MONTHLY_REWARD` | Base monthly reward | `5000` |
| `WEBHOOK_URL` | Your public HTTPS URL for webhook mode (leave blank for polling) | — |
| `PORT` | Port for webhook server | `3000` |

---

## 🏃 Running Locally

```bash
# Install dependencies
npm install

# Start the bot (polling mode — great for local dev)
npm start

# Or with auto-reload
npm run dev
```

---

## ☁️ Deploying to Render

### 1. Push to GitHub

Push your `telegram-bot/` folder (or the whole repo) to a GitHub repository.

### 2. Create a New Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Fill in the settings:

| Field | Value |
|---|---|
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Root Directory** | `telegram-bot` (if not at repo root) |
| **Environment** | Node |
| **Plan** | Free (or Starter for no sleep) |

### 3. Add Environment Variables on Render

In your Render service dashboard → **Environment** tab, add:

- `BOT_TOKEN` = your bot token
- `OWNER_ID` = your Telegram user ID
- `WEBHOOK_URL` = your Render service URL (e.g. `https://aqua-bot.onrender.com`)
- `PORT` = `3000`
- Any other variables from `.env.example`

### 4. Deploy

Click **Deploy**. Render will build and start your bot. It will automatically use **webhook mode** when `WEBHOOK_URL` is set.

> ⚠️ **Free Render plans sleep after inactivity.** Use a paid plan or a service like [UptimeRobot](https://uptimerobot.com/) to keep your bot awake by pinging your service URL every 5 minutes.

---

## 📂 Project Structure

```
telegram-bot/
├── index.js               # Entry point — bot setup, launch
├── package.json
├── .env.example           # Environment variable template
├── data/                  # JSON database files (auto-created)
└── src/
    ├── handler.js         # Routes all commands and callbacks
    ├── commands/
    │   ├── admin.js
    │   ├── cards.js
    │   ├── downloader.js
    │   ├── economy.js
    │   ├── fun.js
    │   ├── games.js
    │   ├── guild.js
    │   ├── interactions.js
    │   ├── media.js
    │   ├── pokemon.js
    │   ├── rpg.js
    │   └── vibe.js
    ├── database/
    │   └── db.js          # JSON file-based database
    └── utils/
        ├── helpers.js     # Shared utilities + PokeAPI fetch
        └── keyboards.js   # All inline keyboard menus
```

---

## 🎮 Usage Examples

```
.menu          — Open the main menu with inline buttons
.daily         — Claim daily reward
.balance       — Check your wallet & bank
.work          — Earn coins (1h cooldown)
.slots 500     — Gamble 500 coins on slots
.dex pikachu   — Look up a Pokémon with official artwork
.party         — View your Pokémon party
.hangman       — Start a hangman game
.hug           — Send a hug (reply to a message to target someone)
.vibe          — Check your vibe
```

---

## 📝 Notes

- **Database**: All data is stored in flat JSON files under `data/`. For a production bot, consider migrating to SQLite or PostgreSQL.
- **Downloader**: The downloader module shows instructions for URLs but requires a server-side tool (e.g. `yt-dlp`) to actually download media. Install `yt-dlp` on your server and extend `src/commands/downloader.js`.
- **Media filters**: Require an external image API (e.g. remove.bg). Add your API key to `.env` and hook it into `src/commands/media.js`.
- **Pokémon images**: Fetched live from [PokeAPI](https://pokeapi.co/) — official artwork included.

---

## 💙 Credits

Inspired by the KONOSUBA anime — named after **Aqua**, the troublesome but lovable water goddess.
