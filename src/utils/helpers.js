const axios = require("axios");
const NodeCache = require("node-cache");

const pokeCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

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

const NATURES = ["Hardy","Lonely","Brave","Adamant","Naughty","Bold","Docile","Relaxed","Impish","Lax","Timid","Hasty","Serious","Jolly","Naive","Modest","Mild","Quiet","Bashful","Rash","Calm","Gentle","Sassy","Careful","Quirky"];

async function getPokemonData(nameOrId) {
  const key = `poke_${String(nameOrId).toLowerCase()}`;
  const cached = pokeCache.get(key);
  if (cached) return cached;
  try {
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${String(nameOrId).toLowerCase()}`, { timeout: 12000 });
    const d = res.data;
    const data = {
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
      imageUrl: d.sprites.other?.["official-artwork"]?.front_default || d.sprites.front_default || null,
      sprite: d.sprites.front_default || null,
      height: d.height / 10,
      weight: d.weight / 10,
      abilities: d.abilities.map((a) => a.ability.name),
      speciesUrl: d.species?.url || null,
      baseExp: d.base_experience || 50,
      catchRate: null,
    };
    pokeCache.set(key, data);
    return data;
  } catch { return null; }
}

async function getPokemonSpecies(nameOrId) {
  const key = `species_${String(nameOrId).toLowerCase()}`;
  const cached = pokeCache.get(key);
  if (cached) return cached;
  try {
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${String(nameOrId).toLowerCase()}`, { timeout: 12000 });
    const d = res.data;
    const flavorEntries = d.flavor_text_entries.filter(e => e.language.name === "en");
    const data = {
      catchRate: d.capture_rate,
      flavorText: flavorEntries.length ? flavorEntries[flavorEntries.length - 1].flavor_text.replace(/[\n\f]/g, " ") : "No description.",
      evolutionChainUrl: d.evolution_chain?.url || null,
      isLegendary: d.is_legendary,
      isMythical: d.is_mythical,
      genera: d.genera?.find(g => g.language.name === "en")?.genus || "",
    };
    pokeCache.set(key, data);
    return data;
  } catch { return null; }
}

async function getRandomPokemon() { return getPokemonData(rand(1, 1010)); }

const RARITY_THRESHOLDS = [
  { label: "Legendary", color: "🌟", maxId: 0, legendary: true },
  { label: "Ultra Rare", color: "💜", catchRate: 3 },
  { label: "Rare", color: "💙", catchRate: 45 },
  { label: "Uncommon", color: "💚", catchRate: 100 },
  { label: "Common", color: "⬜", catchRate: 999 },
];

function getRarity(catchRate, isLegendary) {
  if (isLegendary) return { label: "Legendary", color: "🌟" };
  if (catchRate <= 3) return { label: "Ultra Rare", color: "💜" };
  if (catchRate <= 45) return { label: "Rare", color: "💙" };
  if (catchRate <= 100) return { label: "Uncommon", color: "💚" };
  return { label: "Common", color: "⬜" };
}

const typeEmoji = (t) => ({ fire:"🔥",water:"💧",grass:"🌿",electric:"⚡",psychic:"🔮",ice:"❄️",dragon:"🐲",dark:"🌑",fairy:"🌸",normal:"⭐",fighting:"🥊",flying:"🦅",poison:"☠️",ground:"🌍",rock:"🪨",bug:"🐛",ghost:"👻",steel:"⚙️" }[t] || "❓");

const TYPE_CHART = {
  fire:     { fire:0.5, water:0.5, grass:2, ice:2, bug:2, steel:2, rock:0.5, dragon:0.5 },
  water:    { fire:2, water:0.5, grass:0.5, rock:2, ground:2, dragon:0.5 },
  grass:    { fire:0.5, water:2, grass:0.5, flying:0.5, poison:0.5, bug:0.5, dragon:0.5, ground:2, rock:2, steel:0.5 },
  electric: { water:2, electric:0.5, grass:0.5, flying:2, dragon:0.5, ground:0 },
  psychic:  { fighting:2, poison:2, psychic:0.5, dark:0, steel:0.5 },
  ice:      { fire:0.5, water:0.5, ice:0.5, grass:2, flying:2, ground:2, dragon:2, steel:0.5 },
  dragon:   { dragon:2, steel:0.5, fairy:0 },
  dark:     { fighting:0.5, psychic:2, dark:0.5, ghost:2, fairy:0.5 },
  fairy:    { fighting:2, dragon:2, dark:2, fire:0.5, poison:0.5, steel:0.5 },
  fighting: { normal:2, ice:2, rock:2, dark:2, steel:2, flying:0.5, psychic:0.5, bug:0.5, poison:0.5, fairy:0.5, ghost:0 },
  poison:   { grass:2, fairy:2, ground:0.5, rock:0.5, ghost:0.5, poison:0.5, steel:0 },
  ground:   { fire:2, electric:2, poison:2, rock:2, steel:2, water:0.5, grass:0.5, bug:0.5, flying:0 },
  flying:   { grass:2, fighting:2, bug:2, electric:0.5, rock:0.5, steel:0.5 },
  rock:     { fire:2, ice:2, flying:2, bug:2, fighting:0.5, ground:0.5, steel:0.5 },
  bug:      { grass:2, psychic:2, dark:2, fire:0.5, flying:0.5, fighting:0.5, ghost:0.5, steel:0.5, fairy:0.5 },
  ghost:    { psychic:2, ghost:2, dark:0.5, normal:0, fighting:0 },
  steel:    { ice:2, rock:2, fairy:2, fire:0.5, water:0.5, electric:0.5, steel:0.5, fighting:0.5 },
  normal:   { rock:0.5, steel:0.5, ghost:0 },
};

