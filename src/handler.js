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
const { MARKET_ITEMS, formatNumber, capitalize } = require("./utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";
const PREFIX = process.env.BOT_PREFIX || ".";

async function handleCallback(ctx) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;
  await ctx.answerCbQuery().catch(() => {});

  const [prefix, ...rest] = data.split("_");
  const action = rest.join("_");

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
      return handlePokemon(ctx, action);
    case "starter":
      return handlePokemon(ctx, `starter_${action}`);
    case "catch":
      return handlePokemon(ctx, `catch_${action}`);
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
      return ctx.answerCbQuery("❓ Unknown action").catch(() => {});
  }
}

async function handleMenuNav(ctx, menu) {
  const edit = (t, kb) => ctx.editMessageText(t, { parse_mode: "Markdown", ...kb }).catch(() => ctx.reply(t, { parse_mode: "Markdown", ...kb }));

  switch (menu) {
    case "main":
      return edit("🌊 *Aqua Bot Menu*\n\nChoose a category below:", KB.mainMenu());
    case "admin":
      return edit("⚙️ *Admin Commands*\n\nReply to a user or mention them for target-based commands:", KB.adminMenu());
    case "economy":
      return edit("💰 *Economy*\n\nEarn, spend, and manage your coins:", KB.economyMenu());
    case "gambling":
      return edit("🎲 *Gambling*\n\nTry your luck — all bets from wallet:", KB.gamblingMenu());
    case "fun":
      return edit("🎉 *Fun Commands*\n\nJokes, quotes, facts & games:", KB.funMenu());
    case "interactions":
      return edit("💞 *Interactions*\n\nReact to users — reply to a message or tag someone:", KB.interactionsMenu());
    case "games":
      return edit("🎮 *Games*\n\nPlay mini-games below:", KB.gamesMenu());
    case "pokemon":
      return edit("🐾 *Pokémon*\n\nCatch, train, and battle Pokémon!", KB.pokemonMenu());
    case "downloader":
      return edit("⬇️ *Downloader*\n\nDownload media from popular platforms:", KB.downloaderMenu());
    case "rpg":
      return edit("⚔️ *RPG*\n\nHunt monsters, level up, and forge gear:", KB.rpgMenu());
    case "guild":
      return edit("🏰 *Guild System*\n\nCreate or manage your guild:", KB.guildMenu());
    case "cards":
      return edit("🎴 *Card Collection*\n\nCollect, trade, and build your deck:", KB.cardsMenu());
    case "vibe":
      return edit("🔥 *Vibe Check*\n\nCheck your energy and aura:", KB.vibeMenu());
    case "media":
      return edit("📱 *Media Tools*\n\nEnhance and edit images:", KB.mediaMenu());
    case "payments":
      return edit("💸 *Payments*\n\nQuick access to balance and transfers:", KB.paymentsMenu());
    default:
      return edit("🌊 *Aqua Bot Menu*", KB.mainMenu());
  }
}

