const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { rand, pickRandom, formatNumber } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";

// In-memory blackjack sessions
const bjSessions = new Map();

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function buildDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ suit: s, rank: r });
  for (let i = deck.length - 1; i > 0; i--) { const j = rand(0, i); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
}

function cardValue(card) {
  if (card.rank === "A") return 11;
  if (["J","Q","K"].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function handTotal(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter(c => c.rank === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function handStr(hand, hideSecond = false) {
  return hand.map((c, i) => (hideSecond && i === 1) ? "🂠" : `${c.suit}${c.rank}`).join("  ");
}

function replyText(ctx, text, kb, replyMsgId) {
  return ctx.reply(text, { parse_mode: "Markdown", ...(kb || {}), ...(replyMsgId ? { reply_to_message_id: replyMsgId } : {}) });
}

async function replyWithPhoto(ctx, imageUrl, caption, kb, replyMsgId) {
  const opts = { caption, parse_mode: "Markdown", ...(kb || {}), ...(replyMsgId ? { reply_to_message_id: replyMsgId } : {}) };
  if (imageUrl) {
    try { return await ctx.replyWithPhoto(imageUrl, opts); } catch {}
  }
  return ctx.reply(caption, { parse_mode: "Markdown", ...(kb || {}), ...(replyMsgId ? { reply_to_message_id: replyMsgId } : {}) });
}

async function handleCasino(ctx, action) {
  const id = String(ctx.from.id);
  const eco = DB.getEconomy(id);
  const msgId = ctx.message?.message_id;

  const parts = action.split("_");
  const game = parts[0];
  const param = parts.slice(1).join("_");
  const amount = parseInt(param) || 0;

  switch (game) {
    // ======================== BLACKJACK ========================
    case "bj": {
      if (!amount || amount < 10) {
        return replyWithPhoto(
          ctx,
          "https://i.imgur.com/nHfV0hZ.png",
          `*Blackjack Table*\n\nPlace your bet:\n\`.bj <amount>\`\n\nExample: \`.bj 500\`\n\nMin bet: ${CS} 10\nYour balance: ${CS} ${formatNumber(eco.wallet)}`,
          KB.back("gambling"),
          msgId
        );
      }
      if (eco.wallet < amount) return replyText(ctx, `Not enough ${CS}! You have ${CS} ${formatNumber(eco.wallet)}.`, KB.back("gambling"), msgId);

      const deck = buildDeck();
      let di = 0;
      const dealCard = () => deck[di++];
      const player = [dealCard(), dealCard()];
      const dealer = [dealCard(), dealCard()];

      const session = { player, dealer, deck, di, bet: amount, id };
      bjSessions.set(id, session);
      DB.saveEconomy(id, { wallet: eco.wallet - amount });

      const pt = handTotal(player);
      const dt = handTotal([dealer[0]]);
      const naturalBj = pt === 21;

      if (naturalBj) {
        bjSessions.delete(id);
        const dealerTotal = handTotal(dealer);
        const dealerBj = dealerTotal === 21;
        if (dealerBj) {
          DB.saveEconomy(id, { wallet: eco.wallet });
          return replyWithPhoto(ctx, "https://i.imgur.com/nHfV0hZ.png",
            `*Blackjack!*\n\nDealer: ${handStr(dealer)} (${dealerTotal})\nYou: ${handStr(player)} (${pt})\n\nBoth Blackjack! Push - bet returned.`,
            KB.back("gambling"), msgId);
        }
        const win = Math.floor(amount * 1.5);
        DB.saveEconomy(id, { wallet: eco.wallet + win });
        return replyWithPhoto(ctx, "https://i.imgur.com/nHfV0hZ.png",
          `*Blackjack!*\n\nDealer: ${handStr(dealer)} (${dealerTotal})\nYou: ${handStr(player)} (${pt})\n\nBlackjack! You win ${CS} ${formatNumber(win)}!\nBalance: ${CS} ${formatNumber(eco.wallet + win)}`,
          KB.back("gambling"), msgId);
      }

      return replyWithPhoto(ctx, "https://i.imgur.com/nHfV0hZ.png",
        `*Blackjack*\n\nBet: ${CS} ${formatNumber(amount)}\n\nDealer: ${handStr(dealer, true)} (${dt}+?)\nYou: ${handStr(player)} (*${pt}*)\n\nWhat do you do?`,
        KB.bjActions(id), msgId);
    }

    case "bjhit": {
      const session = bjSessions.get(param || id);
      if (!session || session.id !== id) return replyText(ctx, "No active Blackjack game. Use `.bj <amount>` to start.", KB.casinoMenu(), msgId);
      const newCard = session.deck[session.di++];
      session.player.push(newCard);
      bjSessions.set(id, session);

      const pt = handTotal(session.player);
      if (pt > 21) {
        bjSessions.delete(id);
        const ecoNow = DB.getEconomy(id);
        return replyWithPhoto(ctx, "https://i.imgur.com/nHfV0hZ.png",
          `*Blackjack*\n\nYou drew: ${newCard.suit}${newCard.rank}\nYou: ${handStr(session.player)} (*${pt}*)\n\nBust! You lose ${CS} ${formatNumber(session.bet)}.\nBalance: ${CS} ${formatNumber(ecoNow.wallet)}`,
          KB.back("gambling"), msgId);
      }

      const dt = handTotal([session.dealer[0]]);
      return replyWithPhoto(ctx, "https://i.imgur.com/nHfV0hZ.png",
        `*Blackjack*\n\nBet: ${CS} ${formatNumber(session.bet)}\n\nDealer: ${handStr(session.dealer, true)} (${dt}+?)\nYou: ${handStr(session.player)} (*${pt}*)\n\nWhat do you do?`,
        KB.bjActions(id), msgId);
    }

    case "bjstand": {
      const session = bjSessions.get(param || id);
      if (!session || session.id !== id) return replyText(ctx, "No active Blackjack game. Use `.bj <amount>` to start.", KB.casinoMenu(), msgId);
      bjSessions.delete(id);

      const ecoNow = DB.getEconomy(id);
      let dealerTotal = handTotal(session.dealer);
      while (dealerTotal < 17) {
        const nc = session.deck[session.di++];
        session.dealer.push(nc);
        dealerTotal = handTotal(session.dealer);
      }
      const pt = handTotal(session.player);

      let result, net;
      if (dealerTotal > 21) { result = `Dealer busts! You win!`; net = session.bet; }
      else if (pt > dealerTotal) { result = `You win!`; net = session.bet; }
      else if (pt === dealerTotal) { result = `Push! Bet returned.`; net = 0; }
      else { result = `Dealer wins!`; net = -session.bet; }

      DB.saveEconomy(id, { wallet: ecoNow.wallet + net });
      const newBal = ecoNow.wallet + net;

      return replyWithPhoto(ctx, "https://i.imgur.com/nHfV0hZ.png",
        `*Blackjack*\n\nDealer: ${handStr(session.dealer)} (${dealerTotal})\nYou: ${handStr(session.player)} (*${pt}*)\n\n${result}\n${net > 0 ? `+${CS} ${formatNumber(net)}` : net < 0 ? `-${CS} ${formatNumber(Math.abs(net))}` : "Bet returned."}\nBalance: ${CS} ${formatNumber(newBal)}`,
        KB.back("gambling"), msgId);
    }

    // ======================== SLOTS ========================
    case "slots": {
      if (!amount || amount < 10) {
        return replyWithPhoto(ctx, "https://i.imgur.com/5m3KWVT.png",
          `*Slot Machine*\n\nPlace your bet:\n\`.slots <amount>\`\n\nExample: \`.slots 200\`\nYour balance: ${CS} ${formatNumber(eco.wallet)}`,
          KB.back("gambling"), msgId);
      }
      if (eco.wallet < amount) return replyText(ctx, `Not enough ${CS}! You have ${CS} ${formatNumber(eco.wallet)}.`, KB.back("gambling"), msgId);

      const SYMS = ["🍒","🍋","🍊","🍇","⭐","💎","7️⃣","🎰","🍀","🔔"];
      const [s1,s2,s3] = [pickRandom(SYMS),pickRandom(SYMS),pickRandom(SYMS)];
      let mult = 0, msg = "";
      if (s1===s2&&s2===s3) {
        if (s1==="💎") { mult=15; msg="DIAMOND JACKPOT!"; }
        else if (s1==="7️⃣") { mult=10; msg="LUCKY SEVENS!"; }
        else if (s1==="⭐") { mult=7; msg="STAR JACKPOT!"; }
        else if (s1==="🍀") { mult=6; msg="LUCKY CLOVER!"; }
        else { mult=4; msg="JACKPOT!"; }
      } else if (s1===s2||s2===s3||s1===s3) {
        mult=1.5; msg="Two of a kind!";
      } else {
        msg="No match.";
      }

      const net = mult > 0 ? Math.floor(amount * mult) - amount : -amount;
      DB.saveEconomy(id, { wallet: eco.wallet + net });

      return replyWithPhoto(ctx, "https://i.imgur.com/5m3KWVT.png",
        `*Slot Machine*\n\n[ ${s1} ${s2} ${s3} ]\n\n${mult > 0 ? `${msg} (${mult}x)` : msg}\nBet: ${CS} ${formatNumber(amount)}\n${net >= 0 ? `+${CS} ${formatNumber(net + amount)}` : `-${CS} ${formatNumber(amount)}`}\nBalance: ${CS} ${formatNumber(eco.wallet + net)}`,
        KB.slotsAgain(amount), msgId);
    }

    // ======================== ROULETTE ========================
    case "roulette": {
      if (!amount || amount < 10) {
        return replyWithPhoto(ctx, "https://i.imgur.com/roulette.png",
          `*Roulette*\n\nPlace your bet:\n\`.roulette <amount>\`\n\nThen choose Red, Black, or Green!\nYour balance: ${CS} ${formatNumber(eco.wallet)}`,
          KB.rouletteColors(100), msgId);
      }
      if (eco.wallet < amount) return replyText(ctx, `Not enough ${CS}! You have ${CS} ${formatNumber(eco.wallet)}.`, KB.back("gambling"), msgId);
      DB.saveEconomy(id, { wallet: eco.wallet - amount });

      const num = rand(0, 36);
      const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      const isRed = reds.includes(num), isGreen = num === 0, isBlack = num > 0 && !isRed;
      const ballColor = isGreen ? "🟢" : isRed ? "🔴" : "⚫";

      const ecoNow = DB.getEconomy(id);
      return replyWithPhoto(ctx, "https://i.imgur.com/5roulette.png",
        `*Roulette*\n\nBall: *${num}* ${ballColor}\n\nChoose your bet!`,
        KB.rouletteColors(amount, num, isRed, isGreen, isBlack), msgId);
    }

    case "roubet": {
      // param = "red_500_3" = choice_amount_num
      const [choice, betStr, numStr, isRedStr, isGreenStr] = param.split("-");
      const betAmount = parseInt(betStr) || 100;
      const num = parseInt(numStr);
      const isRed = isRedStr === "1";
      const isGreen = isGreenStr === "1";
      const isBlack = !isRed && !isGreen;
      const ballColor = isGreen ? "🟢" : isRed ? "🔴" : "⚫";

      const ecoNow = DB.getEconomy(id);
      let won = false, mult = 1;
      if (choice === "green" && isGreen) { won = true; mult = 14; }
      else if (choice === "red" && isRed) { won = true; mult = 2; }
      else if (choice === "black" && isBlack) { won = true; mult = 2; }

      const net = won ? betAmount * mult : 0;
      DB.saveEconomy(id, { wallet: ecoNow.wallet + net });

      return replyWithPhoto(ctx, "https://i.imgur.com/5roulette.png",
        `*Roulette*\n\nBall landed on: *${num}* ${ballColor}\nYou bet: *${choice.toUpperCase()}*\n\n${won ? `You win! +${CS} ${formatNumber(net - betAmount)} (${mult}x)` : `You lose! -${CS} ${formatNumber(betAmount)}`}\nBalance: ${CS} ${formatNumber(ecoNow.wallet + net)}`,
        KB.back("gambling"), msgId);
    }

    // ======================== COINFLIP ========================
    case "coinflip": {
      if (!amount || amount < 10) {
        return replyWithPhoto(ctx, "https://i.imgur.com/coin.png",
          `*Coin Flip*\n\nBet an amount:\n\`.coinflip <amount>\`\n\nThen pick Heads or Tails!\nYour balance: ${CS} ${formatNumber(eco.wallet)}`,
          KB.coinflipBet(100), msgId);
      }
      if (eco.wallet < amount) return replyText(ctx, `Not enough ${CS}! You have ${CS} ${formatNumber(eco.wallet)}.`, KB.back("gambling"), msgId);
      const result = pickRandom(["heads","tails"]);
      return replyWithPhoto(ctx, "https://i.imgur.com/coin.png",
        `*Coin Flip*\n\nBet: ${CS} ${formatNumber(amount)}\n\nThe coin is in the air...\n\nPick your side!`,
        KB.coinflipChoice(amount, result), msgId);
    }

    case "coinpick": {
      const [choice, betStr, result] = param.split("-");
      const betAmount = parseInt(betStr) || 100;
      const won = choice === result;
      const ecoNow = DB.getEconomy(id);
      if (ecoNow.wallet < betAmount) return replyText(ctx, `Not enough ${CS}!`, KB.back("gambling"), msgId);
      DB.saveEconomy(id, { wallet: won ? ecoNow.wallet + betAmount : ecoNow.wallet - betAmount });

      const coinEmoji = result === "heads" ? "🪙H" : "🪙T";
      return replyWithPhoto(ctx, "https://i.imgur.com/coin.png",
        `*Coin Flip*\n\n${coinEmoji} It's *${result.toUpperCase()}*!\nYou picked: *${choice.toUpperCase()}*\n\n${won ? `You win! +${CS} ${formatNumber(betAmount)}` : `You lose! -${CS} ${formatNumber(betAmount)}`}\nBalance: ${CS} ${formatNumber(won ? ecoNow.wallet + betAmount : ecoNow.wallet - betAmount)}`,
        KB.coinflipBet(betAmount), msgId);
    }

    // ======================== DICE ========================
    case "dice": {
      if (!amount || amount < 10) {
        return replyWithPhoto(ctx, "https://i.imgur.com/dice.png",
          `*Dice Roll*\n\nBet an amount:\n\`.dice <amount>\`\n\nHigher roll wins!\nYour balance: ${CS} ${formatNumber(eco.wallet)}`,
          KB.diceRoll(100), msgId);
      }
      if (eco.wallet < amount) return replyText(ctx, `Not enough ${CS}! You have ${CS} ${formatNumber(eco.wallet)}.`, KB.back("gambling"), msgId);

      const DICE_FACES = ["", "1⃣","2⃣","3⃣","4⃣","5⃣","6⃣"];
      const my = rand(1,6), bot = rand(1,6);
      const tie = my === bot;
      const won = my > bot;
      const net = tie ? 0 : won ? amount : -amount;
      DB.saveEconomy(id, { wallet: eco.wallet + net });

      return replyWithPhoto(ctx, "https://i.imgur.com/dice.png",
        `*Dice Roll*\n\nYou: ${DICE_FACES[my]} (${my})\nBot: ${DICE_FACES[bot]} (${bot})\n\n${tie ? "Tie! Bet returned." : won ? `You win! +${CS} ${formatNumber(amount)}` : `You lose! -${CS} ${formatNumber(amount)}`}\nBalance: ${CS} ${formatNumber(eco.wallet + net)}`,
        KB.diceRoll(amount), msgId);
    }

    default:
      return replyText(ctx, "Use `.bj`, `.slots`, `.roulette`, `.coinflip`, or `.dice` to play casino games!", KB.casinoMenu(), msgId);
  }
}

module.exports = { handleCasino };
