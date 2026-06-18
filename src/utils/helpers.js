const axios = require("axios");

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const formatNumber = (n) => Number(n).toLocaleString();
const formatTime = (ms) => {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
};

function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

async function getPokemonData(nameOrId) {
  try {
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${String(nameOrId).toLowerCase()}`, { timeout: 10000 });
    const d = res.data;
    return {
      id: d.id,
      name: d.name,
      types: d.types.map((t) => t.type.name),
      hp: d.stats.find((s) => s.stat.name === "hp").base_stat,
      attack: d.stats.find((s) => s.stat.name === "attack").base_stat,
      defense: d.stats.find((s) => s.stat.name === "defense").base_stat,
      speed: d.stats.find((s) => s.stat.name === "speed").base_stat,
      spAtk: d.stats.find((s) => s.stat.name === "special-attack").base_stat,
      spDef: d.stats.find((s) => s.stat.name === "special-defense").base_stat,
      moves: d.moves.slice(0, 4).map((m) => m.move.name),
      imageUrl: d.sprites.other["official-artwork"].front_default || d.sprites.front_default,
      height: d.height / 10,
      weight: d.weight / 10,
      abilities: d.abilities.map((a) => a.ability.name),
    };
  } catch { return null; }
}

async function getRandomPokemon() { return getPokemonData(rand(1, 1010)); }

const typeEmoji = (t) => ({ fire:"🔥",water:"💧",grass:"🌿",electric:"⚡",psychic:"🔮",ice:"❄️",dragon:"🐲",dark:"🌑",fairy:"🌸",normal:"⭐",fighting:"🥊",flying:"🦅",poison:"☠️",ground:"🌍",rock:"🪨",bug:"🐛",ghost:"👻",steel:"⚙️" }[t] || "❓");

function pokemonCard(pk) {
  const e = escapeMarkdown;
  const types = pk.types.map((t) => `${typeEmoji(t)} ${e(t)}`).join(" \\| ");
  return `*${e(capitalize(pk.name))}* \\(\\#${pk.id}\\)\n\n🏷 Type: ${types}\n❤️ HP: ${pk.hp}   ⚔️ ATK: ${pk.attack}   🛡 DEF: ${pk.defense}\n✨ SpAtk: ${pk.spAtk}   SpDef: ${pk.spDef}   💨 SPD: ${pk.speed}\n📏 ${pk.height}m \\| ${pk.weight}kg\n🎯 ${e(pk.abilities.join(", "))}\n🥊 ${e(pk.moves.join(", "))}`;
}

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

const STARTERS = ["bulbasaur","charmander","squirtle","chikorita","cyndaquil","totodile","treecko","torchic","mudkip","turtwig","chimchar","piplup","snivy","tepig","oshawott","chespin","fennekin","froakie","rowlet","litten","popplio","grookey","scorbunny","sobble","sprigatito","fuecoco","quaxly"];

const MARKET_ITEMS = [
  { name: "Fishing Rod",     price: 200,  desc: "Used for .fish" },
  { name: "Shovel",          price: 150,  desc: "Used for .dig" },
  { name: "Laptop",          price: 800,  desc: "Used for .work" },
  { name: "Lucky Charm",     price: 500,  desc: "+10% luck" },
  { name: "Shield",          price: 600,  desc: "Reduces robbery loss" },
  { name: "Bank Voucher",    price: 1000, desc: "+2000 bank limit" },
  { name: "XP Boost",        price: 750,  desc: "2× XP for 1h" },
  { name: "Poké Ball",       price: 100,  desc: "Catch Pokémon" },
  { name: "Great Ball",      price: 250,  desc: "Better catch rate" },
  { name: "Ultra Ball",      price: 500,  desc: "High catch rate" },
  { name: "Master Ball",     price: 5000, desc: "Always catches" },
  { name: "Potion",          price: 80,   desc: "Heal 20 HP in RPG" },
  { name: "Max Potion",      price: 300,  desc: "Full heal in RPG" },
  { name: "Iron Sword",      price: 400,  desc: "+8 ATK (RPG)" },
  { name: "Steel Armor",     price: 450,  desc: "+10 DEF (RPG)" },
  { name: "Lottery Ticket",  price: 50,   desc: "Enter the lottery" },
];

const RPG_ITEMS = {
  weapons: [
    { name: "Iron Sword",   atk: 8,  price: 400   },
    { name: "Steel Blade",  atk: 15, price: 900   },
    { name: "Dragon Lance", atk: 25, price: 2000  },
    { name: "Excalibur",    atk: 50, price: 10000 },
  ],
  armor: [
    { name: "Leather Armor", def: 5,  price: 300  },
    { name: "Steel Armor",   def: 10, price: 450  },
    { name: "Dragon Scale",  def: 20, price: 1800 },
    { name: "Divine Plate",  def: 40, price: 9000 },
  ],
  monsters: [
    { name: "Goblin",     hp: 30,  atk: 5,  def: 2,  xp: 20,   gold: () => rand(10, 30)   },
    { name: "Orc",        hp: 60,  atk: 12, def: 5,  xp: 50,   gold: () => rand(30, 80)   },
    { name: "Troll",      hp: 100, atk: 20, def: 8,  xp: 100,  gold: () => rand(60, 150)  },
    { name: "Dragon",     hp: 200, atk: 40, def: 15, xp: 300,  gold: () => rand(200, 500) },
    { name: "Demon Lord", hp: 500, atk: 80, def: 30, xp: 1000, gold: () => rand(500, 2000)},
  ],
  bosses: [
    { name: "Lich King",      hp: 1000, atk: 100, def: 50, xp: 5000,  gold: () => rand(2000, 5000)   },
    { name: "Ancient Dragon", hp: 2000, atk: 150, def: 80, xp: 10000, gold: () => rand(5000, 10000)  },
  ],
};

const CARD_TIERS = ["bronze", "silver", "gold", "platinum", "diamond"];
const CARD_SERIES = ["Nature", "Space", "Ocean", "Fire", "Ice", "Thunder", "Shadow", "Light"];

function generateCard(name, tier) {
  const t = CARD_TIERS.includes(tier) ? tier : pickRandom(CARD_TIERS);
  const mult = { bronze: 1, silver: 1.5, gold: 2, platinum: 3, diamond: 5 }[t] || 1;
  return { id: `CARD-${Date.now()}-${rand(1000,9999)}`, name, tier: t, series: pickRandom(CARD_SERIES), power: Math.floor(rand(50,200)*mult), obtainedAt: Date.now() };
}

module.exports = { rand, pickRandom, formatNumber, formatTime, escapeMarkdown, getPokemonData, getRandomPokemon, typeEmoji, pokemonCard, capitalize, STARTERS, MARKET_ITEMS, RPG_ITEMS, CARD_TIERS, CARD_SERIES, generateCard };
