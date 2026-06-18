const DB = require("../database/db");
const KB = require("../utils/keyboards");
const { rand, pickRandom, formatNumber, formatTime } = require("../utils/helpers");

const CS = process.env.CURRENCY_SYMBOL || "💎";
const CD = 30000;

async function handleGambling(ctx, action) {
  const id = String(ctx.from.id);
  const eco = DB.getEconomy(id);
  const reply = (t, kb) => ctx.callbackQuery ? ctx.editMessageText(t, { parse_mode: "Markdown", ...kb }) : ctx.reply(t, { parse_mode: "Markdown", ...kb });

  function checkCd(cmd) {
    const cd = DB.getCooldown(id, `gamb_${cmd}`);
    return cd > Date.now() ? formatTime(cd - Date.now()) : null;
  }
  function setCd(cmd, ms = CD) { DB.setCooldown(id, `gamb_${cmd}`, ms); }

  const parts = action.split("_");
  const game = parts[0];
  const param = parts[1];
  const amount = parseInt(param) || 100;

  if (eco.wallet < amount && !["lottery","menu"].includes(game)) {
    return reply(`❌ Not enough funds!\nYou need ${CS} ${formatNumber(amount)} but only have ${CS} ${formatNumber(eco.wallet)}.`, KB.gamblingMenu());
  }

  switch (game) {
    case "coinflip": {
      const cd = checkCd("coinflip"); if (cd) return reply(`⏳ Cooldown: *${cd}*`, KB.gamblingMenu());
      setCd("coinflip");
      const choice = pickRandom(["heads","tails"]);
      const result = pickRandom(["heads","tails"]);
      const won = choice === result;
      DB.saveEconomy(id, { wallet: won ? eco.wallet + amount : eco.wallet - amount });
      return reply(`🪙 *Coin Flip*\n\nResult: *${result}*\n${won ? `✅ Won ${CS} ${formatNumber(amount)}!` : `❌ Lost ${CS} ${formatNumber(amount)}!`}\n👛 Wallet: ${CS} ${formatNumber(won ? eco.wallet+amount : eco.wallet-amount)}`, KB.gamblingMenu());
    }
    case "slots": {
      const cd = checkCd("slots"); if (cd) return reply(`⏳ Cooldown: *${cd}*`, KB.gamblingMenu());
      setCd("slots");
      const syms = ["🍒","🍋","🍊","🍇","⭐","💎","7️⃣","🎰"];
      const [s1,s2,s3] = [pickRandom(syms),pickRandom(syms),pickRandom(syms)];
      let mult = 0;
      if (s1===s2&&s2===s3) mult = s1==="💎"?10:s1==="7️⃣"?7:s1==="⭐"?5:3;
      else if (s1===s2||s2===s3) mult = 1.5;
      const net = mult>0 ? Math.floor(amount*mult)-amount : -amount;
      DB.saveEconomy(id, { wallet: eco.wallet + net });
      return reply(`🎰 *SLOTS*\n\n┌─────────┐\n│ ${s1} ${s2} ${s3} │\n└─────────┘\n\n${mult>=3?"🎉 JACKPOT!":mult>0?"✅ Win!":"❌ No match"}\n${net>=0?`+${CS} ${formatNumber(net+amount)}`:`-${CS} ${formatNumber(amount)}`}\n👛 Wallet: ${CS} ${formatNumber(eco.wallet+net)}`, KB.gamblingMenu());
    }
    case "bj": {
      const cd = checkCd("bj"); if (cd) return reply(`⏳ Cooldown: *${cd}*`, KB.gamblingMenu());
      setCd("bj", 60000);
      const cv = () => rand(1,11);
      const p = cv()+cv(), d = [cv(),cv()];
      let dTotal = d[0]+d[1];
      while (dTotal < 17) dTotal += cv();
      const push = p===dTotal&&p<=21;
      if (push) return reply(`🃏 *Blackjack*\n\nYour: *${p}* | Dealer: *${dTotal}*\n🤝 Push! Bet returned.`, KB.gamblingMenu());
      const won = p<=21&&(dTotal>21||p>dTotal);
      DB.saveEconomy(id, { wallet: won?eco.wallet+amount:eco.wallet-amount });
      return reply(`🃏 *Blackjack*\n\nYour hand: *${p}*\nDealer: *${dTotal}*\n\n${won?`✅ Win! +${CS} ${formatNumber(amount)}`:`❌ Dealer wins! -${CS} ${formatNumber(amount)}`}\n👛 Wallet: ${CS} ${formatNumber(won?eco.wallet+amount:eco.wallet-amount)}`, KB.gamblingMenu());
    }
    case "rou": {
      const cd = checkCd("rou"); if (cd) return reply(`⏳ Cooldown: *${cd}*`, KB.gamblingMenu());
      setCd("rou");
      const choice = param || "red";
      const num = rand(0,36);
      const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
      const isRed = reds.includes(num), isGreen = num===0, isBlack = num>0&&!isRed;
      let won=false, mult=1;
      if (choice==="green"&&isGreen){won=true;mult=14;}
      else if (choice==="red"&&isRed) won=true;
      else if (choice==="black"&&isBlack) won=true;
      const net = won?Math.floor(amount*mult):-amount;
      DB.saveEconomy(id, { wallet: eco.wallet+net });
      return reply(`🎡 *Roulette*\n\nBall: *${num}* ${isGreen?"🟢":isRed?"🔴":"⚫"}\nBet: *${choice}*\n\n${won?`✅ Won ${CS} ${formatNumber(net)} (${mult}x)!`:`❌ Lost ${CS} ${formatNumber(amount)}`}\n👛 Wallet: ${CS} ${formatNumber(eco.wallet+net)}`, KB.gamblingMenu());
    }
    case "dice": {
      const cd = checkCd("dice"); if (cd) return reply(`⏳ Cooldown: *${cd}*`, KB.gamblingMenu());
      setCd("dice");
      const my=rand(1,6), bot=rand(1,6);
      if (my===bot) return reply(`🎲 *Dice*\nYou: *${my}* vs Bot: *${bot}*\n🤝 Tie! Bet returned.`, KB.gamblingMenu());
      const won=my>bot;
      DB.saveEconomy(id, { wallet: won?eco.wallet+amount:eco.wallet-amount });
      return reply(`🎲 *Dice*\nYou: *${my}* vs Bot: *${bot}*\n${won?`✅ Win! +${CS} ${formatNumber(amount)}`:`❌ Loss! -${CS} ${formatNumber(amount)}`}\n👛 Wallet: ${CS} ${formatNumber(won?eco.wallet+amount:eco.wallet-amount)}`, KB.gamblingMenu());
    }
    case "crash": {
      const cd = checkCd("crash"); if (cd) return reply(`⏳ Cooldown: *${cd}*`, KB.gamblingMenu());
      setCd("crash", 45000);
      let mult=1.0;
      while (Math.random()>0.35) mult = parseFloat((mult+Math.random()*0.5).toFixed(2));
      const cashout = parseFloat((mult*(Math.random()<0.5?0.8:1.1)).toFixed(2));
      const won = cashout<=mult;
      const gain = won?Math.floor(amount*Math.min(cashout,mult))-amount:-amount;
      DB.saveEconomy(id, { wallet: eco.wallet+gain });
      return reply(`📈 *Crash*\n\nCrashed at: *${mult.toFixed(2)}x*\nCash out: *${cashout.toFixed(2)}x*\n\n${won?`✅ Win! ${CS} ${formatNumber(amount+gain)}`:`💥 CRASH! -${CS} ${formatNumber(amount)}`}\n👛 Wallet: ${CS} ${formatNumber(eco.wallet+gain)}`, KB.gamblingMenu());
    }
    case "lottery": {
      if (eco.wallet < 50) return reply(`❌ Need ${CS} 50 for a ticket.`, KB.gamblingMenu());
      const lottery = DB.getLottery();
      lottery.pot = (lottery.pot||0)+50;
      lottery.tickets = [...(lottery.tickets||[]), id];
      DB.saveLottery(lottery);
      DB.saveEconomy(id, { wallet: eco.wallet-50 });
      return reply(`🎟 *Lottery Ticket Purchased!*\n\n💰 Current pot: ${CS} ${formatNumber(lottery.pot)}\n🎫 Tickets: ${lottery.tickets.length}\n\n${lottery.pot>=5000?"🎉 Drawing soon!":"Keep buying tickets!"}`, KB.gamblingMenu());
    }
    case "high": {
      const cd = checkCd("hl"); if (cd) return reply(`⏳ Cooldown: *${cd}*`, KB.gamblingMenu());
      setCd("hl");
      const num=rand(1,100), won=num>50;
      DB.saveEconomy(id, { wallet: won?eco.wallet+amount:eco.wallet-amount });
      return reply(`🔢 *High/Low*\nNumber: *${num}*\nYou bet: *HIGH*\n${won?`✅ Win! +${CS} ${formatNumber(amount)}`:`❌ Loss! -${CS} ${formatNumber(amount)}`}\n👛 Wallet: ${CS} ${formatNumber(won?eco.wallet+amount:eco.wallet-amount)}`, KB.gamblingMenu());
    }
    case "low": {
      const cd = checkCd("hl"); if (cd) return reply(`⏳ Cooldown: *${cd}*`, KB.gamblingMenu());
      setCd("hl");
      const num=rand(1,100), won=num<=50;
      DB.saveEconomy(id, { wallet: won?eco.wallet+amount:eco.wallet-amount });
      return reply(`🔢 *High/Low*\nNumber: *${num}*\nYou bet: *LOW*\n${won?`✅ Win! +${CS} ${formatNumber(amount)}`:`❌ Loss! -${CS} ${formatNumber(amount)}`}\n👛 Wallet: ${CS} ${formatNumber(won?eco.wallet+amount:eco.wallet-amount)}`, KB.gamblingMenu());
    }
    default:
      return reply("❓ Unknown gambling action.", KB.gamblingMenu());
  }
}

module.exports = { handleGambling };
