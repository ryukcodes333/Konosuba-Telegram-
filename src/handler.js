const KB = require("./utils/keyboards");
const DB = require("./database/db");
const { handleEconomy } = require("./commands/economy");
const { handleGambling } = require("./commands/gambling");
const { handleFun } = require("./commands/fun");
const { handleInteractions } = require("./commands/interactions");
const { handleGames, checkGameAnswer } = require("./commands/games");
const { handlePokemon } = require("./commands/pokemon");
const { handleDownloader, handleDownloaderUrl } = require("./commands/downloader");
const { handleRpg } = require("./commands/rpg");
const { handleGuild, handleGuildCommand } = require("./commands/guild");
const { handleCards } = require("./commands/cards");
const { handleVibe } = require("./commands/vibe");
const { handleMedia } = require("./commands/media");
const { handleAdmin } = require("./commands/admin");
const { handleCasino } = require("./commands/casino");
const { handleOwner, isOwner } = require("./commands/owner");
const { MARKET_ITEMS, formatNumber, capitalize } = require("./utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";
const PREFIX = process.env.BOT_PREFIX || ".";

// Helper: reply quoting the user's message
function quotedReply(ctx, text, kb) {
  const msgId = ctx.message?.message_id;
  return ctx.reply(text, { parse_mode: "Markdown", ...(kb || {}), ...(msgId ? { reply_to_message_id: msgId } : {}) });
}

async function handleCallback(ctx) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;
  await ctx.answerCbQuery().catch(() => {});

  const firstUnderscore = data.indexOf("_");
  const prefix = firstUnderscore >= 0 ? data.slice(0, firstUnderscore) : data;
  const action = firstUnderscore >= 0 ? data.slice(firstUnderscore + 1) : "";

  switch (prefix) {
    case "menu":
      return handleMenuNav(ctx, action);
    case "eco":
      return handleEconomy(ctx, action);
    case "gamb":
      return handleGambling(ctx, action);
    case "fun":
      return handleFun(ctx, action);
    case "int":
      return handleInteractions(ctx, action);
    case "game":
      return handleGames(ctx, action);
    case "poke":
      // poke_starter_bulbasaur -> action = "starter_bulbasaur"
      return handlePokemon(ctx, action);
    case "starter":
      return handlePokemon(ctx, `starter_${action}`);
    case "catch":
      return handlePokemon(ctx, `catch_${action}`);
    case "casino":
      return handleCasino(ctx, action);
    case "dl":
      return handleDownloader(ctx, action);
    case "rpg":
      return handleRpg(ctx, action);
    case "guild":
      return handleGuild(ctx, action);
    case "card":
      return handleCards(ctx, action);
    case "vibe":
      return handleVibe(ctx, action);
    case "media":
      return handleMedia(ctx, action);
    case "adm":
      return handleAdmin(ctx, action);
    default:
      return ctx.answerCbQuery("Unknown action").catch(() => {});
  }
}

async function handleMenuNav(ctx, menu) {
  const send = (t, kb) => ctx.reply(t, { parse_mode: "Markdown", ...(kb || {}) });

  switch (menu) {
    case "main":
      return send("Aqua Bot Menu\n\nChoose a category below:", KB.mainMenu());
    case "admin":
      return send("Admin Commands\n\nReply to a user or mention them for target-based commands:", KB.adminMenu());
    case "economy":
      return send("Economy\n\nEarn, spend, and manage your coins:", KB.economyMenu());
    case "gambling":
      return send("Gambling\n\nTry your luck - all bets from wallet:", KB.gamblingMenu());
    case "casino":
      return send("Casino\n\nVisual casino games with interactive buttons:", KB.casinoMenu());
    case "fun":
      return send("Fun Commands\n\nJokes, quotes, facts & games:", KB.funMenu());
    case "interactions":
      return send("Interactions\n\nReact to users - reply to a message or tag someone:", KB.interactionsMenu());
    case "games":
      return send("Games\n\nPlay mini-games below:", KB.gamesMenu());
    case "pokemon":
      return send("Pokemon\n\nCatch, train, and battle Pokemon!", KB.pokemonMenu());
    case "downloader":
      return send("Downloader\n\nDownload media from popular platforms:", KB.downloaderMenu());
    case "rpg":
      return send("RPG\n\nHunt monsters, level up, and forge gear:", KB.rpgMenu());
    case "guild":
      return send("Guild System\n\nCreate or manage your guild:", KB.guildMenu());
    case "cards":
      return send("Card Collection\n\nCollect, trade, and build your deck:", KB.cardsMenu());
    case "vibe":
      return send("Vibe Check\n\nCheck your energy and aura:", KB.vibeMenu());
    case "media":
      return send("Media Tools\n\nEnhance and edit images:", KB.mediaMenu());
    case "payments":
      return send("Payments\n\nQuick access to balance and transfers:", KB.paymentsMenu());
    default:
      return send("Aqua Bot Menu", KB.mainMenu());
  }
}