function getTypeEffectiveness(moveType, defenderTypes) {
  let mult = 1;
  for (const dt of defenderTypes) {
    const row = TYPE_CHART[moveType] || {};
    mult *= (row[dt] !== undefined ? row[dt] : 1);
  }
  return mult;
}

function calcDamage(attacker, defender, moveType = "normal") {
  const atk = attacker.attack || 10;
  const def = defender.defense || 5;
  const level = attacker.level || 1;
  const base = (((2 * level / 5 + 2) * atk * 50 / def) / 50 + 2);
  const eff = getTypeEffectiveness(moveType, defender.types || ["normal"]);
  const crit = Math.random() < 0.0625 ? 1.5 : 1;
  const variation = rand(85, 100) / 100;
  return { damage: Math.max(1, Math.floor(base * eff * crit * variation)), eff, crit: crit > 1 };
}

function pokemonCard(pk) {
  const e = escapeMarkdown;
  const types = pk.types.map((t) => `${typeEmoji(t)} ${e(capitalize(t))}`).join(" | ");
  return `*${e(capitalize(pk.name))}* \\(\\#${pk.id}\\)\n\n🏷 Type: ${types}\n❤️ HP: ${pk.hp}   ⚔️ ATK: ${pk.attack}   🛡 DEF: ${pk.defense}\n✨ SpAtk: ${pk.spAtk}   SpDef: ${pk.spDef}   💨 SPD: ${pk.speed}\n📏 ${pk.height}m | ${pk.weight}kg\n🎯 ${e(pk.abilities.join(", "))}\n🥊 ${e(pk.moves.join(", "))}`;
}

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

const STARTERS = ["bulbasaur","charmander","squirtle","chikorita","cyndaquil","totodile","treecko","torchic","mudkip","turtwig","chimchar","piplup","snivy","tepig","oshawott","chespin","fennekin","froakie","rowlet","litten","popplio","grookey","scorbunny","sobble","sprigatito","fuecoco","quaxly"];

const MARKET_ITEMS = [
  { name: "Fishing Rod",      price: 200,  desc: "Used for .fish" },
  { name: "Shovel",           price: 150,  desc: "Used for .dig" },
  { name: "Laptop",           price: 800,  desc: "Used for .work" },
  { name: "Lucky Charm",      price: 500,  desc: "+10% luck" },
  { name: "Shield",           price: 600,  desc: "Reduces robbery loss" },
  { name: "Bank Voucher",     price: 1000, desc: "+2000 bank limit" },
  { name: "XP Boost",         price: 750,  desc: "2x XP for 1h" },
  { name: "Poke Ball",        price: 100,  desc: "Catch Pokemon" },
  { name: "Great Ball",       price: 250,  desc: "Better catch rate" },
  { name: "Ultra Ball",       price: 500,  desc: "High catch rate" },
  { name: "Master Ball",      price: 5000, desc: "Always catches" },
  { name: "Potion",           price: 80,   desc: "Heal 20 HP" },
  { name: "Super Potion",     price: 150,  desc: "Heal 50 HP" },
  { name: "Hyper Potion",     price: 300,  desc: "Heal 120 HP" },
  { name: "Max Potion",       price: 500,  desc: "Full heal" },
  { name: "Revive",           price: 400,  desc: "Revive fainted Pokemon" },
  { name: "Rare Candy",       price: 800,  desc: "Level up a Pokemon" },
  { name: "Fire Stone",       price: 1200, desc: "Evolution stone" },
  { name: "Water Stone",      price: 1200, desc: "Evolution stone" },
  { name: "Thunder Stone",    price: 1200, desc: "Evolution stone" },
  { name: "Leaf Stone",       price: 1200, desc: "Evolution stone" },
  { name: "Moon Stone",       price: 1200, desc: "Evolution stone" },
  { name: "Iron Sword",       price: 400,  desc: "+8 ATK (RPG)" },
  { name: "Steel Armor",      price: 450,  desc: "+10 DEF (RPG)" },
  { name: "Lottery Ticket",   price: 50,   desc: "Enter the lottery" },
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

module.exports = { rand, pickRandom, formatNumber, formatTime, escapeMarkdown, getPokemonData, getPokemonSpecies, getRandomPokemon, typeEmoji, pokemonCard, capitalize, STARTERS, MARKET_ITEMS, RPG_ITEMS, CARD_TIERS, CARD_SERIES, generateCard, getRarity, calcDamage, getTypeEffectiveness, NATURES, pokeCache };