async function handleCommand(ctx) {
  const msg = ctx.message?.text || "";
  if (!msg.startsWith(PREFIX)) return false;

  const withoutPrefix = msg.slice(PREFIX.length).trim();
  const parts = withoutPrefix.split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "start":
    case "menu":
    case "help":
      return ctx.reply("🌊 *Aqua Bot — Menu*\n\nHello! I'm *Aqua* from KONOSUBA! 💙\n\nUse the menu below to explore all my features!", { parse_mode: "Markdown", ...KB.mainMenu() });

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
      const amount = parseInt(args[1]);
      const eco = DB.getEconomy(String(ctx.from.id));
      const target = ctx.message.reply_to_message?.from;
      if (!target) return ctx.reply(`❌ Reply to a message to transfer. Usage: \`${PREFIX}pay @user 100\``, { parse_mode: "Markdown" });
      if (!amount || amount < 1) return ctx.reply("❌ Invalid amount.");
      if (eco.wallet < amount) return ctx.reply(`❌ Not enough ${CS} in wallet. You have ${CS} ${formatNumber(eco.wallet)}`);
      if (target.id === ctx.from.id) return ctx.reply("❌ Can't pay yourself.");
      const tid = String(target.id);
      const teco = DB.getEconomy(tid);
      DB.saveEconomy(String(ctx.from.id), { wallet: eco.wallet - amount });
      DB.saveEconomy(tid, { wallet: teco.wallet + amount });
      return ctx.reply(`✅ Transferred ${CS} ${formatNumber(amount)} to *${target.first_name}*!`, { parse_mode: "Markdown" });
    }

    case "buy": {
      const itemName = args.join(" ");
      if (!itemName) return ctx.reply(`❌ Usage: \`${PREFIX}buy <item name>\`\n\nUse \`${PREFIX}market\` to see available items.`, { parse_mode: "Markdown" });
      const item = MARKET_ITEMS.find(i => i.name.toLowerCase() === itemName.toLowerCase());
      if (!item) return ctx.reply(`❌ Item *${itemName}* not found.\n\nUse \`${PREFIX}market\` to see items.`, { parse_mode: "Markdown" });
      const eco = DB.getEconomy(String(ctx.from.id));
      if (eco.wallet < item.price) return ctx.reply(`❌ Need ${CS} ${formatNumber(item.price)}.\nYour wallet: ${CS} ${formatNumber(eco.wallet)}`);
      DB.saveEconomy(String(ctx.from.id), { wallet: eco.wallet - item.price });
      DB.addItem(String(ctx.from.id), item.name);
      return ctx.reply(`✅ Purchased *${item.name}* for ${CS} ${formatNumber(item.price)}!\n\n_${item.desc}_`, { parse_mode: "Markdown", ...KB.back("economy") });
    }

    case "give": case "addmoney": {
      if (String(ctx.from.id) !== process.env.OWNER_ID) return ctx.reply("❌ Owner only.");
      const target = ctx.message.reply_to_message?.from;
      const amount = parseInt(args[0]) || parseInt(args[1]);
      if (!target || !amount) return ctx.reply(`❌ Usage: reply to a message and use \`${PREFIX}give 500\``);
      const teco = DB.getEconomy(String(target.id));
      DB.saveEconomy(String(target.id), { wallet: teco.wallet + amount });
      return ctx.reply(`✅ Added ${CS} ${formatNumber(amount)} to *${target.first_name}*'s wallet.`, { parse_mode: "Markdown" });
    }

    case "joke":    return handleFun(ctx, "joke");
    case "quote":   return handleFun(ctx, "quote");
    case "fact":    return handleFun(ctx, "fact");
    case "truth":   return handleFun(ctx, "truth");
    case "dare":    return handleFun(ctx, "dare");
    case "wyr":     return handleFun(ctx, "wyr");
    case "8ball":   return handleFun(ctx, "8ball", args);
    case "rps":     return handleFun(ctx, `rps_${args[0] || "rock"}`);

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

    case "pokedex": case "dex":
      if (!args[0]) return ctx.reply(`❌ Usage: \`${PREFIX}dex <pokemon name>\``, { parse_mode: "Markdown" });
      return handlePokemon(ctx, `dex_${args[0]}`);
    case "party":    return handlePokemon(ctx, "party");
    case "pc":       return handlePokemon(ctx, "pc");
    case "hunt": {
      if (!ctx.message.text.includes("poke") && !ctx.message.text.includes("pokemon")) break;
      return handlePokemon(ctx, "hunt");
    }
    case "pokeheal": return handlePokemon(ctx, "heal");
    case "starter":  return handlePokemon(ctx, "starter");
    case "pokeshop": return handlePokemon(ctx, "shop");

    case "ytmp3": case "ytmp4": case "tiktok": case "instagram": case "facebook":
      return handleDownloader(ctx, `${cmd}_prompt`);

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

    case "createguild":
    case "joinguild":
    case "leaveguild":
      return handleGuildCommand(ctx, cmd, args);

    case "guild":      return handleGuild(ctx, "info");
    case "topguilds":  return handleGuild(ctx, "top");

    case "cards": case "collection": return handleCards(ctx, "collection");
    case "deck":                     return handleCards(ctx, "deck");
    case "stardust":                 return handleCards(ctx, "stardust");

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

    default: return false;
  }
  return false;
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
    DB.saveUser(String(ctx.from.id), { xp: (DB.getUser(String(ctx.from.id)).xp || 0) + 25 });
    return ctx.reply(`*${ctx.from.first_name}* — ${gameResult}`, { parse_mode: "Markdown" });
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