async function handleCommand(ctx) {
  const msg = ctx.message?.text || "";
  if (!msg.startsWith(PREFIX)) return false;

  const withoutPrefix = msg.slice(PREFIX.length).trim();
  const parts = withoutPrefix.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const msgId = ctx.message?.message_id;

  // Check if user is bot-banned
  const user = DB.getUser(String(ctx.from.id));
  if (user.banned && cmd !== "start") {
    return ctx.reply("You are banned from using this bot.", { reply_to_message_id: msgId });
  }

  // Save user name
  DB.saveUser(String(ctx.from.id), { name: ctx.from.first_name || ctx.from.username || "User" });

  switch (cmd) {
    case "start":
    case "menu":
    case "help":
      return ctx.reply("Aqua Bot - Menu\n\nHello! I'm *Aqua* from KONOSUBA!\n\nUse the menu below to explore all my features!", { parse_mode: "Markdown", ...KB.mainMenu(), reply_to_message_id: msgId });

    // ─── ECONOMY ──────────────────────────────────────────────
    case "balance": case "bal":   return handleEconomy(ctx, "balance");
    case "profile": case "me":    return handleEconomy(ctx, "profile");
    case "rank":                  return handleEconomy(ctx, "rank");
    case "daily":                 return handleEconomy(ctx, "daily");
    case "weekly":                return handleEconomy(ctx, "weekly");
    case "monthly":               return handleEconomy(ctx, "monthly");
    case "work":                  return handleEconomy(ctx, "work");
    case "beg":                   return handleEconomy(ctx, "beg");
    case "crime":                 return handleEconomy(ctx, "crime");
    case "fish":                  return handleEconomy(ctx, "fish");
    case "dig":                   return handleEconomy(ctx, "dig");
    case "heist":                 return handleEconomy(ctx, "heist");
    case "depositall": case "dep": return handleEconomy(ctx, "depositall");
    case "withdrawall": case "with": return handleEconomy(ctx, "withdrawall");
    case "market":                return handleEconomy(ctx, "market");
    case "inventory": case "inv": return handleEconomy(ctx, "inventory");
    case "top": case "topmoney":  return handleEconomy(ctx, "topmoney");
    case "cooldowns": case "cd":  return handleEconomy(ctx, "cooldowns");
    case "bankupgrade":           return handleEconomy(ctx, "bankupgrade");
    case "prestige":              return handleEconomy(ctx, "prestige");

    case "pay": case "transfer": {
      const amount = parseInt(args[0]);
      const eco = DB.getEconomy(String(ctx.from.id));
      const target = ctx.message.reply_to_message?.from;
      if (!target) return quotedReply(ctx, `Reply to a message to transfer.\nUsage: reply + \`${PREFIX}pay 100\``);
      if (!amount || amount < 1) return quotedReply(ctx, "Invalid amount.");
      if (eco.wallet < amount) return quotedReply(ctx, `Not enough ${CS} in wallet. You have ${CS} ${formatNumber(eco.wallet)}`);
      if (target.id === ctx.from.id) return quotedReply(ctx, "Can't pay yourself.");
      const tid = String(target.id);
      const teco = DB.getEconomy(tid);
      DB.saveEconomy(String(ctx.from.id), { wallet: eco.wallet - amount });
      DB.saveEconomy(tid, { wallet: teco.wallet + amount });
      return quotedReply(ctx, `Transferred ${CS} ${formatNumber(amount)} to *${target.first_name}*!`);
    }

    case "buy": {
      const itemName = args.join(" ");
      if (!itemName) return quotedReply(ctx, `Usage: \`${PREFIX}buy <item name>\`\n\nUse \`${PREFIX}market\` to see available items.`);
      const item = MARKET_ITEMS.find(i => i.name.toLowerCase() === itemName.toLowerCase());
      if (!item) return quotedReply(ctx, `Item *${itemName}* not found.\n\nUse \`${PREFIX}market\` to see items.`);
      const eco = DB.getEconomy(String(ctx.from.id));
      if (eco.wallet < item.price) return quotedReply(ctx, `Need ${CS} ${formatNumber(item.price)}.\nYour wallet: ${CS} ${formatNumber(eco.wallet)}`);
      DB.saveEconomy(String(ctx.from.id), { wallet: eco.wallet - item.price });
      DB.addItem(String(ctx.from.id), item.name);
      return quotedReply(ctx, `Purchased *${item.name}* for ${CS} ${formatNumber(item.price)}!\n\n_${item.desc}_`, KB.back("economy"));
    }

    case "sell": {
      const itemName = args.slice(0, -1).join(" ") || args.join(" ");
      const qty = parseInt(args[args.length - 1]) || 1;
      if (!itemName) return quotedReply(ctx, `Usage: \`${PREFIX}sell <item name> [quantity]\``);
      const item = MARKET_ITEMS.find(i => i.name.toLowerCase() === itemName.toLowerCase());
      if (!item) return quotedReply(ctx, `Item not found.`);
      const inv = DB.getInventory(String(ctx.from.id));
      if (!inv[item.name] || inv[item.name] < qty) return quotedReply(ctx, `You don't have enough *${item.name}*.`);
      for (let i = 0; i < qty; i++) DB.removeItem(String(ctx.from.id), item.name);
      const sellPrice = Math.floor(item.price * 0.5 * qty);
      const eco = DB.getEconomy(String(ctx.from.id));
      DB.saveEconomy(String(ctx.from.id), { wallet: eco.wallet + sellPrice });
      return quotedReply(ctx, `Sold ${qty}x *${item.name}* for ${CS} ${formatNumber(sellPrice)}!`);
    }

    // ─── GAMBLING ──────────────────────────────────────────────
    case "coinflip": case "cf": {
      const amount = parseInt(args[0]) || 100;
      return handleGambling(ctx, `coinflip_${amount}`);
    }
    case "slots": {
      const amount = parseInt(args[0]) || 100;
      return handleGambling(ctx, `slots_${amount}`);
    }
    case "blackjack": case "bj": {
      const amount = parseInt(args[0]);
      if (!amount) return handleCasino(ctx, "bj_0");
      return handleCasino(ctx, `bj_${amount}`);
    }
    case "roulette": case "rou": {
      const amount = parseInt(args[0]) || 0;
      return handleCasino(ctx, `roulette_${amount}`);
    }
    case "dice": {
      const amount = parseInt(args[0]) || 0;
      return handleCasino(ctx, `dice_${amount}`);
    }
    case "slots": {
      const amount = parseInt(args[0]) || 0;
      return handleCasino(ctx, `slots_${amount}`);
    }
    case "crash": {
      const amount = parseInt(args[0]) || 100;
      return handleGambling(ctx, `crash_${amount}`);
    }
    case "lottery":
      return handleGambling(ctx, "lottery");
    case "casino":
      return ctx.reply("Casino Games\n\nChoose a game below!", { parse_mode: "Markdown", ...KB.casinoMenu(), reply_to_message_id: msgId });

    // ─── FUN ──────────────────────────────────────────────────
    case "joke":    return handleFun(ctx, "joke");
    case "quote":   return handleFun(ctx, "quote");
    case "fact":    return handleFun(ctx, "fact");
    case "truth":   return handleFun(ctx, "truth");
    case "dare":    return handleFun(ctx, "dare");
    case "wyr":     return handleFun(ctx, "wyr");
    case "8ball":   return handleFun(ctx, "8ball", args);
    case "rps":     return handleFun(ctx, `rps_${args[0] || "rock"}`);

    // ─── INTERACTIONS ─────────────────────────────────────────
    case "hug":      return handleInteractions(ctx, "hug");
    case "kiss":     return handleInteractions(ctx, "kiss");
    case "pat":      return handleInteractions(ctx, "pat");
    case "slap":     return handleInteractions(ctx, "slap");
    case "punch":    return handleInteractions(ctx, "punch");
    case "bite":     return handleInteractions(ctx, "bite");
    case "cuddle":   return handleInteractions(ctx, "cuddle");
    case "poke":     return handleInteractions(ctx, "poke");
    case "tickle":   return handleInteractions(ctx, "tickle");
    case "wave":     return handleInteractions(ctx, "wave");
    case "highfive": return handleInteractions(ctx, "highfive");
    case "stare":    return handleInteractions(ctx, "stare");
    case "blush":    return handleInteractions(ctx, "blush");
    case "smile":    return handleInteractions(ctx, "smile");
    case "cry":      return handleInteractions(ctx, "cry");
    case "laugh":    return handleInteractions(ctx, "laugh");
    case "dance":    return handleInteractions(ctx, "dance");
    case "angry":    return handleInteractions(ctx, "angry");
    case "sleep":    return handleInteractions(ctx, "sleep");

    // ─── GAMES ────────────────────────────────────────────────
    case "hangman":     return handleGames(ctx, "hangman");
    case "riddle":      return handleGames(ctx, "riddle");
    case "trivia":      return handleGames(ctx, "trivia");
    case "mathquiz":    return handleGames(ctx, "mathquiz");
    case "wordgame":    return handleGames(ctx, "wordgame");
    case "guessnumber": return handleGames(ctx, "guessnumber");
    case "fasttype":    return handleGames(ctx, "fasttype");
    case "minesweeper": return handleGames(ctx, "minesweeper");
    case "arcade":      return handleGames(ctx, "arcade");
    case "leaderboard": return handleGames(ctx, "leaderboard");

    // ─── POKEMON ──────────────────────────────────────────────
    case "starter":
      return handlePokemon(ctx, "starter");

    case "hunt": case "pokehunt":
      return handlePokemon(ctx, "hunt");

    case "catch": case "pokecatch":
      return handlePokemon(ctx, "catch");

    case "party": {
      if (args[0]) return handlePokemon(ctx, `party_${args[0]}`);
      return handlePokemon(ctx, "party");
    }

    case "pc":
      return handlePokemon(ctx, "pc");

    case "pokedex": case "dex": {
      if (!args[0]) return quotedReply(ctx, `Usage: \`${PREFIX}dex <pokemon name>\``);
      return handlePokemon(ctx, `dex_${args[0].toLowerCase()}`);
    }

    case "pokeheal": case "heal":
      return handlePokemon(ctx, "heal");

    case "pokeshop":
      return handlePokemon(ctx, "shop");

    case "pokemon":
      return ctx.reply("Pokemon Menu", { parse_mode: "Markdown", ...KB.pokemonMenu(), reply_to_message_id: msgId });

    // ─── DOWNLOADER ───────────────────────────────────────────
    case "ytmp3": case "ytmp4": case "tiktok": case "instagram": case "facebook":
      return handleDownloader(ctx, `${cmd}_prompt`);

    // ─── RPG ──────────────────────────────────────────────────
    case "rpgstats": case "stats": return handleRpg(ctx, "stats");
    case "rpghunt":  return handleRpg(ctx, "hunt");
    case "boss":     return handleRpg(ctx, "boss");
    case "raid":     return handleRpg(ctx, "raid");
    case "dungeon":  return handleRpg(ctx, "dungeon");
    case "quest":    return handleRpg(ctx, "quest");
    case "skills":   return handleRpg(ctx, "skills");
    case "forge":    return handleRpg(ctx, "forge");
    case "rpgshop":  return handleRpg(ctx, "shop");
    case "myparty":  return handleRpg(ctx, "party");

    // ─── GUILD ────────────────────────────────────────────────
    case "createguild":
    case "joinguild":
    case "leaveguild":
      return handleGuildCommand(ctx, cmd, args);

    case "guild":      return handleGuild(ctx, "info");
    case "topguilds":  return handleGuild(ctx, "top");

    // ─── CARDS ────────────────────────────────────────────────
    case "cards": case "collection": return handleCards(ctx, "collection");
    case "deck":                     return handleCards(ctx, "deck");
    case "stardust":                 return handleCards(ctx, "stardust");

    // ─── VIBE ─────────────────────────────────────────────────
    case "vibe":      return handleVibe(ctx, "vibe");
    case "vibecheck": return handleVibe(ctx, "vibecheck");
    case "energy":    return handleVibe(ctx, "energy");
    case "aura":      return handleVibe(ctx, "aura");
    case "rizz":      return handleVibe(ctx, "rizz");
    case "sigma":     return handleVibe(ctx, "sigma");
    case "ratio":     return handleVibe(ctx, "ratio");
    case "npc":       return handleVibe(ctx, "npc");
    case "cope":      return handleVibe(ctx, "cope");
    case "mood":      return handleVibe(ctx, "mood");
    case "slay":      return handleVibe(ctx, "slay");
    case "ghost":     return handleVibe(ctx, "ghost");
    case "toxic":     return handleVibe(ctx, "toxic");
    case "sus":       return handleVibe(ctx, "sus");
    case "clout":     return handleVibe(ctx, "clout");

    // ─── ADMIN ────────────────────────────────────────────────
    case "kick":       return handleAdmin(ctx, "kick",       args);
    case "ban":        return handleAdmin(ctx, "ban",        args);
    case "unban":      return handleAdmin(ctx, "unban",      args);
    case "mute":       return handleAdmin(ctx, "mute",       args);
    case "unmute":     return handleAdmin(ctx, "unmute",     args);
    case "warn":       return handleAdmin(ctx, "warn",       args);
    case "warnings":   return handleAdmin(ctx, "warnings",   args);
    case "clearwarns": return handleAdmin(ctx, "clearwarns", args);
    case "promote":    return handleAdmin(ctx, "promote",    args);
    case "demote":     return handleAdmin(ctx, "demote",     args);
    case "lock":       return handleAdmin(ctx, "lock");
    case "unlock":     return handleAdmin(ctx, "unlock");
    case "tagall":     return handleAdmin(ctx, "tagall",     args);
    case "invitelink": return handleAdmin(ctx, "invitelink");
    case "stafflist":  return handleAdmin(ctx, "stafflist");
    case "myrole":     return handleAdmin(ctx, "myrole");

    // ─── OWNER COMMANDS (only shown/executed if owner) ────────
    case "give": case "addcoins":
      return handleOwner(ctx, "give", args);
    case "take": case "removecoins":
      return handleOwner(ctx, "take", args);
    case "setcoins":
      return handleOwner(ctx, "setcoins", args);
    case "addbank":
      return handleOwner(ctx, "addbank", args);
    case "reseteconomy":
      return handleOwner(ctx, "reseteconomy", args);
    case "addxp":
      return handleOwner(ctx, "addxp", args);
    case "setlevel":
      return handleOwner(ctx, "setlevel", args);
    case "setprestige":
      return handleOwner(ctx, "setprestige", args);
    case "givepokemon":
      return handleOwner(ctx, "givepokemon", args);
    case "setpokemonlevel":
      return handleOwner(ctx, "setpokemonlevel", args);
    case "clearparty":
      return handleOwner(ctx, "clearparty", args);
    case "clearpc":
      return handleOwner(ctx, "clearpc", args);
    case "giveballs":
      return handleOwner(ctx, "giveballs", args);
    case "givemasterball":
      return handleOwner(ctx, "givemasterball", args);
    case "giveitem":
      return handleOwner(ctx, "giveitem", args);
    case "resetpokedex":
      return handleOwner(ctx, "resetpokedex", args);
    case "resetpokemon":
      return handleOwner(ctx, "resetpokemon", args);
    case "resetuser":
      return handleOwner(ctx, "resetuser", args);
    case "botban":
      return handleOwner(ctx, "botban", args);
    case "botunban":
      return handleOwner(ctx, "botunban", args);
    case "userinfo":
      return handleOwner(ctx, "userinfo", args);
    case "allusers":
      return handleOwner(ctx, "allusers", args);
    case "allgroups":
      return handleOwner(ctx, "allgroups", args);
    case "topbalance":
      return handleOwner(ctx, "topbalance", args);
    case "clearcooldowns":
      return handleOwner(ctx, "clearcooldowns", args);
    case "clearallcooldowns":
      return handleOwner(ctx, "clearallcooldowns", args);
    case "clearinventory":
      return handleOwner(ctx, "clearinventory", args);
    case "clearwarnings":
      return handleOwner(ctx, "clearwarnings", args);
    case "broadcast":
      return handleOwner(ctx, "broadcast", args);
    case "groupbroadcast":
      return handleOwner(ctx, "groupbroadcast", args);
    case "join":
      return handleOwner(ctx, "join", args);
    case "leave":
      return handleOwner(ctx, "leave", args);
    case "ping":
      return handleOwner(ctx, "ping", args);
    case "uptime":
      return handleOwner(ctx, "uptime", args);
    case "botstats":
      return handleOwner(ctx, "stats", args);
    case "eval":
      return handleOwner(ctx, "eval", args);
    case "shell":
      return handleOwner(ctx, "shell", args);
    case "restart":
      return handleOwner(ctx, "restart", args);
    case "sendmessage":
      return handleOwner(ctx, "sendmessage", args);
    case "setbotname":
      return handleOwner(ctx, "setbotname", args);
    case "setbotdesc":
      return handleOwner(ctx, "setbotdesc", args);
    case "setbotshortdesc":
      return handleOwner(ctx, "setbotshortdesc", args);
    case "getchatid":
      return handleOwner(ctx, "getchatid", args);
    case "chatinfo":
      return handleOwner(ctx, "chatinfo", args);
    case "admins":
      return handleOwner(ctx, "admins", args);
    case "invite":
      return handleOwner(ctx, "invite", args);
    case "lockgroup":
      return handleOwner(ctx, "lockgroup", args);
    case "unlockgroup":
      return handleOwner(ctx, "unlockgroup", args);
    case "pinmessage":
      return handleOwner(ctx, "pinmessage", args);
    case "unpinall":
      return handleOwner(ctx, "unpinall", args);
    case "deletedb":
      return handleOwner(ctx, "deletedb", args);
    case "setcurrency":
      return handleOwner(ctx, "setcurrency", args);
    case "setprefix":
      return handleOwner(ctx, "setprefix", args);
    case "setwelcome":
      return handleOwner(ctx, "setwelcome", args);
    case "welcome_on":
      return handleOwner(ctx, "welcome_on", args);
    case "welcome_off":
      return handleOwner(ctx, "welcome_off", args);
    case "antilink_on":
      return handleOwner(ctx, "antilink_on", args);
    case "antilink_off":
      return handleOwner(ctx, "antilink_off", args);
    case "anticap_on":
      return handleOwner(ctx, "anticap_on", args);
    case "anticap_off":
      return handleOwner(ctx, "anticap_off", args);
    case "antispam_on":
      return handleOwner(ctx, "antispam_on", args);
    case "antispam_off":
      return handleOwner(ctx, "antispam_off", args);
    case "ownerhelp":
      return handleOwner(ctx, "ownerhelp", args);

    default: return false;
  }
}

async function handleTextMessage(ctx) {
  const text = ctx.message?.text || "";
  if (!text) return;

  if (text.startsWith(PREFIX)) {
    const handled = await handleCommand(ctx);
    if (handled !== false) return;
  }

  const chatId = String(ctx.chat.id);
  const gameResult = checkGameAnswer(text, chatId);
  if (gameResult) {
    const uid = String(ctx.from.id);
    const u = DB.getUser(uid);
    DB.saveUser(uid, { xp: (u.xp || 0) + 25 });
    return ctx.reply(`*${ctx.from.first_name}* - ${gameResult}`, { parse_mode: "Markdown", reply_to_message_id: ctx.message.message_id });
  }

  if (/https?:\/\//i.test(text)) {
    const settings = DB.getChatSettings(chatId);
    if (settings.antilink) {
      try { await ctx.deleteMessage(); } catch {}
      return;
    }
    const handled = await handleDownloaderUrl(ctx, text);
    if (handled) return;
  }
}

module.exports = { handleCallback, handleTextMessage };
