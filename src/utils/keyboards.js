const { Markup } = require("telegraf");

const KB = {
  mainMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("⚙️ Admin", "menu_admin"), Markup.button.callback("💰 Economy", "menu_economy")],
      [Markup.button.callback("🎲 Gambling", "menu_gambling"), Markup.button.callback("🎰 Casino", "menu_casino")],
      [Markup.button.callback("🎉 Fun", "menu_fun"), Markup.button.callback("💞 Interactions", "menu_interactions")],
      [Markup.button.callback("🎮 Games", "menu_games"), Markup.button.callback("🐾 Pokemon", "menu_pokemon")],
      [Markup.button.callback("⬇️ Downloader", "menu_downloader"), Markup.button.callback("⚔️ RPG", "menu_rpg")],
      [Markup.button.callback("🏰 Guild", "menu_guild"), Markup.button.callback("🎴 Cards", "menu_cards")],
      [Markup.button.callback("🔥 Vibe", "menu_vibe"), Markup.button.callback("📱 Media", "menu_media")],
      [Markup.button.callback("💸 Payments", "menu_payments")],
    ]),

  back: (target = "main") =>
    Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", `menu_${target}`)]]),

  backAndRefresh: (current, backTarget = "main") =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🔄 Refresh", `menu_${current}`), Markup.button.callback("🔙 Back", `menu_${backTarget}`)],
    ]),

  adminMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("👢 Kick", "adm_kick"), Markup.button.callback("🔇 Mute", "adm_mute"), Markup.button.callback("🔊 Unmute", "adm_unmute")],
      [Markup.button.callback("⚠️ Warn", "adm_warn"), Markup.button.callback("📋 Warnings", "adm_warnings"), Markup.button.callback("🗑 ClearWarns", "adm_clearwarns")],
      [Markup.button.callback("⬆️ Promote", "adm_promote"), Markup.button.callback("⬇️ Demote", "adm_demote")],
      [Markup.button.callback("🚫 Ban", "adm_ban"), Markup.button.callback("✅ Unban", "adm_unban")],
      [Markup.button.callback("🔒 Lock", "adm_lock"), Markup.button.callback("🔓 Unlock", "adm_unlock")],
      [Markup.button.callback("📢 Tag All", "adm_tagall"), Markup.button.callback("🔗 Invite Link", "adm_invitelink")],
      [Markup.button.callback("🔗 Anti-Link ON", "adm_antilink_on"), Markup.button.callback("Anti-Link OFF", "adm_antilink_off")],
      [Markup.button.callback("🛡 Staff List", "adm_stafflist"), Markup.button.callback("🏷 My Role", "adm_myrole")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  economyMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 Balance", "eco_balance"), Markup.button.callback("📊 Profile", "eco_profile"), Markup.button.callback("⭐ Rank", "eco_rank")],
      [Markup.button.callback("🌅 Daily", "eco_daily"), Markup.button.callback("📅 Weekly", "eco_weekly"), Markup.button.callback("📆 Monthly", "eco_monthly")],
      [Markup.button.callback("💼 Work", "eco_work"), Markup.button.callback("🤲 Beg", "eco_beg"), Markup.button.callback("🦹 Crime", "eco_crime")],
      [Markup.button.callback("🎣 Fish", "eco_fish"), Markup.button.callback("⛏️ Dig", "eco_dig"), Markup.button.callback("🏴‍☠️ Heist", "eco_heist")],
      [Markup.button.callback("🏦 Deposit All", "eco_depositall"), Markup.button.callback("💸 Withdraw All", "eco_withdrawall")],
      [Markup.button.callback("🛒 Market", "eco_market"), Markup.button.callback("🎒 Inventory", "eco_inventory")],
      [Markup.button.callback("🏆 Top Money", "eco_topmoney"), Markup.button.callback("⏳ Cooldowns", "eco_cooldowns")],
      [Markup.button.callback("⬆️ Upgrade Bank", "eco_bankupgrade"), Markup.button.callback("🌟 Prestige", "eco_prestige")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  gamblingMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🪙 Coinflip 100", "gamb_coinflip_100"), Markup.button.callback("🪙 Coinflip 500", "gamb_coinflip_500")],
      [Markup.button.callback("🎰 Slots 100", "gamb_slots_100"), Markup.button.callback("🎰 Slots 500", "gamb_slots_500")],
      [Markup.button.callback("🃏 Blackjack 100", "gamb_bj_100"), Markup.button.callback("🃏 Blackjack 500", "gamb_bj_500")],
      [Markup.button.callback("🎡 Roulette Red", "gamb_rou_red"), Markup.button.callback("🎡 Roulette Black", "gamb_rou_black")],
      [Markup.button.callback("🎲 Dice 100", "gamb_dice_100"), Markup.button.callback("🎲 Dice 500", "gamb_dice_500")],
      [Markup.button.callback("📈 Crash 100", "gamb_crash_100"), Markup.button.callback("📈 Crash 500", "gamb_crash_500")],
      [Markup.button.callback("🎟 Lottery", "gamb_lottery"), Markup.button.callback("🔢 High 100", "gamb_high_100"), Markup.button.callback("🔢 Low 100", "gamb_low_100")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  casinoMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🃏 Blackjack", "casino_bj_0"), Markup.button.callback("🎰 Slots", "casino_slots_0")],
      [Markup.button.callback("🎡 Roulette", "casino_roulette_0"), Markup.button.callback("🪙 Coin Flip", "casino_coinflip_0")],
      [Markup.button.callback("🎲 Dice", "casino_dice_0")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  funMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("😂 Joke", "fun_joke"), Markup.button.callback("💬 Quote", "fun_quote"), Markup.button.callback("🧠 Fact", "fun_fact")],
      [Markup.button.callback("😶 Truth", "fun_truth"), Markup.button.callback("😈 Dare", "fun_dare"), Markup.button.callback("🤔 WYR", "fun_wyr")],
      [Markup.button.callback("🎱 8-Ball", "fun_8ball"), Markup.button.callback("✂️ RPS Rock", "fun_rps_rock"), Markup.button.callback("✂️ RPS Paper", "fun_rps_paper")],
      [Markup.button.callback("✂️ RPS Scissors", "fun_rps_scissors")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  interactionsMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🤗 Hug", "int_hug"), Markup.button.callback("😘 Kiss", "int_kiss"), Markup.button.callback("🤚 Pat", "int_pat")],
      [Markup.button.callback("👋 Slap", "int_slap"), Markup.button.callback("👊 Punch", "int_punch"), Markup.button.callback("😬 Bite", "int_bite")],
      [Markup.button.callback("🥰 Cuddle", "int_cuddle"), Markup.button.callback("👉 Poke", "int_poke"), Markup.button.callback("😆 Tickle", "int_tickle")],
      [Markup.button.callback("👋 Wave", "int_wave"), Markup.button.callback("🙌 HiFive", "int_highfive"), Markup.button.callback("👁 Stare", "int_stare")],
      [Markup.button.callback("😊 Blush", "int_blush"), Markup.button.callback("😁 Smile", "int_smile"), Markup.button.callback("😢 Cry", "int_cry")],
      [Markup.button.callback("😂 Laugh", "int_laugh"), Markup.button.callback("💃 Dance", "int_dance"), Markup.button.callback("😡 Angry", "int_angry")],
      [Markup.button.callback("😴 Sleep", "int_sleep")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  gamesMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🎮 Hangman", "game_hangman"), Markup.button.callback("🧩 Riddle", "game_riddle")],
      [Markup.button.callback("🧠 Trivia", "game_trivia"), Markup.button.callback("🔢 MathQuiz", "game_mathquiz")],
      [Markup.button.callback("🔤 Word Scramble", "game_wordgame"), Markup.button.callback("🔢 GuessNumber", "game_guessnumber")],
      [Markup.button.callback("⌨️ Fast Type", "game_fasttype"), Markup.button.callback("💣 Minesweeper", "game_minesweeper")],
      [Markup.button.callback("🏆 Leaderboard", "game_leaderboard"), Markup.button.callback("🕹 Arcade", "game_arcade")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  pokemonMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🎮 My Party", "poke_party"), Markup.button.callback("💾 PC Storage", "poke_pc")],
      [Markup.button.callback("🌿 Hunt", "poke_hunt"), Markup.button.callback("🎣 Catch", "poke_catch")],
      [Markup.button.callback("💊 Heal Party", "poke_heal"), Markup.button.callback("🌟 Starter", "poke_starter")],
      [Markup.button.callback("🏪 PokéShop", "poke_shop")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  kantoStarterMenu: () =>
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🌱 Bulbasaur", "poke_starter_bulbasaur"),
        Markup.button.callback("🔥 Charmander", "poke_starter_charmander"),
        Markup.button.callback("💧 Squirtle", "poke_starter_squirtle"),
      ],
      [Markup.button.callback("🔙 Back", "menu_pokemon")],
    ]),

  nextButton: (action) =>
    Markup.inlineKeyboard([[Markup.button.callback("▶ Next", `poke_${action}`)]]),

  catchMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("⚪ Poke Ball", "poke_catch_poke"), Markup.button.callback("🔵 Great Ball", "poke_catch_great")],
      [Markup.button.callback("🟣 Ultra Ball", "poke_catch_ultra"), Markup.button.callback("⚪ Master Ball", "poke_catch_master")],
      [Markup.button.callback("🔙 Back", "menu_pokemon")],
    ]),

  pokeBallMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("⚪ Poke Ball", "catch_poke"), Markup.button.callback("🔵 Great Ball", "catch_great")],
      [Markup.button.callback("🟣 Ultra Ball", "catch_ultra"), Markup.button.callback("⚪ Master Ball", "catch_master")],
      [Markup.button.callback("🔙 Back", "menu_pokemon")],
    ]),

  // ─── CASINO KEYBOARDS ─────────────────────────────────────────────────────

  bjActions: (userId) =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🃏 Hit", `casino_bjhit_${userId}`), Markup.button.callback("✋ Stand", `casino_bjstand_${userId}`)],
    ]),

  slotsAgain: (amount) =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🎰 Spin Again", `casino_slots_${amount}`), Markup.button.callback("🔙 Back", "menu_casino")],
    ]),

  rouletteColors: (amount, num, isRed, isGreen, isBlack) => {
    if (num === undefined) {
      return Markup.inlineKeyboard([
        [Markup.button.callback("🔴 Red (2x)", `casino_roubet_red-${amount}-0-0-0`), Markup.button.callback("⚫ Black (2x)", `casino_roubet_black-${amount}-0-0-0`)],
        [Markup.button.callback("🟢 Green (14x)", `casino_roubet_green-${amount}-0-0-1`)],
        [Markup.button.callback("🔙 Back", "menu_casino")],
      ]);
    }
    const r = isRed ? 1 : 0, g = isGreen ? 1 : 0;
    return Markup.inlineKeyboard([
      [Markup.button.callback("🔴 Red (2x)", `casino_roubet_red-${amount}-${num}-${r}-${g}`), Markup.button.callback("⚫ Black (2x)", `casino_roubet_black-${amount}-${num}-${r}-${g}`)],
      [Markup.button.callback("🟢 Green (14x)", `casino_roubet_green-${amount}-${num}-${r}-${g}`)],
      [Markup.button.callback("🔙 Back", "menu_casino")],
    ]);
  },

  coinflipBet: (amount) =>
    Markup.inlineKeyboard([
      [Markup.button.callback(`🪙 Flip ${amount}`, `casino_coinflip_${amount}`), Markup.button.callback("🔙 Back", "menu_casino")],
    ]),

  coinflipChoice: (amount, result) =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🪙 Heads", `casino_coinpick_heads-${amount}-${result}`), Markup.button.callback("🪙 Tails", `casino_coinpick_tails-${amount}-${result}`)],
    ]),

  diceRoll: (amount) =>
    Markup.inlineKeyboard([
      [Markup.button.callback(`🎲 Roll Again (${amount})`, `casino_dice_${amount}`), Markup.button.callback("🔙 Back", "menu_casino")],
    ]),

  rpgMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("📊 Stats", "rpg_stats"), Markup.button.callback("⚔️ Hunt", "rpg_hunt")],
      [Markup.button.callback("👹 Boss", "rpg_boss"), Markup.button.callback("⚔️ Raid", "rpg_raid")],
      [Markup.button.callback("🏰 Dungeon", "rpg_dungeon"), Markup.button.callback("📜 Quests", "rpg_quest")],
      [Markup.button.callback("✨ Skills", "rpg_skills"), Markup.button.callback("⚒️ Forge", "rpg_forge")],
      [Markup.button.callback("🛒 RPG Shop", "rpg_shop"), Markup.button.callback("👥 My Party", "rpg_party")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  guildMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🏰 My Guild", "guild_info"), Markup.button.callback("🏆 Top Guilds", "guild_top")],
      [Markup.button.callback("➕ Create Guild", "guild_create_prompt"), Markup.button.callback("🚪 Leave Guild", "guild_leave")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  cardsMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🎴 Collection", "card_collection"), Markup.button.callback("🃏 My Deck", "card_deck")],
      [Markup.button.callback("✨ Stardust", "card_stardust"), Markup.button.callback("🥉 Get Bronze", "card_get_bronze")],
      [Markup.button.callback("🥈 Get Silver", "card_get_silver"), Markup.button.callback("🥇 Get Gold", "card_get_gold")],
      [Markup.button.callback("💜 Get Platinum", "card_get_plat"), Markup.button.callback("💎 Get Diamond", "card_get_diamond")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  vibeMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🌡 Vibe", "vibe_vibe"), Markup.button.callback("✅ Vibe Check", "vibe_vibecheck"), Markup.button.callback("⚡ Energy", "vibe_energy")],
      [Markup.button.callback("✨ Aura", "vibe_aura"), Markup.button.callback("😎 Rizz", "vibe_rizz"), Markup.button.callback("🗿 Sigma", "vibe_sigma")],
      [Markup.button.callback("📊 Ratio", "vibe_ratio"), Markup.button.callback("🤖 NPC", "vibe_npc"), Markup.button.callback("😭 Cope", "vibe_cope")],
      [Markup.button.callback("🌡 Mood", "vibe_mood"), Markup.button.callback("💅 Slay", "vibe_slay")],
      [Markup.button.callback("👻 Ghost", "vibe_ghost"), Markup.button.callback("⚠️ Toxic", "vibe_toxic"), Markup.button.callback("🔍 Sus", "vibe_sus")],
      [Markup.button.callback("📸 Clout", "vibe_clout")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  mediaMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("⬆️ Upscale", "media_upscale"), Markup.button.callback("✨ Enhance", "media_enhance")],
      [Markup.button.callback("💫 Remini", "media_remini"), Markup.button.callback("🗑 Remove BG", "media_removebg")],
      [Markup.button.callback("🌃 Night Filter", "media_night"), Markup.button.callback("🌅 Sunset", "media_sunset")],
      [Markup.button.callback("🌧 Rain Effect", "media_rain")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  paymentsMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 Balance", "eco_balance"), Markup.button.callback("⏳ Cooldowns", "eco_cooldowns")],
      [Markup.button.callback("🏦 Deposit All", "eco_depositall"), Markup.button.callback("💸 Withdraw All", "eco_withdrawall")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  downloaderMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🎵 YouTube MP3", "dl_ytmp3_prompt"), Markup.button.callback("🎬 YouTube MP4", "dl_ytmp4_prompt")],
      [Markup.button.callback("🎵 TikTok", "dl_tiktok_prompt"), Markup.button.callback("📸 Instagram", "dl_instagram_prompt")],
      [Markup.button.callback("📘 Facebook", "dl_facebook_prompt")],
      [Markup.button.callback("🔙 Back", "menu_main")],
    ]),

  confirm: (yesAction, noAction = "menu_main") =>
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ Yes", yesAction), Markup.button.callback("❌ No", noAction)],
    ]),

  pokemonStarterMenu: () =>
    Markup.inlineKeyboard([
      [Markup.button.callback("🌿 Bulbasaur", "starter_bulbasaur"), Markup.button.callback("🔥 Charmander", "starter_charmander"), Markup.button.callback("💧 Squirtle", "starter_squirtle")],
      [Markup.button.callback("🌿 Chikorita", "starter_chikorita"), Markup.button.callback("🔥 Cyndaquil", "starter_cyndaquil"), Markup.button.callback("💧 Totodile", "starter_totodile")],
      [Markup.button.callback("🌿 Treecko", "starter_treecko"), Markup.button.callback("🔥 Torchic", "starter_torchic"), Markup.button.callback("💧 Mudkip", "starter_mudkip")],
      [Markup.button.callback("🌿 Turtwig", "starter_turtwig"), Markup.button.callback("🔥 Chimchar", "starter_chimchar"), Markup.button.callback("💧 Piplup", "starter_piplup")],
      [Markup.button.callback("🌿 Snivy", "starter_snivy"), Markup.button.callback("🔥 Tepig", "starter_tepig"), Markup.button.callback("💧 Oshawott", "starter_oshawott")],
      [Markup.button.callback("🌿 Rowlet", "starter_rowlet"), Markup.button.callback("🔥 Litten", "starter_litten"), Markup.button.callback("💧 Popplio", "starter_popplio")],
      [Markup.button.callback("🌿 Grookey", "starter_grookey"), Markup.button.callback("🔥 Scorbunny", "starter_scorbunny"), Markup.button.callback("💧 Sobble", "starter_sobble")],
      [Markup.button.callback("🔙 Back", "menu_pokemon")],
    ]),
};

module.exports = KB;
