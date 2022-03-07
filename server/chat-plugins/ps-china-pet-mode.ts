/*
	Pokemon Showdown China Pet Mode Version 1.2
	Author: Starmind
	p2. Steel Terrain, Acid Rain, Mercy Aura, Ball Aura 特效
	p2. 精灵球
	p2. 降低重新读取频率
	p2. pet box: Chat.ChatCommands -> Chat.PageTable
	p1. 联盟
	p1. 爬虫: 赛事报名列表
	p0. 修modlog
	p0. 论坛Awards
*/

import * as OS from "os";
import * as CP from "child_process";
import { FS } from "../../lib";
import { PRNG } from "../../sim";
import { AdminUtils } from "./ps-china-admin";
import { PetModeLearnSets } from "../../config/pet-mode/learnsets";
import { PokemonIconIndexes } from "../../config/pet-mode/poke-num";
import { PokemonSprites } from "../../config/pet-mode/poke-sprites";
import { PetModeRoomConfig } from "../../config/pet-mode/room-config";
import { PetModeShopConfig } from "../../config/pet-mode/shop-config";
import { PetModeSellConfig } from "../../config/pet-mode/sell-config";
import { PetModeBossConfig } from "../../config/pet-mode/boss-config";
import { PetModeGymConfig } from "../../config/pet-mode/gym-config";
import { PetModeLotteryConfig } from "../../config/pet-mode/lottery-config";

type userProperty = {
	'bag': string[],
	'box': string[],
	'items': { [itemName: string]: number },
	'badges': string[],
	'boss': string[],
	'time': { 'ball': number, 'draw': number, 'search': number, 'gym': number, 'boss': number, 'count': number, 'sell': number },
};
type petPosition = {'type': 'bag' | 'box', 'index': number};
type statPosition = {'type': 'ivs' | 'evs', 'index': 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'};
type lotteryConfig = {
	'start': string,
	'end': string,
	'host': string[],
	'live': string,
	'awards': { '1v': string, '2v': string, '3v': string, '4v': string, '5v': string, '6v': string },
	'price': number
}

const prng = new PRNG();

const BOTID = 'pschinabot';
const USERPATH = 'config/pet-mode/user-properties';
const GIFTPATH = 'config/pet-mode/user-gifts';
const DEPOSITPATH = 'config/pet-mode/deposit';
const TRADELOGPATH = 'config/pet-mode/trade-log';
const LOTTERYLOGPATH = 'config/pet-mode/lottery-log';
const POKESHEET = 'https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png';
const POKESPRITES = 'https://play.pokemonshowdown.com/sprites/ani';
const POKESPRITESSHINY = 'https://play.pokemonshowdown.com/sprites/ani-shiny';
const ITEMSHEET = 'https://play.pokemonshowdown.com/sprites/itemicons-sheet.png';
const TYPEICONS = 'https://play.pokemonshowdown.com/sprites/types';
const CATICONS = 'https://play.pokemonshowdown.com/sprites/categories';
const ITEMFOLDER = 'http://39.96.50.192:8000/avatars/items';
const EGGSPRITE = 'http://39.96.50.192:8000/avatars/static/egg.png';

const HYPERCONFIG = JSON.parse(FS('config/pet-mode/hyper-config.json').readIfExistsSync() || '{}');
const LAWNCD = HYPERCONFIG['LAWNCD'] || 2000;
const GYMCD = HYPERCONFIG['GYMCD'] || 300000;
const BALLCD = HYPERCONFIG['BALLCD'] || 300000;
const LAWNLIMIT = HYPERCONFIG['LAWNLIMIT'] || 2000;
const BOSSLIMIT = HYPERCONFIG['BOSSLIMIT'] || 3;
const HATCHCYCLE = HYPERCONFIG['HATCHCYCLE'] || 20;

if (!FS(USERPATH).existsSync()) FS(USERPATH).mkdir();
if (!FS(GIFTPATH).existsSync()) FS(GIFTPATH).mkdir();
if (!FS(DEPOSITPATH).existsSync()) FS(DEPOSITPATH).mkdir();
if (!FS(TRADELOGPATH).existsSync()) FS(TRADELOGPATH).mkdir();
if (!FS(LOTTERYLOGPATH).existsSync()) FS(LOTTERYLOGPATH).mkdir();

export class PetUtils {

	static sleep(time: number) {
		// @ts-ignore
		return new Promise(resolve => setTimeout(resolve, time));
	}

	static restrict(x: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, x));
	}

	static argmax(s: StatsTable): 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' {
		let maxValue = 0;
		let maxIndex: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' = 'hp';
		let i: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
		for (i in s) {
			if (s[i] > maxValue) {
				maxValue = s[i];
				maxIndex = i;
			}
		}
		return maxIndex;
	}

	static sample(s: { [name: string]: number }): string {
		let r = Math.random();
		let key = Object.keys(s)[0];
		for (key in s) {
			r -= s[key];
			if (r <= 0) break;
		}
		return key;
	}

	static hash(s: string): number {
		let hash = 0, i, chr;
		if (s.length === 0) return hash;
		for (i = 0; i < s.length; i++) {
			chr = s.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0;
		}
		return hash;
	}

	static formatJSON(s: AnyObject) {
		return JSON.stringify(s, null, '\t').replace(/\[\n\t\t/g, '[ ').replace(/\n\t\]/g, ' ]').replace(/,\n\t\t/g, ', ');
	}

	static zfill(x: number, num: number = 2) {
		return (new Array(num).fill("0").join('') + x).slice(-num);
	}

	static getDate(date: Date = new Date(), shift: number = 0): string {
		if (shift) date = new Date(date.setDate(date.getDate() + shift));
		return `${date.getFullYear()}-${this.zfill(date.getMonth() + 1)}-${this.zfill((date.getDate()))}`;
	}

	static getTime(date: Date = new Date()): string {
		return `${this.zfill(date.getHours())}:${this.zfill(date.getMinutes())}:${this.zfill(date.getSeconds())}`;
	}

	static getDay(): number {
		return Math.floor(Date.now() / 24 / 60 / 60 / 1000);
	}

	static image(style: string) {
		return `<img style="${style}"/>`;
	}

	static itemStyle(name: string) {
		let itemImg = '';
		switch (toID(name)) {
		case 'box':
		case 'naturemint':
		case 'abilitycapsule':
		case 'abilitypatch':
		case 'rocketbottlecap':
		case 'rustybottlecap':
			itemImg = `url(${ITEMFOLDER}/${toID(name)}.png) no-repeat;`;
			break;
		default:
			const num = Dex.items.get(name).spritenum || 0;
			let top = Math.floor(num / 16) * 24;
			let left = (num % 16) * 24;
			itemImg = `url(${ITEMSHEET}?g8) no-repeat scroll -${left}px -${top}px;`;
		}
		return `background:transparent ${itemImg} height: 24px; width: 24px;" title="${name}`;
	}

	static iconStyle(name: string, gender: string = 'N') {
		const pokemon = Dex.species.get(name);
		const iconid = gender === 'F' && Pet.iconIndex[`${pokemon.id}f`] ? `${pokemon.id}f` : pokemon.id;
		const num = Pet.iconIndex[iconid] || pokemon.num;
		if (num <= 0) {
			return `height: 32px; width: 40px;`
		}
		const top = Math.floor(num / 12) * 30;
		const left = (num % 12) * 40;
		return `background: transparent url(${POKESHEET}?v5) no-repeat scroll -${left}px -${top}px; height: 32px; width: 40px;`;
	}

	static button(message: string, desc: string, style: string = '', highlight: boolean = false) {
		const HLStyle = highlight ? 'border: inset; padding: 1.5px' : '';
		return `<button style="${style} ${HLStyle}" class="button" name="send" value="${message}">${desc}</button>`
	}

	static boolButtons(yesMessage: string, noMessage: string) {
		return this.button(yesMessage, '确认') + this.button(noMessage, '取消');
	}

	static parseStatPosition(target: string): statPosition | undefined {
		if (!target) return;
		const targets = target.split(',').map(x => x.trim());
		if (targets.length !== 2 || (targets[0] !== 'ivs' && targets[0] !== 'evs')) return;
		const index = targets[1];
		if (index !== 'hp' && index !== 'atk' && index !== 'def' && index !== 'spa' && index !== 'spd' && index !== 'spe') return;
		return {'type': targets[0], 'index': index};
	}

	static table(
		rowNames: (string | number)[], colNames: (string | number)[], content: (string | number)[][],
		tableWidth: string = '100%', thAlign: 'center' | 'left' | 'right' = 'center', tdAlign: 'center' | 'left' | 'right' = 'center'
	): string {
		const tr = (s: string) => `<tr>${s}</tr>`;
		const thStyle = `${thAlign === 'center' ? '' : `text-align: ${thAlign}; `}padding: 0`;
		const th = (s: string | number) => `<th style="${thStyle}">${s}</th>`;
		const tdStyle = `${tdAlign === 'left' ? '' : `text-align: ${tdAlign}; `}padding: 0`;
		const td = (s: string | number) => `<td style="${tdStyle}">${s}</td>`;
		const tableBody = content.map(row => row.map(td));
		if (rowNames.length === content.length) {
			rowNames.forEach((rowName, i) => tableBody[i].unshift(th(rowName)));
			colNames.unshift('');
		}
		if (colNames.length === tableBody[0].length) tableBody.unshift(colNames.map(th));
		return `<table style="border-spacing: 0px; width: ${tableWidth}">${tableBody.map(row => tr(row.join(''))).join('')}</table>`;
	}

	static popup(user: User | null, msg: string) {
		if (!user) return;
		user.popup(`|html|<div style="text-align: center">${msg}</div>`);
	}
}

class Pet {

	static sprites = new Set(PokemonSprites);

	static iconIndex: { [speciesid: string]: number } = PokemonIconIndexes;

	static learnSets: { [speciesid: string]: { [moveid: string]: number } } = PetModeLearnSets;

	static defaultWildMons = [
		'Caterpie', 'Weedle', 'Ledyba', 'Spinarak', 'Wurmple', 'Kricketot', 'Sewaddle', 'Venipede',
		'Scatterbug', 'Grubbin', 'Blipbug', 'Poochyena', 'Shinx', 'Lillipup', 'Purrloin', 'Nickit',
		'Pidgey', 'Hoothoot', 'Taillow', 'Starly', 'Pidove', 'Fletchling', 'Pikipek', 'Rookidee',
		'Rattata', 'Sentret', 'Zigzagoon', 'Bidoof', 'Patrat', 'Bunnelby', 'Yungoos', 'Skwovet',
	];

	static initMons = [
		'Bulbasaur', 'Chikorita', 'Treecko', 'Turtwig', 'Snivy', 'Chespin', 'Rowlet', 'Grookey',
		'Charmander', 'Cyndaquil', 'Torchic', 'Chimchar', 'Tepig', 'Fennekin', 'Litten', 'Scorbunny',
		'Squirtle', 'Totodile', 'Mudkip', 'Piplup', 'Oshawott', 'Froakie', 'Popplio', 'Sobble',
	];

	static legendMons = [
		'Articuno', 'Zapdos', 'Moltres', 'Raikou', 'Entei', 'Suicune', 'Regirock', 'Regice', 'Registeel', 'Latias', 'Latios',
		'Uxie', 'Mesprit', 'Azelf', 'Heatran', 'Regigigas', 'Cresselia', 'Cobalion', 'Terrakion', 'Virizion',
		'Tornadus', 'Thundurus', 'Landorus', 'Kubfu', 'Urshifu', 'Regieleki', 'Regidrago', 'Glastrier', 'Spectrier',
		'Type: Null', 'Silvally', 'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini', 'Nihilego', 'Buzzwole', 'Pheromosa',
		'Xurkitree', 'Celesteela', 'Kartana', 'Guzzlord', 'Poipole', 'Naganadel', 'Stakataka', 'Blacephalon',
		'Mewtwo', 'Lugia', 'Ho-Oh', 'Kyogre', 'Groudon', 'Rayquaza', 'Dialga', 'Palkia', 'Giratina', 'Reshiram', 'Zekrom', 'Kyurem',
		'Xerneas', 'Yveltal', 'Zygarde', 'Cosmog', 'Cosmoem', 'Solgaleo', 'Lunala', 'Necrozma', 'Zacian', 'Zamazenta', 'Eternatus',
		'Calyrex', 'Mew', 'Celebi', 'Jirachi', 'Deoxys', 'Phione', 'Manaphy', 'Darkrai', 'Shaymin', 'Arceus', 'Victini',
		'Keldeo', 'Meloetta', 'Genesect', 'Diancie', 'Hoopa', 'Volcanion', 'Magearna', 'Marshadow', 'Poipole', 'Zeraora',
		'Meltan', 'Melmetal', 'Zarude'
	];

	static subLegendMons = [
		'Dratini', 'Dragonair', 'Dragonite', 'Larvitar', 'Pupitar', 'Tyranitar', 'Bagon', 'Shelgon', 'Salamence',
		'Beldum', 'Metang', 'Metagross', 'Gible', 'Gabite', 'Garchomp', 'Deino', 'Zweilous', 'Hydreigon',
		'Goomy', 'Sliggoo', 'Goodra', 'Jangmo-o', 'Hakamo-o', 'Kommo-o', 'Dreepy', 'Drakloak', 'Dragapult'
	];

	static fossilMons: { [species: string]: string[] } = {
		'Omanyte': ['Helix Fossil'],
		'Kabuto': ['Dome Fossil'],
		'Aerodactyl': ['Old Amber'],
		'Lileep': ['Root Fossil'],
		'Anorith': ['Claw Fossil'],
		'Cranidos': ['Skull Fossil'],
		'Shieldon': ['Armor Fossil'],
		'Tirtouga': ['Cover Fossil'],
		'Archen': ['Plume Fossil'],
		'Tyrunt': ['Jaw Fossil'],
		'Amaura': ['Sail Fossil'],
		'Dracozolt': ['Fossilized Bird', 'Fossilized Drake'],
		'Arctozolt': ['Fossilized Bird', 'Fossilized Dino'],
		'Dracovish': ['Fossilized Fish', 'Fossilized Drake'],
		'Arctovish': ['Fossilized Fish', 'Fossilized Dino'],
	};

	static eggTitles = [
		'光滑的蛋',
		'躺平的蛋',
		'很安静的蛋',
		'好大一只蛋',
		'默默无闻的蛋',
		'不苟言笑的蛋',
		'沐浴着阳光的蛋',
		'在风中起舞的蛋',
		'正在努力成长的蛋',
		'拥有光明未来的蛋',
		'让人很有保护欲的蛋',
		'看起来非常快乐的蛋',
		'身而为蛋感到抱歉的蛋',
		'希望分享做蛋经验的蛋',
		'没有意识到自己是蛋的蛋',
		'做番茄炒蛋会很好吃的蛋',
		'坚定认为先有蛋后有鸡的蛋',
		'正在思考如何破壳而出的蛋'
	];

	static typeIcons: { [speciesname: string]: string } = {};

	static moveIcons: { [movename: string]: string } = {};

	static initButtons = [0, 1, 2].map(x => Pet.initMons.slice(x * 8, x * 8 + 8).map(
		x => PetUtils.button(`/pet init set ${x}`, '', PetUtils.iconStyle(x))
	).join('')).join('<br>');

	static spriteId(speciesid: string, gender: string = 'N'): string {
		speciesid = toID(speciesid);
		let species = Dex.species.get(speciesid);
		const baseid = toID(species.baseSpecies);
		speciesid = speciesid.substring(baseid.length);
		const sprite = baseid + (speciesid ? '-' + speciesid : '');
		if (gender === 'F' && Pet.sprites.has(`${sprite}-f`)) return `${sprite}-f`;
		return sprite;
	}

	static validPet(pet: string): boolean {
		return !!pet && toID(pet.split('|')[1]) !== 'egg';
	}

	static validMoves(speciesname: string, level: number): string[] {
		let speciesid = toID(speciesname);
		if (!this.learnSets[speciesid]) speciesid = Dex.toID(Dex.species.get(speciesname).baseSpecies);
		if (!this.learnSets[speciesid]) return [];
		return Object.keys(this.learnSets[speciesid]).filter(moveid => {
			return this.learnSets[speciesid][moveid] <= level;
		});
	}

	static sampleMoves(species: string, level: number): string[] {
		let validMoves = this.validMoves(species, level);
		prng.shuffle(validMoves);
		return validMoves.slice(0, 4); 
	}

	static randomIvs(fullivs: number): StatsTable {
		const allIvs = [...new Array(32).keys()];
		const result = new Array(PetUtils.restrict(fullivs, 0, 6)).fill(31);
		while (result.length < 6) result.push(prng.sample(allIvs));
		prng.shuffle(result);
		return { 'hp': result[0], 'atk': result[1], 'def': result[2], 'spa': result[3], 'spd': result[4], 'spe': result[5] };
	}

	static randomAbility(species: Species, hidden: number): string {
		if (species.abilities['H'] && prng.randomChance(hidden * 1000, 1000)) return 'H';
		return species.abilities['1'] ? prng.sample(['0', '1']) : '0';
	}

	static gen(
		speciesid: string, level: number, fullivs: number = 0, happy: number = 0,
		shiny: number = 1 / 2048, hidden: number = 1 / 100, egg: boolean = false
	): string {
		level = egg ? 1 : PetUtils.restrict(level, 1, 100);
		const species = Dex.species.get(speciesid);
		if (species.num <= 0) return '';
		const set: PokemonSet = {
			name: species.name,
			species: egg ? 'Egg' : prng.sample([species.name].concat(species.cosmeticFormes || [])),
			item: "",
			ability: this.randomAbility(species, hidden),
			moves: this.sampleMoves(species.name, level),
			nature: prng.sample(Dex.natures.all()).name,
			gender: species.gender ? species.gender : (prng.randomChance(Math.floor(species.genderRatio.M * 1000), 1000) ? 'M' : 'F'),
			evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
			ivs: this.randomIvs(fullivs),
			level: level,
			happiness: happy,
			shiny: prng.randomChance(shiny * 1000, 1000),
		};
		return Teams.pack([set]);
	}

	static wild(roomid: string, lawnid: string, maxLevel: number, restrictLevel: number, legend: boolean = false): string {
		if (legend && PetBattle.legends[roomid]) return PetBattle.legends[roomid].replace(/\!/g, '');
		if (!PetBattle.roomConfig[roomid] || !PetBattle.roomConfig[roomid]['lawn'][lawnid]) return '';
		if (restrictLevel <= PetBattle.roomConfig[roomid]['minlevel']) return '';
		return this.gen(
			PetUtils.sample(PetBattle.roomConfig[roomid]['lawn'][lawnid]),
			Math.min(restrictLevel, prng.sample([...new Array(11).keys()].map(x => {
				return x + Math.min(maxLevel, PetBattle.roomConfig[roomid]['maxlevel']) - 5;
			})))
		);
		// return this.gen(
		// 	prng.sample(this.defaultWildMons),
		// 	Math.min(restrictLevel, prng.sample([...new Array(11).keys()].map(x => x + Utils.restrict(maxLevel, 5, 20) - 5)))
		// );
	}

	static genPokeByDesc(target: string): string {
		const targets = target.split(',');
		const species = Dex.species.get(targets[0]);
		if (!species.exists) return '';
		let level = 50;
		let fullivs = 0;
		let hidden = 0;
		let shiny = 0;
		let egg = false;
		targets.slice(1).forEach(arg => {
			arg = toID(arg);
			if (arg.startsWith('l')) {
				level = PetUtils.restrict(parseInt(arg.slice(1)) || 70, 1, 100);
			} else if (arg.endsWith('v')) {
				fullivs = PetUtils.restrict(parseInt(arg) || 0, 0, 6);
			} else if (arg.includes('h')) {
				hidden = 1;
			} else if (arg.includes('s')) {
				shiny = 1;
			} else if (arg.includes('egg')) {
				egg = true;
			}
		})
		return this.gen(species.id, level, fullivs, 70, shiny, hidden, egg);
	}

	static correctAbility(set: PokemonSet): PokemonSet {
		const species = Dex.species.get(set.species || set.name);
		if (!set.ability || set.ability === '!!!ERROR!!!') set.ability = species.abilities["0"];
		return set;
	}

	static restoreAbility(set: PokemonSet, s: string): PokemonSet {
		if (['0', '1', 'H', 'S'].includes(set.ability)) return set;
		set.ability = s.split('|')[3] || '0';
		if (['0', '1', 'H', 'S'].includes(set.ability)) return set;
		const species = Dex.species.get(set.species || set.name);
		// @ts-ignore
		set.ability = ['1', 'H', 'S'].find(i => toID(species.abilities[i]) === toID(set.ability)) || '0';
		return set;
	}

	static parseSet(packedSet: string): PokemonSet | undefined {
		const floatLevel = parseFloat(packedSet.split('|')[10]) || 100;
		const sets = Teams.unpack(packedSet);
		if (!sets) return;
		const set = this.correctAbility(sets[0]);
		set.level = floatLevel;
		const species = Dex.species.get(set.species || set.name);
		set.species = species.name;
		if (species.gender) set.gender = species.gender;
		if (!set.evs) set.evs = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
		if (!set.ivs) set.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
		if (!set.item) set.item = '';
		if (!set.shiny) set.shiny = false;
		if (set.happiness === undefined) set.happiness = 255;
		return set;
	}

	static validEvos(set: PokemonSet, traded: boolean = false): (string)[][] {
		const rawSpecies = Dex.species.get(set.species);
		return rawSpecies.evos.map(x => {
			const species = Dex.species.get(x);
			if (species.cosmeticFormes && species.formeOrder) {
				if (rawSpecies.formeOrder) {
					x = species.formeOrder[rawSpecies.formeOrder.indexOf(set.species)] || x;
				} else {
					x = species.formeOrder[Math.abs(PetUtils.hash(PetUtils.getDate())) % species.formeOrder.length];
				}
			}
			if (species.gender && species.gender !== set.gender) return [];
			if (traded) {
				if (species.evoType === 'trade') {
					if (!species.evoItem) return [x, ''];
					if (species.evoItem && set.item === species.evoItem) return [x, set.item];
				}
				return [];
			}
			if (species.id === 'alcremie') return set.item.indexOf('Sweet') >= 0 ? [x, set.item] : [];
			if (species.evoCondition) {
				const hours = new Date().getHours();
				switch (species.evoCondition) {
				case "at night":
				case "during the night":
					if (hours > 5 && hours < 18) return [];
					break;
				case "during the day":
					if (hours < 6 || hours > 17) return [];
					break;
				case "from a special Rockruff":
					if (hours % 12 !== 5) return [];
					break;
				}
			}
			if (species.evoType) {
				switch (species.evoType) {
				case 'useItem':
					return set.item === species.evoItem ? [x, set.item] : [];
				case 'levelMove':
					return set.moves.indexOf(species.evoMove || '') >= 0 ? [x, ''] : [];
				case 'levelFriendship':
					return (set.happiness !== undefined ? set.happiness : 255) >= 220 ? [x, ''] : [];
				case 'levelHold':
					return set.item === species.evoItem ? [x, set.item] : [];
				case 'trade':
					return [];
				default:
					return set.level >= 36 ? [x, ''] : [];
				}
			}
			return set.level >= (species.evoLevel || 100) ? [x, ''] : [];
		}).filter(x => x.length === 2);
	}

	static evo(set: PokemonSet, targetSpecies: string, item: boolean): PokemonSet {		
		if (item) set.item = '';
		if (toID(set.species) === toID(set.name)) set.name = targetSpecies;
		// Ability does not change
		set.species = targetSpecies;
		return set;
	}

	static validSets(sets: string[]): string[] {
		return sets.map((x: string) => {
			const team = Teams.unpack(x);
			if (!team) return '';
			if (!Dex.species.get(team[0].species).exists) return '';
			if (!Dex.natures.get(team[0].nature).exists) return '';
			if (team[0].item && !Dex.items.get(team[0].item).exists) return '';
			if (team[0].moves.length < 1) return '';
			for (let move of team[0].moves) {
				if (!Dex.moves.get(move)) return '';
			}
			return Teams.pack([Pet.restoreAbility(team[0], x)]);
		}).filter((x: string) => x);
	}
}
Dex.moves.all().forEach(move => {
	Pet.moveIcons[move.name] = `background: url(${TYPEICONS}/${move.type}.png) no-repeat 5%, ` +
		`url(${CATICONS}/${move.category}.png) no-repeat 95%;`;
})
const typeIconImage = (t: string) => PetUtils.image(`background: url(${TYPEICONS}/${t}.png); width: 32px; height: 14px`);
Dex.species.all().forEach(species => {
	const img = typeIconImage(species.types[0]) + (species.types[1] ? typeIconImage(species.types[1]) : '');
	Pet.typeIcons[species.name] = img;
	species.cosmeticFormes?.forEach(forme => Pet.typeIcons[forme] = img);
})

class PetBattle {

	static legends: { [roomid: string]: string } = {};

	static nextRoom: { [roomid: string]: string } = {};

	static previousRoom: { [roomid: string]: string } = {};

	static roomConfig: { [roomid: string]: {
		'lawn': { [lawnid: string]: { [species: string]: number } },
		'minlevel': number,
		'maxlevel': number,
		'boss'?: string[]
	} } = PetModeRoomConfig;

	static gymConfig: { [gymname: string]: {
		'maxlevel': number, 'botteam': string, 'userteam': string, 'ace': string,
		'bonus'?: string, 'terrain'?: string, 'weather'?: string, 'pseudoweather'?: string,
		'msg': { 'start': string, 'ace': string, 'win': string, 'lose': string }
	} } = PetModeGymConfig;

	static bossConfig: { [bossname: string]: {
		'set': string, 'bonus': string
	} } = PetModeBossConfig;

	static balls: { [ballname: string]: number } = {'Poke Ball': 1, 'Great Ball': 2, 'Ultra Ball': 4, 'Master Ball': Infinity};

	static inBattle(userid: string): string | undefined {
		const battleWithBot = (roomid: string) => {
			const battle = Rooms.get(roomid)?.battle;
			return battle && (battle.p1.id === BOTID || battle.p2.id === BOTID) &&
				(battle.p1.id === userid || battle.p2.id === userid) && !battle.ended;
		}
		const user = Users.get(userid);
		if (!user) return undefined;
		return [...user.inRooms].find(x => toID(x).indexOf('petmode') >= 0 && battleWithBot(x));
	}

	static findRoom(userLevel: number): string {
		return Object.keys(this.roomConfig).reverse().find(roomid => this.roomConfig[roomid]['minlevel'] <= userLevel) || 'skypillar';
	}

	static validate(rules: string, userSets: string[]): string {
		const userTeam = Teams.unpack(userSets.filter(Pet.validPet).join(']')); // Note: ability might be error
		if (!userTeam) return '您不能使用非法格式的队伍';
		for (let set of userTeam) {
			const validMoves = Pet.validMoves(set.species, set.level || 100).concat(['vcreate']);
			for (let move of set.moves) {
				const moveid = Dex.toID(move);
				if (validMoves.includes(moveid)) continue;
				return `您的 ${set.name} 不能携带非法招式 ${move}`;
			}
		}
		for (let rule of rules.split(',')) {
			const ruleId = toID(rule);
			switch (ruleId) {
			case 'evasionmoves':
				for (let set of userTeam) {
					for (let moveid of set.moves) {
						if ([
							'doubleteam', 'minimize', 'flash', 'smokescreen', 'sandattack', 'kinesis', 'mudslap',
							'nightdaze', 'mudbomb', 'muddywater', 'octazooka', 'mirrorshot', 'leaftornado'
						].indexOf(toID(moveid)) >= 0) {
							return `您的 ${set.name} 不能使用提升回避率或降低对手命中率的招式 ${moveid} `;
						}
					}
				}
				break;
			case 'repeatpokemon':
				const setLength = [...new Set(userTeam.map(set => set.species))].length;
				if (setLength < userSets.length) return '您不能携带重复的宝可梦';
				break;
			default:
				if (Dex.species.get(ruleId).exists) {
					for (let set of userTeam) {
						if (toID(set.species) === ruleId) {
							return `您的队伍中不能包含 ${rule}`;
						}
					}
				} else if (Dex.abilities.get(ruleId).exists) {
					for (let set of userTeam) {
						if (toID(set.ability) === ruleId) {
							return `您的队伍中不能包含具有 ${rule} 特性的宝可梦`;
						}
					}
				} else if (Dex.items.get(ruleId).exists) {
					for (let set of userTeam) {
						if (toID(set.item) === ruleId) {
							return `您的 ${set.name} 不能携带 ${rule}`;
						}
					}
				} else if (Dex.moves.get(ruleId).exists) {
					for (let set of userTeam) {
						for (let moveid of set.moves) {
							if (toID(moveid) === ruleId) {
								return `您的 ${set.name} 不能使用 ${rule}`;
							}
						}
					}
				} 
			}
		}
		return '';
	}

	static createBattle(
		user: User, bot: User, userTeam: string, botTeam: string, format: string, hidden: boolean,
		delayedStart: boolean | 'multi' | undefined = false
	): GameRoom | undefined {
		return Rooms.createBattle({
			format: format,
			p1: {
				user: bot,
				team: botTeam,
				rating: 0,
				hidden: hidden,
				inviteOnly: false,
			},
			p2: {
				user: user,
				team: userTeam,
				rating: 0,
				hidden: hidden,
				inviteOnly: false,
			},
			p3: undefined,
			p4: undefined,
			rated: 0,
			challengeType: 'unrated',
			delayedStart: delayedStart,
		});
	}

}
let previousRoomId = '';
for (let roomid in PetBattle.roomConfig) {
	for (let lawnid in PetBattle.roomConfig[roomid]['lawn']) {
		const sumRate = eval(Object.values(PetBattle.roomConfig[roomid]['lawn'][lawnid]).join('+'));
		for (let speciesid in PetBattle.roomConfig[roomid]['lawn'][lawnid]) {
			PetBattle.roomConfig[roomid]['lawn'][lawnid][speciesid] /= sumRate;
		}
	}
	if (previousRoomId) {
		PetBattle.nextRoom[previousRoomId] = roomid;
		PetBattle.previousRoom[roomid] = previousRoomId;
	}
	previousRoomId = roomid;
}

class Shop {

	static shopConfig: { [goodtype: string]: { [goodname: string]: number} } = PetModeShopConfig;

	static types: { [goodtype: string]: string } = {
		'ball': '精灵球', 'draw': '进化道具', 'berry': '树果', 'battle': '对战道具', 'special': '专用对战道具',
		'util': '其他道具', 'sell': '卖出', 'lottery': '彩票', 'revive': '复活化石宝可梦'
	};

	static goodDesc: { [goodtype: string]: string } = {
		'Box': '添加一个盒子',
		'Nature Mint': '宝可梦携带并使用后可以改变性格',
		'Ability Capsule': '宝可梦携带并使用后可以改变特性 (不可改变为隐藏特性)',
		'Ability Patch': '宝可梦携带并使用后可以改变为隐藏特性',
		'Rocket Bottle Cap': '宝可梦携带并使用后可以使一项个体值随机提升',
		'Rusty Bottle Cap': '宝可梦携带并使用后可以使一项个体值重置为随机值',
		'Bottle Cap': '宝可梦携带并使用后可以使一项个体值提升至31',
		'Gold Bottle Cap': '宝可梦携带并使用后可以使全部个体值提升至31',
	};

	static func: { [goodid: string]: (set: PokemonSet, arg: string) => boolean } = {
		'rustybottlecap': (set: PokemonSet, arg: string) => {
			if (Object.keys(set.ivs).indexOf(arg) < 0) return false;
			// @ts-ignore
			set.ivs[arg] = prng.sample([...new Array(32).keys()]);
			return true;
		},
		'rocketbottlecap': (set: PokemonSet, arg: string) => {
			if (Object.keys(set.ivs).indexOf(arg) < 0) return false;
			// @ts-ignore
			if (set.ivs[arg] >= 31) return false;
			// @ts-ignore
			set.ivs[arg] = set.ivs[arg] + 1 + prng.sample([...new Array(31 - set.ivs[arg]).keys()]);
			return true;
		},
		'bottlecap': (set: PokemonSet, arg: string) => {
			if (Object.keys(set.ivs).indexOf(arg) < 0) return false;
			// @ts-ignore
			set.ivs[arg] = 31;
			return true;
		},
		'goldbottlecap': (set: PokemonSet, arg: string) => {
			set.ivs = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
			return true;
		},
		'abilitycapsule': (set: PokemonSet, arg: string) => {
			const abilities = Dex.species.get(set.species).abilities;
			if (!abilities['1']) return false;
			if (set.ability === '0' || toID(set.ability) === toID(abilities['0'])) {
				set.ability = '1';
				return true;
			} else if (set.ability === '1' || toID(set.ability) === toID(abilities['1'])) {
				set.ability = '0';
				return true;
			}
			return false;
		},
		'abilitypatch': (set: PokemonSet, arg: string) => {
			const abilities = Dex.species.get(set.species).abilities;
			if (!abilities['H']) return false;
			if (set.ability === 'H' || toID(set.ability) === toID(abilities['H'])) return false;
			set.ability = 'H';
			return true;
		},
		'naturemint': (set: PokemonSet, arg: string) => {
			for (let nature of Dex.natures.all()) {
				if (toID(arg) === nature.id && toID(set.nature) !== nature.id) {
					set.nature = nature.name;
					return true;
				}
			}
			return false;
		},
	};

	static sellConfig: {
		'rate': { [goodtype: string]: number },
		'num': { [goodtype: string]: number },
		'egg': { [species: string]: number },
	} = PetModeSellConfig;

	static lotteryConfig: lotteryConfig = PetModeLotteryConfig;

	static editLottery(newLotteryConfig: Partial<lotteryConfig>) {
		this.lotteryConfig = {
			'start': newLotteryConfig['start'] || PetUtils.getDate(),
			'end': newLotteryConfig['end'] || PetUtils.getDate(new Date(), 6),
			'host': newLotteryConfig['host'] || this.lotteryConfig['host'],
			'live': newLotteryConfig['live'] || this.lotteryConfig['live'],
			'awards': newLotteryConfig['awards'] || this.lotteryConfig['awards'],
			'price': newLotteryConfig['price'] || this.lotteryConfig['price']
		};
		FS('config/pet-mode/lottery-config.js').safeWriteSync(
			'exports.PetModeLotteryConfig = ' + JSON.stringify(this.lotteryConfig, null, '\t')
		);
	};

	static closeLottery(species: string, nums: number[]): string[] {
		const log: string[] = ['宝可梦彩票开奖:'];
		FS(LOTTERYLOGPATH).readdirSync().forEach(filename => {
			const userid = filename.split('.')[0];
			const userLottery = FS(`${LOTTERYLOGPATH}/${filename}`).readIfExistsSync().split(',').map(x => parseInt(x));
			const userAwardLevel = userLottery.filter((x, i) => x === nums[i]).length;
			if (userAwardLevel > 0) {
				const userAward = Object.values(this.lotteryConfig['awards'])[userAwardLevel - 1].replace('{}', species);
				const gift = new PetUser(userid, GIFTPATH);
				if (!gift.property) gift.init();
				if (userAward.endsWith('item')) {
					const features = userAward.split(',');
					gift.addItem(features[0], parseInt(features[1]));
				} else {
					gift.addPet(Pet.genPokeByDesc(userAward));
				}
				gift.save();
				PetUtils.popup(
					Users.get(userid),
					`您购买的彩票中奖了!<br>${PetUtils.button('/msg ~, /pet box receive', '领取礼物')}`
				);
				log.push(`${userid}在本期宝可梦彩票活动中获得了${this.parseAward(userAward)}`);
			}
		});
		return log;
	};

	static clearLottery() {
		FS(LOTTERYLOGPATH).readdirSync().forEach(filename => {
			FS(`${LOTTERYLOGPATH}/${filename}`).unlinkIfExistsSync();
		});
	};

	static parseAward(award: string): string {
		const features = award.replace('{}', '开奖时捕获的宝可梦').split(',').slice(0, -1);
		if (award.endsWith('egg')) {
			return `${features[0]} 的蛋 (${features.slice(1).map(x => {
				switch (toID(x)) {
				case 's': return '闪光';
				case 'h': return '隐藏特性';
				default: return x;
				}
			}).join(', ') || '随机'})`;
		} else {
			return `${parseInt(features[1]) > 0 ? features[1] : '无限'}个 ${features[0]}`
		}
	};

	static goodButtons: { [goodtype: string]: string } = {
		'ball': Object.keys(PetModeShopConfig['ball']).map(goodname => {
			return PetUtils.button(`/pet shop show ball=>${goodname}`, '', PetUtils.itemStyle(goodname));
		}).join(''),
		'draw': Object.keys(PetModeShopConfig['draw']).map(goodname => {
			return PetUtils.button(`/pet shop show draw=>${goodname}`, '', PetUtils.itemStyle(goodname));
		}).join(''),
		'berry': Object.keys(PetModeShopConfig['berry']).map(goodname => {
			return PetUtils.button(`/pet shop show berry=>${goodname}`, '', PetUtils.itemStyle(goodname));
		}).join(''),
		'battle': Object.keys(PetModeShopConfig['battle']).map(goodname => {
			return PetUtils.button(`/pet shop show battle=>${goodname}`, '', PetUtils.itemStyle(goodname));
		}).join(''),
		'special': Object.keys(PetModeShopConfig['special']).map(goodname => {
			return PetUtils.button(`/pet shop show special=>${goodname}`, '', PetUtils.itemStyle(goodname));
		}).join(''),
		'util': Object.keys(PetModeShopConfig['util']).map(goodname => {
			return PetUtils.button(`/pet shop show util=>${goodname}`, '', PetUtils.itemStyle(goodname));
		}).join(''),
	};

	static itemButtons(petUser: PetUser, cmd: string = '/pet shop show sell=>{}', sep: string = ' '): string {
		if (!petUser.property) return '';
		const items = petUser.property['items'];
		let buttons = '';
		for (let itemName in items) {
			const num = items[itemName] > 0 ? items[itemName] : '∞';
			buttons += PetUtils.button(cmd.replace('{}', itemName), '', PetUtils.itemStyle(itemName)) + num + sep;
		}
		return buttons;
	};

	static getType(goodname: string): string | undefined {
		for (let goodType in this.shopConfig) {
			if (this.shopConfig[goodType][goodname]) {
				return goodType;
			}
		}
	};

	static getPrice(goodname: string): number {
		const goodType = this.getType(goodname);
		if (!goodType) return 50;
		return this.shopConfig[goodType][goodname];
	};

	static randomEgg(args: string) {
		return Pet.genPokeByDesc(`${PetUtils.sample(Shop.sellConfig['egg'])},${args},egg`);
	};

}

class PetUser {

	id: string;
	private path: string;

	chatRoomId: string | undefined;
	battleRoomId: string | undefined;
	battleInfo: string | undefined;

	operation: string | undefined;
	property: userProperty | undefined;
	cachedProperty: userProperty | undefined;
	onPage: number;
	onPosition: petPosition | undefined;
	onChangeMoves: {'position': petPosition, 'selected': string[], 'valid': string[]} | undefined;

	constructor(userid: string, dir: string = USERPATH) {
		this.id = userid;
		this.path = `${dir}/${this.id}.json`;
		this.load();
		this.onPage = 0;
	}

	load() {
		const userSaveData = FS(this.path).readIfExistsSync();
		if (userSaveData) {
			this.property = JSON.parse(userSaveData);
			this.init();
		}
	}

	save() {
		if (this.property) FS(this.path).safeWriteSync(JSON.stringify(this.property));
	}

	init() {
		this.property = {
			'bag': this.property?.bag || new Array(6).fill(''),
			'box': this.property?.box || new Array(30).fill(''),
			'items': this.property?.items || {},
			'badges': this.property?.badges?.filter(gymName => PetBattle.gymConfig[gymName]) || [],
			'boss': this.property?.boss?.filter(bossName => PetBattle.bossConfig[bossName]) || [],
			'time': {
				'ball': this.property?.time?.ball || 0,
				'draw': this.property?.time?.draw || 0,
				'search': this.property?.time?.search || 0,
				'gym': this.property?.time?.gym || 0,
				'boss': this.property?.time?.boss || 0,
				'count': this.property?.time?.count || 0,
				'sell': this.property?.time?.sell || 0,
			}
		}
	}

	destroy() {
		FS(this.path).unlinkIfExistsSync();
	}

	editProperty(propertyString: string): boolean {
		const cachedProperty = JSON.parse(JSON.stringify(this.property));
		try {
			const splited = propertyString.split('=>');
			if (splited[0] === 'items') {
				// @ts-ignore
				this.property['items'] = JSON.parse(splited[1]);
			} else {
				const position = splited[0].split(',');
				const posType = position[0];
				const index = parseInt(position[1]);
				const pet = splited.slice(1).join('=>');
				if (pet) {
					const set = Pet.parseSet(pet);
					if (!set) throw Error();
					if (toID(set.species) !== 'egg' && !Dex.species.get(set.species).exists) throw Error();
					if (!Dex.natures.get(set.nature).exists) throw Error();
					// @ts-ignore
					this.property[posType][index] = Teams.pack([Pet.restoreAbility(set, pet)]);
				} else {
					// @ts-ignore
					this.property[posType][index] = '';
				}
			}
		} catch (err) {
			this.property = cachedProperty;
			return false;
		}
		this.cachedProperty = cachedProperty;
		return true;
	}

	restoreProperty(): boolean {
		if (!this.cachedProperty) return false;
		this.property = this.cachedProperty;
		this.cachedProperty = undefined;
		return true;
	}

	getBoxPriceBase(): number {
		if (!this.property) return 1;
		let a = 1, b = 1, c;
		for (
			let bought = this.boxNum() - this.property['badges'].filter(
				gymid => PetBattle.gymConfig[gymid]?.bonus === 'box'
			).length - 1;
			bought > 0;
			c = a, a = b, b += c, bought--
		);
		return b;
	}

	addBox(): boolean {
		if (!this.property) return false;
		this.property['box'] = this.property['box'].concat(new Array(30).fill(''));
		return true;
	}

	boxNum(): number {
		if (!this.property) return 1;
		return Math.ceil(this.property['box'].length / 30);
	}

	badgeNum(): number {
		return this.property ? this.property['badges'].length : 0;
	}

	levelRistriction(): number {
		return this.badgeNum() * 10 + 10;
	}

	parsePosition(target: string, ignoreEgg: boolean = false): petPosition | undefined {
		if (!this.property) return;
		if (!target) return;
		const targets = target.split(',').map(x => x.trim());
		if (targets.length !== 2) return;
		const posType: 'bag' | 'box' = targets[0] === 'bag' ? 'bag' : 'box';
		const index = parseInt(targets[1]);
		if (index === NaN || index < 0 || index >= this.property[posType].length) return;
		if (ignoreEgg && !Pet.validPet(this.property[posType][index])) return;
		return {'type': posType, 'index': index};
	}

	getPet(): string {
		if (!this.property || !this.onPosition) return '';
		return this.property[this.onPosition['type']][this.onPosition['index']];
	}

	setPet(pet: string) {
		if (!this.property || !this.onPosition) return;
		this.property[this.onPosition['type']][this.onPosition['index']] = pet;
	}

	addPet(pet: string): boolean {
		if (!this.property || !pet) return false;
		const bagIndex = this.property.bag.indexOf('');
		if (bagIndex >= 0) {
			this.property.bag[bagIndex] = pet;
			return true;
		}
		const boxIndex = this.property.box.indexOf('');
		if (boxIndex >= 0) {
			this.property.box[boxIndex] = pet;
			return true;
		}
		return false;
	}

	removePet(position: petPosition | undefined = this.onPosition, item: string = ''): boolean {
		if (!this.property || !position) return false;
		if (position['type'] === 'bag' && this.property['bag'].filter(Pet.validPet).length <= 1) return false;
		if (item) this.addItem(item, 1);
		this.property[position['type']][position['index']] = '';
		return true;
	}

	checkPet(position: petPosition | undefined): PokemonSet | undefined {
		if ((this.onPosition = position) && this.property) {
			const pet = this.getPet()
			const set = Pet.parseSet(pet);
			if (set) {
				const species = Dex.species.get(set.species);
				if (species.formeOrder) {
					let modified = true;
					const formerSpecies = set.species;
					switch (species.baseSpecies) {
					case 'Deerling':
					case 'Sawsbuck':
						set.species = species.formeOrder[Math.floor((new Date().getMonth() + 10) % 12 / 3)];
						break;
					case 'Burmy':
					case 'Furfrou':
						set.species = species.formeOrder[position['index'] % species.formeOrder.length];
						break;
					default:
						modified = false;
					}
					if (modified) {
						if (toID(set.name) === toID(formerSpecies)) set.name = set.species;
						const rawAbility = set.ability;
						this.setPet(Teams.pack([Pet.restoreAbility(set, pet)]));
						this.save();
						set.ability = rawAbility;
					}
				}
			}
			return set;
		}
	}

	movePet(pos1: petPosition, pos2: petPosition): boolean{
		if (!this.property) return false;
		const set1 = this.property[pos1['type']][pos1['index']];
		const set2 = this.property[pos2['type']][pos2['index']];
		this.property[pos1['type']][pos1['index']] = set2;
		this.property[pos2['type']][pos2['index']] = set1;
		if (this.property['bag'].find(Pet.validPet)) return true;
		this.property[pos1['type']][pos1['index']] = set1;
		this.property[pos2['type']][pos2['index']] = set2;
		return false;
	}

	namePet(name: string): boolean {
		if (!this.property || !this.onPosition) return false;
		let pet = this.getPet();
		if (!Pet.validPet(pet)) return false;
		const features = pet.split('|');
		if (!features[1]) features[1] = features[0];
		features[0] = name || features[1];
		pet = features.join('|');
		this.setPet(pet);
		return true;
	}

	checkEvo(position: petPosition): string[][] {
		if (!this.property) return [];
		const set = Pet.parseSet(this.property[position['type']][position['index']]);
		if (!set) return [];
		return Pet.validEvos(set);
	}

	evo(position: petPosition, targetSpecies: string, item: boolean): boolean {
		if (!this.property) return false;
		const pet = this.property[position['type']][position['index']]
		let set = Pet.parseSet(pet);
		if (!set) return false;
		set = Pet.evo(set, targetSpecies, item);
		this.property[position['type']][position['index']] = Teams.pack([Pet.restoreAbility(set, pet)]);
		if (set.species === 'Ninjask') {
			set.species = 'Shedinja';
			set.ability = 'Wonder Guard';
			set.gender = 'N';
			set.item = '';
			this.addPet(Teams.pack([Pet.restoreAbility(set, pet)]));
		}
		return true;
	}

	hasItem(itemName: string): boolean {
		if (!this.property) return false;
		return itemName in this.property['items'];
	}

	addItem(itemName: string, num: number): boolean {
		if (!this.property) return false;
		if (!(itemName in this.property['items'])) this.property['items'][itemName] = 0;
		if (num === Infinity) this.property['items'][itemName] = -1;
		else this.property['items'][itemName] += num;
		return true;
	}

	removeItem(itemName: string, num: number): boolean {
		if (!this.property) return false;
		if (itemName && itemName in this.property['items']) {
			this.property['items'][itemName] -= 1;
			if (this.property['items'][itemName] === 0) {
				delete this.property['items'][itemName];
			}
			return true;
		}
		return false;
	}

	setItem(position: petPosition, itemName: string): boolean {
		if (!this.property) return false;
		const pet = this.property[position['type']][position['index']]
		const set = Pet.parseSet(pet);
		if (!set) return false;

		if (set.item) {
			if (this.addItem(set.item, 1)) set.item = '';
		} else {
			if (this.removeItem(itemName, 1)) set.item = itemName;
		}
		this.property[position['type']][position['index']] = Teams.pack([Pet.restoreAbility(set, pet)]);
		return true;
	}

	useItem(arg: string): boolean {
		if (!this.property) return false;
		const pet = this.getPet();
		if (!pet) return false;
		const set = Pet.parseSet(pet);
		if (!set) return false;
		const itemid = toID(set.item);
		if (Shop.func[itemid] && Shop.func[itemid](set, arg)) {
			set.item = '';
			this.setPet(Teams.pack([Pet.restoreAbility(set, pet)]));
			return true;
		}
		return false;
	}

	changeMoves(position: petPosition): boolean {
		if (!this.property) return false;
		const pet = this.property[position['type']][position['index']];
		const set = Pet.parseSet(pet);
		if (!set) return false;
		if (!this.onChangeMoves) return false;
		set.moves = this.onChangeMoves['selected'];
		this.property[position['type']][position['index']] = Teams.pack([Pet.restoreAbility(set, pet)]);
		return true;
	}

	resetStat(position: statPosition): boolean {
		if (!this.property || !this.onPosition) return false;
		const pet = this.getPet();
		const set = Pet.parseSet(pet);
		if (!set) return false;
		set[position['type']][position['index']] = 0;
		this.setPet(Teams.pack([Pet.restoreAbility(set, pet)]));
		return true;
	}

	maxLevel(): number {
		if (!this.property) return 0;
		return Math.max(...this.property['bag'].filter(Pet.validPet).map(x => parseInt(x.split('|')[10]) || 100));
	}

	balls(): string[] {
		if (!this.property) return [];
		return Object.keys(this.property['items']).filter(itemname => !!PetBattle.balls[itemname]);
	}

	catch(ball: string, legend: boolean): boolean {
		const statusCoef = parseInt(FS(`${DEPOSITPATH}/${this.id}.txt`).readIfExistsSync());
		if (!statusCoef) return false;
		const catchRate = statusCoef * (PetBattle.balls[ball] || 1);
		return prng.randomChance(catchRate / (legend ? 20 : 1), 255);
	}

	addExperience(foespecies: string, foelevel: number): boolean {
		if (!this.property) return false;
		let levelUp = false;
		const foespec = Dex.species.get(foespecies);
		const foebst = foespec.bst;
		const maxEvsIndex = PetUtils.argmax(foespec.baseStats);
		const f = Object.keys(foespec.baseStats).indexOf(maxEvsIndex);
		const s = Math.floor(foespec.baseStats[maxEvsIndex] / 40) * 4;
		const len = this.property['bag'].length;
		for (let index in this.property['bag']) {
			const ownPoke = this.property['bag'][index];
			let features = ownPoke.split('|');
			if (Dex.toID(features[1]) === 'egg') {
				features[6] = Math.min((parseInt(features[6]) || 0) + 1, 20) + ',,,,,';
				this.property['bag'][index] = features.join('|');
			} else if (ownPoke) {
				let level = parseFloat(features[10]) || 100;
				// 经验 = sqrt(100 * foeLevel) * foeBst / log3(team.length + 2)
				// level + 1 所需经验 = level * bst * 1.5
				if (level < this.levelRistriction()) {
					let experience = Math.sqrt(100 * foelevel) * foebst / (Math.log(len + 2) / Math.log(3));
					const bst = Dex.species.get(features[1] || features[0]).bst;
					const needExp = (l: number) => Math.floor(l) * bst * 1.5;
					let need = needExp(level);
					let newLevel = level + experience / need;
					while (Math.floor(newLevel) > Math.floor(level)) {
						experience = experience - need;
						level += 1;
						levelUp = true;
						need = needExp(level);
						newLevel = level + experience / need;
					}
					features[10] = newLevel >= 100 ? '' : newLevel.toString();
				}
				const evs = (features[6] || ',,,,,').split(',').map((x: string) => parseInt(x) || 0);
				evs[f] = evs[f] + Math.max(Math.min(s, 252 - evs[f], 510 - eval(evs.join('+'))), 0);
				features[6] = evs.join(',');
				features[11] = Math.min((features[11] ? parseInt(features[11]) : 255) + 10, 255).toString();
				this.property['bag'][index] = features.join('|');
			}
		}
		return levelUp;
	}

	checkExchange(friend: PetUser): string {
		const team = Teams.unpack(this.getPet()); // Note: ability might be error
		if (!team) return '{1}的宝可梦数据格式错误!';
		const set = team[0];
		if (set.item && Shop.getPrice(set.item) >= 50) return '{1}的宝可梦携带了贵重物品, 不能交换!';
		if (Pet.legendMons.concat(Pet.subLegendMons).indexOf(Dex.species.get(set.species).baseSpecies) >= 0) {
			return '{1}的宝可梦是重要的宝可梦, 不能交换!';
		}
		if (set.moves.find(x => toID(x) === 'vcreate')) return '{1}的宝可梦有纪念意义, 不能交换!';
		if (friend.levelRistriction() < Math.floor(set.level || 100)) return '{2}的徽章数不足以驾驭{1}的宝可梦!';
		return '';
	}

	linkExchange(friend: PetUser): {'sent': string, 'received': string} | string {
		if (!this.property) return '您还没有领取最初的伙伴!';
		if (!this.onPosition) return '您想要交换的位置是空的!';
		if (!friend.property) return '朋友还没有领取最初的伙伴!';
		if (!friend.onPosition) return '朋友想要交换的位置是空的!';
		let userCheckRes = this.checkExchange(friend);
		if (userCheckRes) return userCheckRes.replace('{1}', '您').replace('{2}', '朋友');
		let friendCheckRes = friend.checkExchange(this);
		if (friendCheckRes) return friendCheckRes.replace('{1}', '朋友').replace('{2}', '您');
		let myPet = this.getPet();
		let mySet = Pet.parseSet(myPet);
		if (!mySet) return '您想要交换的宝可梦格式错误!';
		let friendPet = friend.getPet();
		let friendSet = Pet.parseSet(friendPet);
		if (!friendSet) return '朋友想要交换的宝可梦格式错误!';
		const myValidEvos = Pet.validEvos(mySet, true);
		if (myValidEvos.length > 0) mySet = Pet.evo(mySet, myValidEvos[0][0], !!myValidEvos[0][1]);
		const friendValidEvos = Pet.validEvos(friendSet, true);
		if (friendValidEvos.length > 0) friendSet = Pet.evo(friendSet, friendValidEvos[0][0], !!friendValidEvos[0][1]);
		myPet = Teams.pack([Pet.restoreAbility(mySet, myPet)]);
		friendPet = Teams.pack([Pet.restoreAbility(friendSet, friendPet)]);
		friend.setPet(myPet);
		this.setPet(friendPet);
		return {'sent': myPet.split('|')[0], 'received': friendPet.split('|')[0]};
	}

	hatch(): boolean {
		if (!this.property || !this.onPosition) return false;
		let pet = this.getPet();
		const features = pet.split('|');
		if (toID(features[1]) !== 'egg') return false;
		if ((parseInt(features[6]) || 0) < HATCHCYCLE) return false;
		features[1] = '';
		pet = features.join('|');
		this.setPet(pet);
		return true;
	}

	merge(targetUser: PetUser): { 'bag': string[], 'items': { [itemname: string]: number } } {
		let added: { 'bag': string[], 'items': { [itemname: string]: number } } = {'bag': [], 'items': {}};
		if (!targetUser.property) return added;
		let pokes = (targetUser.property['bag'].concat(targetUser.property['box']) || []).filter(x => x);
		targetUser.property['bag'] = [];
		targetUser.property['box'] = [];
		for (let i = 0; i < pokes.length; i++) {
			let poke = pokes[i];
			if (this.addPet(poke)) {
				added['bag'].push(poke.split('|')[1] || poke.split('|')[0]);
			} else {
				targetUser.property['bag'] = pokes.splice(i);
				break;
			}
		}
		let items = targetUser.property['items'];
		for (let itemname in items) {
			const addNum = items[itemname] > 0 ? items[itemname] : Infinity;
			this.addItem(itemname, addNum);
			added['items'][itemname] = addNum;
		}
		targetUser.property['items'] = {};
		return added;
	}

	addRandomEgg(arg: string): boolean {
		return !!this.property && this.addPet(Shop.randomEgg(arg));
	}

	setLottery(lottery: string) {
		FS(`${LOTTERYLOGPATH}/${this.id}.txt`).safeWriteSync(lottery);
	}

	getLottery(): string {
		return FS(`${LOTTERYLOGPATH}/${this.id}.txt`).readIfExistsSync();
	}
}

const petUsers: { [userid: string]: PetUser } = {};

const ipSearchCount: { [ip: string]: number } = {};

export function getUser(userid: string): PetUser {
	return petUsers[userid] || (petUsers[userid] = new PetUser(userid));
}

export function checkUser(userid: string): boolean {
	return FS(`${USERPATH}/${toID(userid)}.json`).existsSync();
}

export function dropUser(userid: string) {
	delete petUsers[userid];
}

function petBox(petUser: PetUser, target: string, admin: boolean = false): string {
	if (!petUser.property) return '';
	const st = (x: string) => `<b>${x}</b>`;
	const th = (x: string | number, a: string = '') => `<th style="${a ? `text-align: ${a}; ` : ''}padding: 0">${x}</th>`;
	const td = (x: string | number, a: string = 'center') => `<td style="${a ? `text-align: ${a}; ` : ''}padding: 0">${x}</td>`;

	let pokeDiv = ``;
	const set = petUser.checkPet(petUser.parsePosition(target));
	if (set && toID(set.species) === 'egg') {
		let setTitle = Pet.eggTitles[Math.abs(PetUtils.hash(set.name + Object.values(set.ivs))) % Pet.eggTitles.length] +
			` (${Math.floor(set.evs['hp'] / HATCHCYCLE * 100)}%)`;
		if (petUser.operation === 'move') setTitle = '请选择位置';
		setTitle = st(setTitle);
		const setButtons = [
			PetUtils.button(`/pet box onmove ${target}`, '移动'),
			PetUtils.button(`/pet box hatch ${target}`, '孵化'),
			PetUtils.button(`/pet box reset`, '返回')
		].join('<br>');
		pokeDiv = `<div style="line-height: 35px">${setTitle}</div>` +
			`<div style=" display: inline-block; width: 50px; line-height: 32px; vertical-align: top;">${setButtons}</div>` +
			PetUtils.image(`background: url(${EGGSPRITE}) no-repeat center; width: 300px; height: 96px`);
		pokeDiv = `<div style="width: 350px; position: relative; display: inline-block;">${pokeDiv}</div>`;
	} else if (set) {
		let showDesc = true;
		let setTitle = set.level >= petUser.levelRistriction() ? `达到${petUser.badgeNum()}个徽章的等级上限` : '<br>';
		if (petUser.operation === 'move') {
			setTitle = '请选择位置';
		} else if (['name', 'ex', 'gift'].indexOf(petUser.operation || '') >= 0) {
			const operation = petUser.operation || 'name';
			const inputType = {'name': '新昵称', 'ex': '朋友的PSID', 'gift': '接收方的PSID'}[operation];
			const msgRoom = (msg: string) => `/msgroom ${petUser.chatRoomId || 'skypillar'}, ${msg}`;
			setTitle = `<form data-submitsend="${msgRoom(`/pet box reset ${target}`)}&#10;${msgRoom(`/${operation} {text}`)}">` +
				`<b>${inputType}:</b> <input name="text" /> <button class="button" type="submit">确定</button>` +
				`${PetUtils.button(`/pet box reset ${target}`, '取消')}</form>`;
		} else if (petUser.operation === 'drop' + target) {
			setTitle = `确认放生 ${set.name} ? ` + PetUtils.boolButtons(
				`/pet box drop ${target}!`,
				`/pet box drop ${target}`
			);
		} else if (petUser.operation?.indexOf('resetstat') === 0) {
			const statOperation = petUser.operation.slice(9);
			const statPosition = statOperation.split(',')
			if (statPosition.length === 2) {
				const statType = statPosition[0] === 'ivs' ? '个体值' : 'evs' ? '努力值' : undefined;
				const statIndex = ['HP', '攻击', '防御', '特攻', '特防', '速度'][
					['hp', 'atk', 'def', 'spa', 'spd', 'spe'].indexOf(statPosition[1])
				]
				if (statType && statIndex) {
					setTitle = `确认清空 ${set.name} 的${statIndex}${statType}? ` + PetUtils.boolButtons(
						`/pet box resetstat ${statOperation}!`,
						`/pet box reset ${target}`
					);
				}
			}
		} else if (petUser.operation === 'evo') {
			setTitle = '请选择进化型: ' + Pet.validEvos(set).map(x => {
				return PetUtils.button(`/pet box evo ${target}=>${x[0]}`, '&emsp;', PetUtils.iconStyle(x[0], set.gender));
			}).join('') + ' ' + PetUtils.button(`/pet box evo ${target}`, '取消');
		} else if (petUser.operation?.indexOf('evo') === 0) {
			setTitle = `确认将 ${set.name} 进化为 ${petUser.operation?.slice(3)}? ` + PetUtils.boolButtons(
				`/pet box evo ${target}=>${petUser.operation?.slice(3)}`,
				`/pet box evo ${target}`
			);
		} else if (petUser.operation?.indexOf('readyex') === 0) {
			setTitle = `请等待${petUser.operation?.slice(7)}回复您的交换请求 ` +
				PetUtils.button(`/pet box ex ${petUser.operation?.slice(7)}`, '重新发送') +
				PetUtils.button(`/pet box reset ${target}`, '取消')
		} else if (petUser.operation?.indexOf('preex') === 0) {
			setTitle = `用 ${set.name} 与${petUser.operation?.slice(5)}交换? ` +
				PetUtils.boolButtons(`/pet box ex ${petUser.operation?.slice(5)}`, `/pet box reset ${target}`)
		} else if (petUser.operation?.indexOf('gift') === 0) {
			setTitle = `将 ${set.name} 赠送给${petUser.operation?.slice(4)}? ` +
				PetUtils.boolButtons(`/gift ${petUser.operation?.slice(4)}!`, `/pet box reset ${target}`)
		} else if (petUser.operation === 'useitem') {
			setTitle = `使用 ${set.item} ? `
			switch (toID(set.item)) {
			case 'rustybottlecap':
			case 'rocketbottlecap':
			case 'bottlecap':
				setTitle += `${PetUtils.button(`/pet box reset ${target}`, '取消')}<br><div style="padding: 5px; border: ridge;">`;
				setTitle += Object.keys(set.ivs).map(key => PetUtils.button(`/pet box useitem ${key}`, key)).join(' ');
				setTitle += `</div>`;
				showDesc = false;
				break;
			case 'naturemint':
				setTitle += `${PetUtils.button(`/pet box reset ${target}`, '取消')}<br><div style="padding: 5px; border: ridge;">`;
				setTitle += Dex.natures.all().map(nature => PetUtils.button(`/pet box useitem ${nature.id}`, nature.name)).join(' ');
				setTitle += `</div>`;
				showDesc = false;
				break;
			default:
				setTitle += PetUtils.boolButtons(`/pet box useitem default`, `/pet box reset ${target}`);
			}
		}
		setTitle = st(setTitle);
		const setButtons = [
			PetUtils.button(`/pet box nameguide ${target}`, '昵称'),
			PetUtils.button(`/pet box onmove ${target}`, '移动'),
			PetUtils.button(`/pet box ex`, '交换'),
			PetUtils.button(`/pet box evo ${target}`, '进化'),
			PetUtils.button(`/pet box moves ${target}`, '招式'),
			PetUtils.button(`/pet box drop ${target}`, '放生'),
			PetUtils.button(`/pet box reset`, '返回')
		]
		if (admin) setButtons.splice(2, 0, PetUtils.button(`/gift`, '赠送'))

		const bst = Dex.species.get(set.species).baseStats;
		const statsKeys = Object.keys(set.evs);
		const statsTable = PetUtils.table(
			['种族&ensp;', '个体&ensp;', '努力&ensp;'],
			['HP', '攻击', '防御', '特攻', '特防', '速度'],
			[
				Object.values(bst),
				Object.values(set.ivs),
				Object.values(set.evs).map((x, i) => PetUtils.button(`/pet box resetstat evs,${statsKeys[i]}`, x.toString()))
			],
			'auto'
		);
		const setName = [toID(set.species), toID(set.species.split('-')[0])].includes(toID(set.name)) ? '' : `${set.name}&emsp;`;
		const lines = [
			`${setName}${st('种类')} ${set.species}&emsp;${Pet.typeIcons[set.species]}${set.shiny ? '☆' : ''}`,
			`${st('性别')} ${{'M': '♂', 'F': '♀'}[set.gender] || '∅'}&emsp;${st('亲密度')} ${set.happiness}`,
			`${st('等级')} ${Math.floor(set.level)} (${Math.floor((set.level - Math.floor(set.level)) * 100)}%)&emsp;` + 
			`${st('道具')} ${set.item ? PetUtils.button(`/pet box item ${target}`, '&emsp;', PetUtils.itemStyle(set.item)) : '无'}` +
			`${Shop.func[toID(set.item)] ? PetUtils.button(`/pet box useitem`, '使用') : ''}`,
			`${st('性格')} ${set.nature}&emsp;${st('特性')} ${set.ability}`
		]
		const spriteURL = `${set.shiny ? POKESPRITESSHINY : POKESPRITES}/${Pet.spriteId(set.species, set.gender)}.gif`;
		const sprite = `background: transparent url(${spriteURL}) no-repeat 90% 10% relative;`
		pokeDiv = `<div style="line-height: 35px">${setTitle}</div>`;
		if (showDesc) {
			pokeDiv += `<div style=" display: inline-block; width: 50px; ` +
				`line-height: ${224 / setButtons.length}px; vertical-align: top;` +
				`">${setButtons.join('<br>')}</div>` +
				`<div style="${sprite} display: inline-block; line-height: 28px; width: 300px;` +
				`">${lines.map(x => `${x}`).join('<br>')}<br>${statsTable}`;
		}
		pokeDiv = `<div style="width: 350px; position: relative; display: inline-block;">${pokeDiv}</div>`;
	}

	const boxTitle = `${st('用户ID')} ${petUser.id}&emsp;${st('徽章数')} ${petUser.badgeNum()}`;
	const petButton = (species: string, pos: string, gender: string) => {
		const style = PetUtils.iconStyle(species, gender);
		if (petUser.operation === 'move') return PetUtils.button(`/pet box move ${target}<=>${pos}`, '', style);
		return PetUtils.button(`/pet box show ${pos}`, '', style, target === pos.split(' ').join(''));
	};
	const bagMons = petUser.property['bag'].map((x, i) => {
		return petButton(x.split('|')[1] || x.split('|')[0], `bag,${i}`, x.split('|')[7]);
	}).join('') + '<br>';
	const boxMons = petUser.property['box'].slice(petUser.onPage * 30, (petUser.onPage + 1) * 30).map((x, i) => {
		return petButton(x.split('|')[1] || x.split('|')[0], `box,${i + petUser.onPage * 30}`, x.split('|')[7]) +
			(i % 6 === 5 ? '<br>' : '');
	}).join('');
	let items = Shop.itemButtons(petUser, petUser.onPosition ? `/pet box item ${target}=>{}` : '', '<br>');
	const shopButton = PetUtils.button('/pet shop', '商店');
	const bagButtons = PetUtils.button('/pet box check', '检查') + ' ' + PetUtils.button('/pet box export', '导出');
	const pageNum = petUser.boxNum();
	const boxButtons = pageNum <= 1 ? '' : [
		PetUtils.button(`/pet box goto ${(petUser.onPage + pageNum - 1) % pageNum}`, '◀', 'padding: 3px'),
		PetUtils.button(`/pet box goto ${(petUser.onPage + 1) % pageNum}`, '▶', 'padding: 3px')
	].join(' ');
	const bagTabele = PetUtils.table(['背包'], [], [[bagButtons]], '240px', 'left', 'right');
	const boxTable = PetUtils.table([`盒子 ${petUser.onPage + 1}`], [], [[boxButtons]], '240px', 'left', 'right');
	let boxDiv = `<div style="width: 310px; vertical-align: top; display: inline-block;">` +
		`<div style="width: 250px; vertical-align: top; display: inline-block">` +
		`<div>${boxTitle}</div><div>${bagTabele}${bagMons}${boxTable}${boxMons}</div></div>` +
		`<div style="width: 60px; vertical-align: top; display: inline-block;">` +
		`<div style="height: 16px"></div><div>${shopButton}</div>` +
		`<div style="height: 216px; overflow: auto;">${items}</div></div></div>`;
	return `<div style="height: 300">${boxDiv}${pokeDiv}</div>`;
}

export const commands: Chat.ChatCommands = {

	name(target) {
		this.parse(`/pet box name ${target}`);
	},

	'link': 'ex',
	ex(target) {
		this.parse(`/pet box ex ${target}`);
	},

	ball() {
		this.parse(`/pet lawn ball Poke Ball`);
	},

	ball1() {
		this.parse(`/pet lawn ball Great Ball`);
	},

	ball2() {
		this.parse(`/pet lawn ball Ultra Ball`);
	},

	gym() {
		this.parse(`/j gym`);
	},

	'gen': 'add',
	add(target) {
		this.parse(`/pet lawn add ${target}`);
	},

	'rm': 'remove',
	remove(target) {
		this.parse(`/pet lawn remove ${target}`);
	},

	edit(target) {
		this.parse(`/pet admin edit ${target}`);
	},

	restore(target) {
		this.parse(`/pet admin restore ${target}`);
	},

	editgym(target) {
		this.parse(`/pet admin editgym ${target}`);
	},

	genpoke(target) {
		this.parse(`/pet admin genpoke ${target}`);
	},

	gift(target) {
		this.parse(`/pet admin gift ${target}`);
	},

	giveegg(target, room, user) {
		this.checkCan('bypassall');
		if (!target) return user.sendTo(room?.roomid || null, `|uhtml|pet-tmp|<code>/giveegg user</code>`);
		this.parse(`/pet admin genpoke egg=>${target}`)
	},

	giveitem(target, room, user) {
		this.checkCan('bypassall');
		if (!target.includes(',')) return user.sendTo(room?.roomid || null, `|uhtml|pet-tmp|<code>/giveitem user, item</code>`);
		this.parse(`/pet admin gift ${target.replace(',', '!')}`)
	},

	'petmode': 'pet',
	pet: {

		init: {

			'': 'show',
			show(target, room, user) {
				if (!user.registered) return PetUtils.popup(user, "请先注册账号!");
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (petUser.property) return this.parse('/pet init guide');
				this.parse('/pet init clear');
				user.sendTo(room.roomid, `|uhtml|pet-init-show|<b>欢迎使用宠物系统! 请选择您最初的伙伴:</b><br>${Pet.initButtons}`);
			},

			set(target, room, user) {
				if (!user.registered) return PetUtils.popup(user, "请先注册账号!");
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (petUser.property) return this.parse('/pet init guide');
				this.parse('/pet init clear');
				user.sendTo(
					room.roomid,
					`|uhtml|pet-init-show|<b>确认选择 ${target} 作为您最初的伙伴?</b> ` +
					PetUtils.boolButtons(`/pet init confirm ${target}`, '/pet init show')
				);
			},

			confirm(target, room, user) {
				if (!user.registered) return PetUtils.popup(user, "请先注册账号!");
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (petUser.property) return this.parse('/pet init guide');
				if (Pet.initMons.indexOf(target) < 0) return PetUtils.popup(user, `${target}不是合法初始的宝可梦`)

				petUser.init();
				petUser.addPet(Pet.gen(target, 5, 6, 70, 0, 0));
				petUser.addItem('Poke Ball', 5);
				petUser.save();

				this.parse('/pet init guide');
			},

			guide(target, room, user) {
				if (!user.registered) return PetUtils.popup(user, "请先注册账号!");
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				this.parse('/pet init clear');
				user.sendTo(
					room.roomid,
					`|uhtml|pet-init-show|<b>您已领取最初的伙伴!</b> 快进入 ${PetUtils.button('/pet box show new', '盒子')} 查看吧!`
				);
			},

			clear(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				user.sendTo(room.roomid, `|uhtmlchange|pet-init-show|`);
			}

		},

		box: {

			'': 'shownew',
			shownew(target, room, user) {
				this.parse('/pet box show new')
			},

			showat(target, room, user) {
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				this.parse(`/pet box show ${petUser.onPosition ? Object.values(petUser.onPosition).join(',') : ''}`);
			},

			show(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				this.parse('/pet init clear');
				this.parse('/pet shop clear new');
				petUser.chatRoomId = room.roomid;
				petUser.load();
				const div = petBox(petUser, target, user.can("bypassall"));
				this.parse(`/pet box clear ${target}`);
				user.sendTo(room.roomid, `|uhtml${target === 'new' ? '' : 'change'}|pet-box-show|${div}`);
			},

			goto(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.onPage = (parseInt(target) || 0) % petUser.boxNum();
				this.parse(`/pet box showat`);
			},

			check(target, room, user) {
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				const userSets = petUser.property['bag'].filter(Pet.validPet);
				const validateRes = PetBattle.validate('Darmanitan-Galar, Shadow Tag, Baton Pass', userSets);
				if (validateRes) return PetUtils.popup(user, `在宠物平衡模式对战中, ${validateRes}! (进入对战后将被过滤)`);
				PetUtils.popup(user, `您的队伍是合法的!`);
			},

			export(target, room, user) {
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				let userTeam = Teams.unpack(petUser.property['bag'].filter(Pet.validPet).join(']'));
				if (!userTeam) return PetUtils.popup(user, "您的背包有格式错误!");
				userTeam = userTeam.map(Pet.correctAbility);
				this.popupReply(Teams.export(userTeam));
			},

			onmove(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.operation = 'move';
				this.parse(`/pet box show ${target}`);
			},

			move(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.operation = undefined;
				const targets = target.split('<=>').map(x => x.trim());
				if (targets.length !== 2) return user.sendTo(
					room.roomid,
					"|uhtml|pet-tmp|<code>/pet box move [bag|box],index1<=>[bag|box],index2</code>"
				);
				const pos1 = petUser.parsePosition(targets[0]);
				const pos2 = petUser.parsePosition(targets[1]);
				if (!pos1 || !pos2) return PetUtils.popup(user, `位置不存在!`);
				petUser.load();
				if (petUser.movePet(pos1, pos2)) {
					petUser.save();
					this.parse(`/pet box show ${targets[1]}`);
				} else {
					PetUtils.popup(user, `背包里不能没有可以战斗的宝可梦!`);
				}
			},

			evo(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				// [进化]: petUser.operation = evo, /pet box show = 希望的进化型(/pet box evo {target}=>{goal})
				// [选择进化型]: petUser.operation = evo{goal},
				//              /pet box show = 确认(/pet box evo {target}=>{goal}) | 取消(/pet box evo {target})
				// [确认]: petUser.operation = undefined, /pet box show = 进化(/pet box evo {target})
				const targets = target.split('=>').map(x => x.trim());
				target = targets[0];
				const goal = targets[1];
				const position = petUser.parsePosition(target, true);
				if (!position) return PetUtils.popup(user, '位置不存在!');
				const availableEvos = petUser.checkEvo(position);
				if (availableEvos.length === 0) {
					return PetUtils.popup(user, '不满足进化条件!');
				}
				if (petUser.operation?.indexOf('evo') === 0) {
					if (targets.length !== 2) {
						petUser.operation = undefined;
					} else {
						const index = availableEvos.map(x => x[0]).indexOf(goal);
						if (index < 0) return PetUtils.popup(user, '进化型不合法!');
						if (petUser.operation.slice(3) === goal) {
							petUser.load();
							if (petUser.evo(position, goal, !!availableEvos[index][1])) {
								PetUtils.popup(user, '进化成功!');
								petUser.operation = undefined;
								petUser.save();
							} else {
								PetUtils.popup(user, '进化失败!');
							}
						} else {
							petUser.operation = 'evo' + goal;
						}
					}
				} else {
					petUser.operation = 'evo';
				}
				this.parse(`/pet box show ${target}`);
			},

			item(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				const targets = target.split('=>').map(x => x.trim());
				target = targets[0];
				const position = petUser.parsePosition(target, true);
				if (!position) return PetUtils.popup(user, '位置不存在!');
				if (petUser.operation) return PetUtils.popup(user, '不能在进行其他操作的过程中更换道具!');

				petUser.load();
				if (petUser.setItem(position, targets[1])) petUser.save();

				this.parse(`/pet box show ${target}`);
			},

			useitem(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!Pet.validPet(petUser.getPet())) return PetUtils.popup(user, "请先选中要使用道具的宝可梦!")

				petUser.load();
				target = toID(target);
				if (!target) {
					petUser.operation = 'useitem';
				} else if (petUser.useItem(target)) {
					petUser.save();
					delete petUser.operation;
				} else {
					PetUtils.popup(user, '道具使用失败!');
				}

				this.parse(`/pet box showat`);
			},

			moves(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				user.sendTo(room.roomid, `|uhtmlchange|pet-box-show|`);
				const targets = target.split('=>').map(x => x.trim());
				target = targets[0];
				const position = petUser.parsePosition(target, true);
				if (!position) return PetUtils.popup(user, '位置不存在!');
				petUser.load();
				const set = petUser.checkPet(position);
				if (!set) return PetUtils.popup(user, '位置是空的!');
				if (!(petUser.onChangeMoves)) {
					petUser.onChangeMoves = {
						'position': position,
						'selected': set.moves,
						'valid': Pet.validMoves(set.species, set.level).map(x => Dex.moves.get(x).name)
					};
				}
				const div = (x: string) =>
					`<div style="display: inline-block; position: relative; width: 200px; padding: 5px; border: ridge;` +
					` height: 150px; overflow: auto; vertical-align: top;">${x}</div>`;
				const valid = petUser.onChangeMoves['valid'].map(move =>
					PetUtils.button(`/pet box addmove ${target}=>${move}`, move, `${Pet.moveIcons[move]} width: 180px;`)
				).join('<br>');
				const selected = petUser.onChangeMoves['selected'].map(move =>
					PetUtils.button(`/pet box addmove ${target}=>${move}`, move, `${Pet.moveIcons[move]} width: 180px;`)
				).join('<br>');
				const buttons = PetUtils.boolButtons(`/pet box setmoves ${target}!`, `/pet box setmoves ${target}`);
				if (targets.length === 1) {
					user.sendTo(room.roomid, `|uhtml|pet-moves-show|<b>请选择招式:</b><br>${div(valid)}`);
					user.sendTo(room.roomid, `|uhtml|pet-moves-select|${div(`${selected}<br>${buttons}`)}`);
				} else {
					user.sendTo(room.roomid, `|uhtmlchange|pet-moves-select|${div(`${selected}<br>${buttons}`)}`);
				}
			},

			addmove(target, room, user) {
				const targets = target.split('=>');
				if (targets.length !== 2) return PetUtils.popup(user, '请先指定需要更改招式的宝可梦');
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!petUser.onChangeMoves) return PetUtils.popup(user, '请先指定需要更改招式的宝可梦');
				const selectedIndex = petUser.onChangeMoves['selected'].indexOf(targets[1]);
				if (selectedIndex >= 0) {
					petUser.onChangeMoves['selected'].splice(selectedIndex, 1);
					return this.parse(`/pet box moves ${target}`);
				}
				const validIndex = petUser.onChangeMoves['valid'].indexOf(targets[1]);
				if (validIndex >= 0 && petUser.onChangeMoves['selected'].length < 4) {
					petUser.onChangeMoves['selected'].push(targets[1]);
					return this.parse(`/pet box moves ${target}`);
				}
			},

			setmoves(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				const targets = target.split('!').map(x => x.trim());
				petUser.load();
				target = targets[0];
				if (targets.length === 2 && petUser.onChangeMoves && petUser.onChangeMoves['selected'].length > 0) {
					const position = petUser.parsePosition(target, true);
					if (!position) return PetUtils.popup(user, '位置不存在!');
					if (petUser.changeMoves(position)) petUser.save();
				}
				this.parse(`/pet box show new`);
				this.parse(`/pet box show ${target}`);
			},

			drop(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				const targets = target.split('!').map(x => x.trim());
				target = targets[0];
				petUser.load();
				const position = petUser.parsePosition(target, true);
				if (!position) return PetUtils.popup(user, '位置不存在!');
				const set = petUser.checkPet(position);
				if (!set) return PetUtils.popup(user, '位置是空的!');
				if (petUser.operation === 'drop' + target) {
					petUser.operation = undefined;
					if (targets.length === 2) {
						if (petUser.removePet(position, set.item)) {
							petUser.save();
						} else {
							PetUtils.popup(user, '背包不能为空!');
						}
					}
				} else {
					petUser.operation = 'drop' + target;
				}
				this.parse(`/pet box show ${target}`);
			},

			async ex(target, room, user) {
				if (!(await AdminUtils.addScore(user.name, 0))[0]) {
					return PetUtils.popup(user, "您没有国服积分, 不能与其他玩家交换宝可梦哦");
				}
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!Pet.validPet(petUser.getPet())) return PetUtils.popup(user, "请先选中想要交换的宝可梦!");
				// 1. A按下[交换]: (A)/pet box ex  弹出交换提示
				// 2. A根据提示: (A)/pet box ex B  A.operation='readyexB'  A.title=请等待B回应,重新发送,取消
				//               B弹窗  B.operation='preexA'  B.title=接受与A交换,取消
				// 3. B按下[确认]: (B)/pet box ex A  if (A.operation='readyexB') => 执行交换操作 => A,B.operation=undefined
				if (!target) { petUser.operation = 'ex'; return this.parse('/pet box showat'); }
				const friend = Users.get(target);
				if (!friend) return PetUtils.popup(user, `没有找到用户 ${target} !`)
				if (!(await AdminUtils.addScore(friend.name, 0))[0]) {
					return PetUtils.popup(user, `${friend.name}没有国服积分, 不能与您交换宝可梦哦`);
				}
				const petFriend = getUser(friend.id);
				if (!petFriend.property) return PetUtils.popup(user, `${friend.name}还未领取最初的伙伴!`);
				if (petFriend.operation === `readyex${user.id}`) {
					if (!petFriend.onPosition) return PetUtils.popup(user, `${friend.name}还未选中想要交换的宝可梦!`);
					petUser.load();
					petFriend.load();
					const toSend = petUser.getPet();
					const toReceive = petFriend.getPet();
					const exResult = petUser.linkExchange(petFriend);
					if (typeof exResult === 'string') {
						PetUtils.popup(user, exResult);
					} else {
						PetUtils.popup(user, `您用 ${exResult['sent']} 与${friend.name}交换了 ${exResult['received']} !`)
						PetUtils.popup(friend, `您用 ${exResult['received']} 与${user.name}交换了 ${exResult['sent']} !`)
						FS(`${TRADELOGPATH}/${PetUtils.getDate()}.txt`).append(
							`${petUser.id}, ${petFriend.id}: ${toSend} <=> ${toReceive}\n`
						);
						petUser.save();
						petFriend.save();
					}
					petUser.operation = undefined;
					petFriend.operation = undefined;
					const friendRoom = Rooms.get(petFriend.chatRoomId);
					if (friendRoom) {
						friend.sendTo(friendRoom.roomid, `|uhtmlchange|pet-box-show|${petBox(
							petFriend,
							petFriend.onPosition ? Object.values(petFriend.onPosition).join(',') : ''
						)}`);
					}
				} else if (petFriend.operation) {
					return PetUtils.popup(user, `${friend.name}正在操作箱子, 请稍候`);
				} else {
					petUser.operation = `readyex${friend.id}`;
					PetUtils.popup(friend, `${user.name}想与您交换宝可梦! 快去盒子里看看吧!`);
					petFriend.operation = `preex${user.id}`;
				}
				this.parse(`/pet box showat`);
			},

			hatch(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!petUser.getPet()) return PetUtils.popup(user, "请先选中想要孵化的蛋!");
				petUser.load();
				if (!petUser.hatch()) return PetUtils.popup(user, "还不能够孵化哦");
				petUser.save();
				PetUtils.popup(user, '孵化成功!');
				this.parse(`/pet box showat`);
			},

			nameguide(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (Pet.validPet(petUser.getPet())) petUser.operation = 'name';
				this.parse(`/pet box showat`);
			},

			name(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!Pet.validPet(petUser.getPet())) return PetUtils.popup(user, "请先选中想要命名的宝可梦!");
				if (target.length > 20) return PetUtils.popup(user, "这个名字太长了!");
				petUser.load();
				if (petUser.namePet(target)) {
					petUser.save();
					PetUtils.popup(user, '修改成功!');
					this.parse(`/pet box showat`);
				}
			},

			resetstat(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!Pet.validPet(petUser.getPet())) return PetUtils.popup(user, "请先选中想要修改的宝可梦!");
				let confirm = false;
				if (target.indexOf('!') >= 0) {
					confirm = true;
					target = target.split('!')[0];
				}
				const statPosition = PetUtils.parseStatPosition(target);
				if (!statPosition) return user.sendTo(
					room.roomid,
					"|uhtml|pet-tmp|<code>/pet box resetstat [ivs|evs],[hp|atk|def|spa|spd|spe]!</code>"
				);
				if (confirm) {
					petUser.load();
					if (petUser.resetStat(statPosition)) {
						PetUtils.popup(user, "修改成功!");
						petUser.operation = undefined;
						petUser.save();
					}
				} else {
					petUser.operation = `resetstat${statPosition['type']},${statPosition['index']}`
				}
				this.parse(`/pet box showat`);
			},

			revive(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!Pet.fossilMons[target]) return PetUtils.popup(user, `没有名为 ${target} 的化石宝可梦!`);
				petUser.load();
				if (!Pet.fossilMons[target].every(x => petUser.property?.items[x])) return PetUtils.popup(user, `您没有对应的化石!`);
				if (!petUser.addPet(Pet.gen(target, 20, 3, 70))) return PetUtils.popup(user, `您的盒子没有空位了!`);
				Pet.fossilMons[target].forEach(x => petUser.removeItem(x, 1));
				petUser.save();
				PetUtils.popup(user, `复活成功!`);
				this.parse(`/pet box`);
			},

			reset(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.operation = undefined;
				this.parse(`/pet box show ${target}`);
			},

			receive(target, room, user) {
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				const gift = new PetUser(user.id, GIFTPATH);
				if (!gift.property) return PetUtils.popup(user, '没有可以领取的礼物!');

				petUser.load();
				const received = petUser.merge(gift);
				let replies = [];
				for (let itemname in received['items']) replies.push(`您获得了${received['items'][itemname]}个 ${itemname} !`);
				for (let petspecies of received['bag']) replies.push(`您获得了 ${petspecies} !`);
				if (gift.property['bag'].length > 0) {
					replies.push(`您的盒子没有空位了!`);
					gift.save();
				} else {
					gift.destroy();
				}
				petUser.save();
				PetUtils.popup(user, replies.join('\n'));
				if (room) this.parse(`/pet box show new`);
			},

			clear(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.onChangeMoves = undefined;
				if (target === 'new') {
					user.sendTo(room.roomid, `|uhtmlchange|pet-tmp|`);
					user.sendTo(room.roomid, `|uhtmlchange|pet-moves-show|`);
					user.sendTo(room.roomid, `|uhtmlchange|pet-moves-select|`);
					user.sendTo(room.roomid, `|uhtmlchange|pet-box-show|`);
				}
			},

		},

		lawn: {

			'': 'guide',
			guide(target, room, user) {
				this.parse('/pet help lawn');
			},

			search(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.chatRoomId = room.roomid;
				const bot = Users.get(BOTID);
				if (!bot || PetBattle.inBattle(user.id)) return PetUtils.popup(user, 
					room.roomid === 'gym' ? "馆主离开了哦" : "没有发现野生的宝可梦哦"
				);
				const wantLegend = target.indexOf('!') >= 0 && !!PetBattle.legends[room.roomid];

				petUser.load();
				let battleRoom: GameRoom | undefined;
				if (room.roomid === 'gym') { // Gym
					// Gym Existence Check
					if (!PetBattle.gymConfig[target]) return this.parse('/pet help lawn');
					// Legality Check
					const userSets = petUser.property['bag'].filter(Pet.validPet);
					const validateRes = PetBattle.validate(PetBattle.gymConfig[target]['userteam'], userSets);
					if (validateRes) return PetUtils.popup(user, `根据${target}道馆的要求, ${validateRes}!`);
					// Frequency Check
					if (Date.now() - petUser.property['time']['gym'] < GYMCD) {
						return PetUtils.popup(user, `您在${Math.floor(GYMCD / 60000)}分钟内已挑战过道馆, 请稍后再来!`);
					}
					petUser.property['time']['gym'] = Date.now();
					// Create Battle & Restrict User Team Level & Record Battle Information
					const rule = `gen8petmode @@@pschinapetmodegym`;
					const maxLevel = PetBattle.gymConfig[target]['maxlevel'];
					const userTeam = userSets.map(set => {
						const features = set.split('|');
						features[10] = (features[10] ? Math.min(maxLevel, parseInt(features[10])) : maxLevel).toString();
						return features.join('|');
					}).filter(Pet.validPet).join(']');
					const botTeam = PetBattle.gymConfig[target]['botteam'];
					petUser.battleInfo = 'gym';
					FS(`${DEPOSITPATH}/${user.id}.txt`).safeWriteSync(target);
					battleRoom = PetBattle.createBattle(user, bot, userTeam, botTeam, rule, false);
				} else if (PetBattle.bossConfig[target]) { // Boss
					// Frequency Check
					const today = PetUtils.getDay();
					const nextValidDay = Math.floor(petUser.property['time']['boss'] / BOSSLIMIT);
					if (nextValidDay < today) {
						petUser.property['time']['boss'] = today * BOSSLIMIT + 1;
					} else if (nextValidDay === today) {
						petUser.property['time']['boss']++;
					} else {
						return PetUtils.popup(user, `您今日已挑战${BOSSLIMIT}次霸主宝可梦!`);
					}
					// Create Battle & Record Battle Information
					const rule = 'gen8petmodebossbattle';
					petUser.battleInfo = 'boss';
					FS(`${DEPOSITPATH}/${user.id}.txt`).safeWriteSync(target);
					battleRoom = PetBattle.createBattle(user, bot, 'random', 'random', rule, false, 'multi');
				} else { // Wild
					// Frequency Check
					if (!wantLegend) {
						const today = PetUtils.getDay();
						const counts = user.ips.map(ip => ipSearchCount[ip] || 0).concat([petUser.property['time']['count']]);
						let maxCount = Math.max(...counts);
						const nextValidDay = Math.floor(maxCount / LAWNLIMIT);
						if (nextValidDay < today) {
							maxCount = today * LAWNLIMIT + 1;
						} else if (nextValidDay === today) {
							maxCount++;
						} else {
							return PetUtils.popup(user, `您的宝可梦很累了, 请明天再来!`);
						}
						petUser.property['time']['count'] = maxCount;
						user.ips.forEach(ip => ipSearchCount[ip] = maxCount);
						if (Date.now() - petUser.property['time']['search'] < LAWNCD) {
							return PetUtils.popup(user, `您的宝可梦累了, 请稍后再来!`);
						}
						petUser.property['time']['search'] = Date.now();
					}
					// Level & Lawn Existence Check
					const wildPokemon = Pet.wild(room.roomid, target, petUser.maxLevel(), petUser.levelRistriction(), wantLegend);
					if (!wildPokemon) return PetUtils.popup(user, '没有发现野生的宝可梦哦');
					// Create Battle
					const rule = 'gen8petmode @@@pschinapetmodewild';
					petUser.battleInfo = wildPokemon + (wantLegend ? `<=${room.roomid}` : '');
					battleRoom = PetBattle.createBattle(user, bot, 'random', wildPokemon, rule, !wantLegend);
				}
				petUser.save();
				// Force Timer
				battleRoom?.battle?.timer.start();

				// if (wantLegend && battleRoom) {
				// 	room.add(`|html|<div style="text-align: center;"><a href='${battleRoom.roomid}'>` +
				// 		`${user.name} 开始了与 ${PetBattle.legends[room.roomid].split('|')[0]} 的战斗!</a></div>`).update();
				// }
			},

			ball(target, room, user) {
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!room || !room.battle || !petUser.battleInfo) return PetUtils.popup(user, "请在对战房间里捕捉宝可梦!");
				if (petUser.battleInfo === 'gym') return PetUtils.popup(user, "不能捕捉道馆的宝可梦!");
				if (petUser.battleInfo === 'boss') return PetUtils.popup(user, "不能捕捉霸主宝可梦!");
				if (PetBattle.inBattle(user.id) !== room.roomid) return PetUtils.popup(user, "没有可以捕捉的宝可梦!");
				petUser.load();
				const balls = petUser.balls();
				if (balls.length === 0) return PetUtils.popup(user, `您还没有可以使用的精灵球哦`);
				user.sendTo(room.roomid, `|uhtmlchange|pet-ball|`);
				if (target) {
					if (!petUser.removeItem(target, 1)) return PetUtils.popup(user, `您的背包里没有${target}!`);
					if (!PetBattle.balls[target]) return PetUtils.popup(user, `请使用精灵球!`);
					const parsed = petUser.battleInfo.split('<=');
					const features = parsed[0].split('|');
					const roomOfLegend = parsed[1];
					const foeLevel = parseInt(features[10]) || 100;
					const foeSpecies = features[1] || features[0];
					if (roomOfLegend && !PetBattle.legends[roomOfLegend]) {
						PetUtils.popup(user, `很遗憾, ${roomOfLegend} 房间里的 ${foeSpecies} 已经离开了。`);
						petUser.addItem(target, 1);
					} else if (roomOfLegend && PetBattle.legends[roomOfLegend].includes('!') && target === 'Master Ball') {
						PetUtils.popup(user, `这只宝可梦不能使用大师球捕获!`);
						petUser.addItem(target, 1);
					} else if (!petUser.catch(target, !!roomOfLegend)) {
						PetUtils.popup(user, `捕获失败!`);
					} else if (!petUser.addPet(parsed[0])) {
						PetUtils.popup(user, `您的盒子里没有空位了!`);
						petUser.addItem(target, 1);
					} else {
						PetUtils.popup(user, `捕获成功! 快进入盒子查看吧!`);
						petUser.battleInfo = undefined;
						this.parse('/forfeit');
						petUser.addExperience(foeSpecies, foeLevel);
						if (roomOfLegend) {
							Rooms.get(roomOfLegend)?.add(`|uhtmlchange|pet-legend|`);
							Rooms.get(roomOfLegend)?.add(
								`|uhtml|pet-legend|<div class='broadcast-green' style="text-align: center;"><b>${
									user.name
								} 成功捕获了野生的 ${foeSpecies}!</b></div>`
							).update();
							delete PetBattle.legends[roomOfLegend];
						}
					}
					petUser.save();
				} else {
					user.sendTo(room.roomid, `|uhtml|pet-ball|${balls.map(item => PetUtils.button(
						`/pet lawn ball ${item}`, '', PetUtils.itemStyle(item)
					)).join(' ')}`);
				}
			},

			add(target, room, user) {
				this.checkCan('bypassall');
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				if (PetBattle.legends[room.roomid]) return PetUtils.popup(user, `${room.title} 房间里的宝可梦还未被捕获`);
				const set = Pet.genPokeByDesc(target) + (target.includes('!') ? '!' : '');
				if (!set) return user.sendTo(
					room.roomid,
					"|uhtml|pet-tmp|<code>/add Pikachu, L10, 3V, S, H!</code><br><code>!</code>代表不能被大师球捕获"
				);
				PetBattle.legends[room.roomid] = set;
				const species = set.split('|')[0];
				const gender = set.split('|')[7];
				const legendStyle = 'font-size: 12pt; text-align: center; height: 170px';
				const imageUrl = `${set.split('|')[9] ? POKESPRITESSHINY : POKESPRITES}/${Pet.spriteId(species, gender)}.gif`;
				room.add(`|uhtmlchange|pet-legend|`);
				room.add(
					`|uhtml|pet-legend|<div class='broadcast-green' style="${legendStyle}">` +
					`<b>野生的 ${species} 出现了!</b><br>` +
					`${PetUtils.image(`background: url(${imageUrl}) no-repeat center; width: 100%; height: 120px`)}<br>` +
					`${PetUtils.button('/pet lawn search !', '挑战!')}</div>`
				);
			},

			'rm': 'remove',
			remove(target, room, user) {
				this.checkCan('bypassall');
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				if (PetBattle.legends[room.roomid]) {
					room.add(`|uhtmlchange|pet-legend|`);
					room.add(`|uhtml|pet-legend|<div class='broadcast-green' style="text-align: center;">` +
						`<b>野生的 ${PetBattle.legends[room.roomid].split('|')[0]} 离开了。</b></div>`);
					delete PetBattle.legends[room.roomid];
					PetUtils.popup(user, `已删除 ${room.title} 房间里的宝可梦`);
				}
			},

		},

		shop: {

			'': 'shownew',
			shownew(target, room, user) {
				this.parse('/pet shop show new');
			},

			async show(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.chatRoomId = room.roomid;
				this.parse('/pet box clear new');
				this.parse(`/pet shop clear ${target}`);
				const targets = target.split('=>');
				const goodtype = Shop.types[targets[0]] ? targets[0] : 'ball';
				const goodname = targets[1];
				let title = Object.keys(Shop.types).map(x => PetUtils.button(`/pet shop show ${x}`, Shop.types[x])).join('');
				let content = '';
				switch (targets[0]) {
				case 'sell':
					content = Shop.itemButtons(petUser);
					if (goodname && petUser.hasItem(goodname)) {
						title = `卖出 ${goodname} ? (无法获得积分, 但可以获得随机礼物)<br>` +
							PetUtils.boolButtons(`/pet shop sell ${goodname}`, `/pet shop show ${goodtype}`) +
							`<br><br>${title}`;
					} else {
						title = `请选择要卖出的道具:<br>${title}`
					}
					break;
				case 'revive':
					const userItems = Object.keys(petUser.property['items']);
					const availableMons = Object.keys(Pet.fossilMons).filter(s => Pet.fossilMons[s].every(x => userItems.includes(x)));
					if (availableMons.includes(targets[1])) {
						const fossils = Pet.fossilMons[targets[1]].map(fossil => `1个 ${fossil} `).join('和');
						content = `<b>确认使用${fossils}复活 ${targets[1]} ? </b>` +
							PetUtils.boolButtons(`/pet box revive ${targets[1]}`, '/pet shop show revive');
					} else if (availableMons.length) {
						content = `<b>请选择要复活的化石宝可梦: </b>` + availableMons.map(species => PetUtils.button(
							`/pet shop show revive=>${species}`, '&emsp;', PetUtils.iconStyle(species)
						)).join('');
					} else {
						content = `<b>您没有可以复活的化石宝可梦哦</b>`;
					}
					break;
				case 'lottery':
					let buyUI = '';
					const userLottery = petUser.getLottery();
					const ltConfig = Shop.lotteryConfig;
					if (Date.now() < new Date(ltConfig['start']).getTime()) {
						buyUI = `<b>本期彩票还未起售</b>`;
					} else if (userLottery) {
						const nums = userLottery.split(',').map(x => parseInt(x));
						buyUI = [
							`<b>您的彩票</b>`,
							`HP=${nums[0]} 攻击=${nums[1]} 防御=${nums[2]} 特攻=${nums[3]} 特防=${nums[4]} 速度=${nums[5]}`
						].join('<br>')
					} else if (targets[1] && !['edit', 'close', 'clear'].includes(targets[1])) {
						const nums = targets[1].split(',').map(x => parseInt(x));
						if (nums.length !== 6 || nums.some(x => !(x >= 0 && x <= 31))) {
							this.parse('/pet shop show lottery');
							return PetUtils.popup(user, '请输入6个0到31之间的整数!');
						}
						buyUI = [
							`<b>购买彩票</b>`,
							`确认花费5积分购买以下数值的彩票?`,
							`HP=${nums[0]} 攻击=${nums[1]} 防御=${nums[2]} 特攻=${nums[3]} 特防=${nums[4]} 速度=${nums[5]}`,
							PetUtils.boolButtons(`/pet shop buylottery ${targets[1]}`, '/pet shop show lottery')
						].join('<br>')
					} else {
						buyUI = `<b>购买彩票</b><br>` + [
							`<form data-submitsend="/msgroom ${room.roomid}, /pet shop show lottery=>{h},{a},{b},{c},{d},{s}">`,
							`<b>HP</b> <input name="h" style="width: 20px"> <b>攻击</b> <input name="a" style="width: 20px"> `,
							`<b>防御</b> <input name="b" style="width: 20px"> <b>特攻</b> <input name="c" style="width: 20px"> `,
							`<b>特防</b> <input name="d" style="width: 20px"> <b>速度</b> <input name="s" style="width: 20px"> `,
							`<br><button class="button" type="submit">购买</button></form>`
						].join('');
					}
					const lines = [
						`<b>宝可梦彩票</b>`,
						`发售时间: ${ltConfig['start']} 08:00:00 至 ${ltConfig['end']} 08:00:00`,
						`开奖时间: ${ltConfig['end']} 晚间`,
						``,
						`<b>游戏规则</b>`,
						`1. 在发售时间内选择6个0到31之间的整数代表一只宝可梦的个体值, 花费${ltConfig['price']}积分购买一张彩票`,
						`2. 开奖时, 主办方直播捕获一只野生的宝可梦 (直播间链接: <a href="${ltConfig['live']}"/>${ltConfig['live']}</a>)`,
						`3. 如果被捕获的野生宝可梦的个体值与您选择的个体值有一项或多项相同, 将按下表为您发放奖励`,
						``,
						`<b>奖品</b>`,
						PetUtils.table(
							[], [],
							Object.values(ltConfig['awards']).map((award, i) => [`${i + 1}项个体值相同`, Shop.parseAward(award)]),
							'100%', 'left', 'left'
						),
						buyUI
					];
					if (ltConfig['host'].includes(user.id)) {
						lines.push(``);
						switch (targets[1]) {
						case 'edit':
							lines.push(`<b>设置彩票</b><br>` + [
								`<form data-submitsend="/msgroom ${room.roomid}, /pet shop setlottery {s}|{e}|{1}|{2}|{3}|{4}|{5}|{6}">`,
								`<b>起售日期</b> <input name="s" style="width: 70%" value="${PetUtils.getDate(new Date(), 1)}"><br>`,
								`<b>开奖日期</b> <input name="e" style="width: 70%" value="${PetUtils.getDate(new Date(), 7)}"><br>`,
								`<b>1V奖励</b> <input name="1" style="width: 70%" value="${ltConfig['awards']['1v']}"><br>`,
								`<b>2V奖励</b> <input name="2" style="width: 70%" value="${ltConfig['awards']['2v']}"><br>`,
								`<b>3V奖励</b> <input name="3" style="width: 70%" value="${ltConfig['awards']['3v']}"><br>`,
								`<b>4V奖励</b> <input name="4" style="width: 70%" value="${ltConfig['awards']['4v']}"><br>`,
								`<b>5V奖励</b> <input name="5" style="width: 70%" value="${ltConfig['awards']['5v']}"><br>`,
								`<b>6V奖励</b> <input name="6" style="width: 70%" value="${ltConfig['awards']['6v']}"><br>`,
								`<button class="button" type="submit">确定</button>`,
								`<button class="button" name="send" value="/pet shop show lottery">取消</button></form>`
							].join(''));
							break;
						case 'close':
							lines.push(`<b>开奖</b><br>` + [
								`<form data-submitsend="/msgroom ${room.roomid}, /pet shop closelottery {sp}|{h},{a},{b},{c},{d},{s}">`,
								`<b>种类</b> <input name="sp"><br>`,
								`<b>个体</b> HP <input name="h" style="width: 20px"> `,
								`攻击 <input name="a" style="width: 20px"> 防御 <input name="b" style="width: 20px"> `,
								`特攻 <input name="c" style="width: 20px"> 特防 <input name="d" style="width: 20px"> `,
								`速度 <input name="s" style="width: 20px"><br>`,
								`<button class="button" type="submit">确定</button>`,
								`<button class="button" name="send" value="/pet shop show lottery">取消</button></form>`
							].join(''));
							break;
						case 'clear':
							lines.push(`确认清空彩票数据? ${PetUtils.boolButtons('/pet shop clearlottery', '/pet shop show lottery')}`);
							break;
						default:
							lines.push(
								PetUtils.button('/pet shop show lottery=>close', '开奖') +
								PetUtils.button('/pet shop show lottery=>edit', '设置彩票') +
								PetUtils.button('/pet shop show lottery=>clear', '清空彩票数据')
							);
						}
					}
					content = lines.join('<br>');
					break;
				default:
					content = Shop.goodButtons[goodtype];
					const goods = Shop.shopConfig[goodtype];
					if (goods[goodname]) {
						let price = goods[goodname];
						if (toID(goodname) === 'box') price *= petUser.getBoxPriceBase();
						if (price > 0) {
							title = `购买 ${goodname} ? ` +
								`(${price}积分/1个${Shop.goodDesc[goodname] ? `, 效果: ${Shop.goodDesc[goodname]}` : ''})<br>` +
								PetUtils.button(`/pet shop buy ${goodtype}=>${goodname}!`, '购买5个!') +
								PetUtils.button(`/pet shop buy ${goodtype}=>${goodname}`, '购买1个') +
								PetUtils.button(`/pet shop show ${goodtype}`, '取消') +
								`<br><br>${title}`;
						} else {
							title = `领取5个 ${goodname} ?<br>` +
								`${PetUtils.boolButtons(`/pet shop buy ${goodtype}=>${goodname}!`, `/pet shop show ${goodtype}`)}` +
								`<br><br>${title}`;
						}
					} else {
						title = `请选择商品:<br>${title}`
					}
				}
				title = `<div><b>${title}</b><br><br></div>`;
				user.sendTo(room.roomid, `|uhtml${target === 'new' ? '' : 'change'}|pet-shop-show|` +
					`${title}<div style="border: ridge; padding: 5px">${content}</div>` +
					`${PetUtils.button('/pet shop buy ball=>Poke Ball!', '领取5个精灵球!')}` +
					`${PetUtils.button('/pet shop draw', '领取随机道具!')}` +
					`${PetUtils.button(`/score !`, '查看积分')}${PetUtils.button(`/pet box show new`, '返回')}`);
			},

			async buy(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				const targets = target.split('=>');
				if (targets.length !== 2) return user.sendTo(
					room.roomid,
					"|uhtml|pet-tmp|<code>/pet shop buy 商品种类=>商品名</code>"
				);
				const goodtype = targets[0];
				if (!Shop.shopConfig[goodtype]) return PetUtils.popup(user, `没有名为 ${goodtype} 的商品种类`);
				const goods = Shop.shopConfig[goodtype];
				let goodname = targets[1];
				const goodnames = goodname.split('!');
				goodname = goodnames[0];
				let num = goodnames.length > 1 ? 5 : 1;
				if (!goods[goodname]) return PetUtils.popup(user, `没有名为 ${goodname} 的${Shop.types[goodtype]}!`);
				if (toID(goodname) === 'box' && num > 1) return PetUtils.popup(user, `不可以一次性购买多个盒子!`);
				let price = goods[goodname];
				if (toID(goodname) === 'box') price *= petUser.getBoxPriceBase();
				petUser.load();
				if (price > 0) {
					const changeScores = await AdminUtils.addScore(user.name, -price * num, `购买 ${num} 个 ${goodname}`);
					if (changeScores.length !== 2) return PetUtils.popup(user, `积分不足!`);
					PetUtils.popup(user, `您获得了${num}个 ${goodname} ! 您现在的积分是: ${changeScores[1]}`);
				} else {
					if (Date.now() - petUser.property['time']['ball'] < BALLCD) {
						return PetUtils.popup(user, `您在${Math.floor(BALLCD / 60000)}分钟内已领取过 ${goodname} !`);
					}
					if (petUser.property['items'][goodname]) {
						let validNum = PetUtils.restrict(num, 0, 20 - petUser.property['items'][goodname]);
						if (num > validNum) {
							num = validNum;
							PetUtils.popup(user, `由于免费道具最多只能持有20个, 您领取了${num}个 ${goodname}`);
						}
					}
					if (num > 0) petUser.property['time']['ball'] = Date.now();
				}
				if (toID(goodname) === 'box') {
					petUser.addBox();
				} else {
					petUser.addItem(goodname, num);
				}
				petUser.save();
				this.parse('/pet box shownew');
			},

			draw(target, room, user) {
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.load();
				const day = PetUtils.getDay();
				if (day <= petUser.property['time']['draw']) return PetUtils.popup(user, "您今日已领取随机道具!");
				const randomItem = prng.sample(Object.keys(Shop.shopConfig['draw']));
				petUser.property['time']['draw'] = day;
				petUser.addItem(randomItem, 1);
				petUser.save();
				PetUtils.popup(user, `您获得了1个 ${randomItem}!`);
				this.parse(`/pet box shownew`);
			},

			sell(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				petUser.load();
				if (!target)  return user.sendTo(
					room.roomid,
					"|uhtml|pet-tmp|<code>/pet shop sell 道具名</code>"
				);
				if (!petUser.hasItem(target)) return PetUtils.popup(user, `您没有道具 ${target} !`);
				const goodType = Shop.getType(target);
				if (!goodType || goodType === 'ball' || goodType === 'util') return PetUtils.popup(user, `这件道具不能卖出 !`);
				if (petUser.property['time']['sell'] % 48 === 4) {
					if (petUser.addRandomEgg('4v')) {
						PetUtils.popup(user, `您获得了一个蛋!`);
					} else {
						return PetUtils.popup(user, `您的盒子满了!`);
					}
				} else {
					const award = PetUtils.sample(Shop.sellConfig['rate']);
					if (toID(award) === 'egg') {
						if (petUser.addRandomEgg('2v')) {
							PetUtils.popup(user, `您获得了一个蛋!`);
						} else {
							return PetUtils.popup(user, `您的盒子满了!`);
						}
					} else {
						const num = prng.sample([...new Array(Shop.sellConfig['num'][award] || 1).keys()]) + 1;
						petUser.addItem(award, num);
						PetUtils.popup(user, `您获得了${num}个 ${award} !`);
					}
				}
				petUser.property['time']['sell']++;
				petUser.removeItem(target, 1);
				petUser.save();
				this.parse(`/pet box shownew`);
			},

			async buylottery(target, room, user) {
				if (!room) return PetUtils.popup(user, '请在房间里使用宠物系统');
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, '您还未领取最初的伙伴!');
				if (petUser.getLottery()) return PetUtils.popup(user, '您已购买本期彩票!');
				const startTimeStamp = new Date(Shop.lotteryConfig['start']).getTime();
				if (Date.now() < startTimeStamp) return PetUtils.popup(user, '本期彩票还未起售!');
				const endTimeStamp = new Date(Shop.lotteryConfig['end']).getTime();
				if (Date.now() > endTimeStamp) return PetUtils.popup(user, '本期彩票已截止发售!');
				const nums = target.split(',').map(x => parseInt(x));
				if (nums.length !== 6 || nums.some(x => !(x >= 0 && x <= 31))) return PetUtils.popup(user, '请输入6个0到31之间的整数!');
				const changeScores = await AdminUtils.addScore(user.name, -Shop.lotteryConfig['price'], '购买彩票');
				if (changeScores.length !== 2) return PetUtils.popup(user, `积分不足!`);
				PetUtils.popup(user, `购买成功!`);
				petUser.setLottery(nums.join(','));
				this.parse(`/pet shop show lottery`);
			},

			setlottery(target, room, user) {
				if (!Shop.lotteryConfig['host'].includes(user.id)) return PetUtils.popup(user, '您没有权限设置彩票!');
				const targets = target.split('|');
				if (targets.length !== 8) return PetUtils.popup(user, '格式错误!');
				Shop.editLottery({
					'start': targets[0],
					'end': targets[1],
					'awards': {
						'1v': targets[2],
						'2v': targets[3],
						'3v': targets[4],
						'4v': targets[5],
						'5v': targets[6],
						'6v': targets[7]
					}
				});
				PetUtils.popup(user, '设置成功!');
				this.parse(`/pet shop show lottery`);
			},

			closelottery(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				if (!Shop.lotteryConfig['host'].includes(user.id)) return PetUtils.popup(user, '您没有权限开奖!');
				const targets = target.split('|');
				if (targets.length !== 2 || !Dex.species.get(targets[0]).exists) return PetUtils.popup(user, '格式错误!');
				const nums = targets[1].split(',').map(x => parseInt(x));
				if (nums.length !== 6 || nums.some(x => !(x >= 0 && x <= 31))) return PetUtils.popup(user, '格式错误!');
				this.parse(`/pet shop show lottery`);
				Shop.closeLottery(targets[0], nums).forEach((line, i) => {
					room.addRaw(`<div class='broadcast-green'><b>${line}</b></div>`);
				});
			},

			clearlottery(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				if (!Shop.lotteryConfig['host'].includes(user.id)) return PetUtils.popup(user, '您没有权限清空彩票数据!');
				Shop.clearLottery();
				PetUtils.popup(user, '彩票数据已清空');
				this.parse(`/pet shop show lottery`);
			},

			clear(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				if (target === 'new') {
					user.sendTo(room.roomid, `|uhtmlchange|pet-shop-show|`);
				}
			},

		},

		admin: {

			edit(target, room, user) {
				this.checkCan('bypassall');
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				user.sendTo(room.roomid, `|uhtmlchange|pet-edit|`);
				if (target === 'x') return;
				const targets = target.split('=>');
				target = targets.slice(1).join('=>');
				const petUser = getUser(toID(targets[0] || user.id));
				if (!petUser.property) return PetUtils.popup(user, `${petUser.id}还未领取最初的伙伴!`);
				petUser.load();
				if (target) {
					switch (target.split('!').length) {
					case 2:
						return user.sendTo(
							room.roomid,
							`|uhtml|pet-edit|确认删除?&emsp;` +
							`${PetUtils.boolButtons(`/pet admin edit ${petUser.id}=>!!`, `/pet admin edit ${petUser.id}`)}`
						);
					case 3:
						petUser.destroy();
						dropUser(petUser.id);
						return PetUtils.popup(user, `用户数据已删除`);
					default:
						if (petUser.editProperty(target)) {
							petUser.save();
							const userChatRoom = Rooms.get(petUser.chatRoomId);
							if (userChatRoom) {
								Users.get(petUser.id)?.sendTo(userChatRoom, `|uhtmlchange|pet-box-show|${petBox(
									petUser,
									petUser.onPosition ? Object.values(petUser.onPosition).join(',') : ''
								)}`);
							}
							PetUtils.popup(user, `修改成功!`);
						} else {
							PetUtils.popup(user, `格式错误!`);
						}
					}
				}
				if (!Users.get(petUser.id)) dropUser(petUser.id);
				const len = {
					'bag': (petUser.property['bag'].length + 1).toString().length,
					'box': (petUser.property['box'].length + 1).toString().length
				}
				const form = (posType: 'bag' | 'box', index: number, pet: string) => [
					`<form data-submitsend="/msgroom ${room.roomid}, /edit ${petUser.id}=>${posType},${index}=>{text}">`,
					`<table style="width: 100%">`,
					`<td style="padding: 0; width: ${40 + len[posType] * 8}px">位置${PetUtils.zfill(index + 1, len[posType])}:</td>`,
					`<td style="padding: 0"><input name="text" style="width: 100%" value="${pet}"></td>`,
					`<td style="padding: 0; text-align: right; width: 60px"><button class="button" type="submit">更改</button></td>`,
					`</table></form>`
				].join('');
				let buf = `<b>${petUser.id} 的用户数据:</b>`;
				buf += `<div style="height: 300px; overflow: auto; border: ridge; padding-left: 5px">`;
				buf += `<b>背包:</b>`;
				petUser.property['bag'].forEach((pet, i) => buf += form('bag', i, pet));
				buf += `<br><b>盒子:</b>`;
				petUser.property['box'].forEach((pet, i) => buf += form('box', i, pet));
				buf += `<br><b>道具:</b> ${Shop.itemButtons(petUser, '')}<br>`;
				buf += `<form data-submitsend="/msgroom ${room.roomid}, /edit ${petUser.id}=>items=>{text}">` +
					`<textarea name="text" style="width: 90%; height: 100px; padding: 5px">` +
					JSON.stringify(petUser.property?.items) +
					`</textarea><br><button class="button" type="submit">更改</button></form>`;
				buf += `<br><b>徽章:</b> ${petUser.property['badges'].join(' ')}<br>`;
				buf += `<br><b>霸主:</b> ${petUser.property['boss'].join(' ')}`;
				buf += `</div><table style="width: 100%">`;
				buf += `<td>生成10级3V闪光梦特皮卡丘: <code>/genpoke Pikachu, L10, 3V, S, H</code><br></td>`;
				buf += `<td style="text-align: right">`;
				buf += PetUtils.button(`/pet admin restore ${petUser.id}`, '恢复') + ' ';
				buf += PetUtils.button(`/pet admin edit ${petUser.id}=>!`, '删除') + ' ';
				buf += PetUtils.button(`/pet admin edit x`, '返回') + ' ';
				buf += `</td></table>`;
				user.sendTo(room.roomid, `|uhtml|pet-edit|${buf}`);
			},

			restore(target, room, user) {
				this.checkCan('bypassall');
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const petUser = getUser(toID(target || user.id));
				if (!petUser.property) return PetUtils.popup(user, `${petUser.id}还未领取最初的伙伴!`);
				if (!petUser.restoreProperty()) return PetUtils.popup(user, `没有找到用户${target}的备份数据!`);
				petUser.save();
				PetUtils.popup(user, "用户数据恢复成功!");
				this.parse(`/pet admin edit ${target}`);
			},

			editgym(target, room, user) {
				this.checkCan('bypassall');
				const targets = target.split('=>');
				if (targets.length !== 2) return this.sendReply('/editgym 道馆名=>队伍');
				if (!PetBattle.gymConfig[targets[0]]) return PetUtils.popup(user, `没有名为 ${targets[0]} 的道馆!`)
				PetBattle.gymConfig[targets[0]]['botteam'] = targets[1];
				FS('config/pet-mode/gym-config.js').safeWriteSync(
					'exports.PetModeGymConfig = ' + JSON.stringify(PetBattle.gymConfig, null, '\t')
				);
				PetUtils.popup(user, '修改成功!');
			},

			genpoke(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				const targets = target.split('=>');
				if (targets[1]) this.checkCan('bypassall');
				const set = toID(targets[0]) === 'egg' ? Shop.randomEgg('4v') : Pet.genPokeByDesc(targets[0]);
				if (!set) return user.sendTo(room.roomid, `|uhtml|pet-tmp|<code>/genpoke Pikachu, L10, 3V, S, H</code>`);
				if (targets[1]) {
					const petUser = getUser(user.id);
					if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
					if (petUser.property['bag'][0]) return PetUtils.popup(user, "为便于赠送, 请先移走背包中的第一只宝可梦!");
					petUser.addPet(set);
					petUser.save();
					petUser.onPosition = {'type': 'bag', 'index': 0};
					this.parse(`/gift ${targets[1]} !`);
				} else {
					this.sendReply(set);
				}
			},

			gift(target, room, user) {
				this.checkCan('bypassall');
				const petUser = getUser(user.id);
				if (!petUser.property) return PetUtils.popup(user, "您还未领取最初的伙伴!");
				if (!target) { petUser.operation = 'gift'; return this.parse('/pet box showat'); }
				const targets = target.split('!');
				if (!checkUser(targets[0])) return PetUtils.popup(user, `未找到用户 ${targets[0]} !`);
				if (targets.length === 1) {
					petUser.operation = `gift${target}`;
				} else {
					const rcverId = toID(targets[0]);
					const gift = new PetUser(rcverId, GIFTPATH);
					if (!gift.property) gift.init();
					if (targets[1]) {
						const item = Dex.items.get(targets[1]);
						if (!item.exists) return PetUtils.popup(user, `不存在名为 ${targets[1]} 的道具!`);
						gift.addItem(item.name, 1);
						PetUtils.popup(
							Users.get(rcverId),
							`${user.name}赠送给您一个 ${item.name} !<br>${PetUtils.button('/msg ~, /pet box receive', '领取礼物')}`
						);
						this.sendReply(`已赠送给 ${rcverId}: ${item.name}`);
					} else {
						petUser.load();
						const pet = petUser.getPet();
						if (!pet) return PetUtils.popup(user, "请先选中想要赠送的宝可梦!");
						petUser.removePet();
						petUser.save();
						gift.addPet(pet);
						PetUtils.popup(
							Users.get(rcverId),
							`${user.name}赠送给您一只宝可梦!<br>${PetUtils.button('/msg ~, /pet box receive', '领取礼物')}`
						);
						this.sendReply(`已赠送给 ${rcverId}: ${pet}`);
					}
					gift.save();
					delete petUser.operation;
				}
				if (!targets[1]) this.parse(`/pet box showat`);
			},

			updateuserdata(target, room, user) {
				if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
				if (OS.platform() !== 'linux' || OS.hostname() !== 'PSChinaForums') return PetUtils.popup(user, '只能在测试服上导入存档!');
				user.sendTo(room.roomid, '|uhtmlchange|pet-tmp|');
				if (target === 'x') return;
				switch (target) {
				case 'x':
					return;
				case '!':
					if (!FS('../update-user-data').existsSync()) return PetUtils.popup(user, '脚本丢失!');
					CP.exec(`cd .. && ./update-user-data ${user.id}`, (err, out) => {
						if (err) PetUtils.popup(user, `未找到 ${user.id} 在国服的存档!`);
						else PetUtils.popup(user, `导入成功!`);
					});
					return;
				case '~':
					CP.exec(`cp ../User-Data-Backup/${user.id}.json ${USERPATH}/`, (err, out) => {
						if (err) PetUtils.popup(user, `未找到 ${user.id} 的备份存档!`);
						else PetUtils.popup(user, `恢复成功!`);
					});
					return;
				default:
					user.sendTo(
						room.roomid,
						`|uhtml|pet-tmp|` +
						PetUtils.button('/pet admin updateuserdata !', `从国服导入并覆盖 ${user.id} 的存档`) +
						PetUtils.button('/pet admin updateuserdata ~', `恢复 ${user.id} 在测试服的存档`) +
						PetUtils.button('/pet admin updateuserdata x', '取消')
					);
				}
			},

		},

		'': 'help',
		'guide': 'help',
		help(target, room, user) {
			if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
			user.sendTo(room.roomid, `|uhtmlchange|pet-welcome|`);
			let buttons = [];
			if (target !== 'lawn') {
				buttons.push(['<b>欢迎来到Pokemon Showdown China宠物系统!</b>']);
				if (!getUser(user.id).property) {
					buttons[0].push(PetUtils.button('/pet init', '领取最初的伙伴!'));
				}
				buttons.push([
					PetUtils.button('/pet box', '盒子'),
					PetUtils.button('/pet shop', '商店'),
					`<a href="/gym"><button class="button">道馆</button></a>`,
				]);
				if (PetBattle.legends[room.roomid]) {
					buttons[0].push(PetUtils.button('/pet lawn search !', `挑战房间里的 ${
						PetBattle.legends[room.roomid].split('|')[0]
					} !`));
				}
				if (FS( `${GIFTPATH}/${user.id}.json`).existsSync()) {
					buttons[0].push(PetUtils.button('/pet box receive', '领取礼物!'));
				}
			}
			const bestRoom = PetBattle.findRoom(getUser(user.id).levelRistriction());
			const roomConfig = PetBattle.roomConfig[room.roomid];
			if (roomConfig) {
				buttons.push([
					'<b>去邂逅野生的宝可梦吧!</b>',
					`<a href="/${PetBattle.previousRoom[room.roomid] || 'skypillar'}">上一个房间</a>`,
					`<a href="/${PetBattle.nextRoom[room.roomid] || 'skypillar'}">下一个房间</a>`,
					`<a href="/${bestRoom}">自动跳转</a>`,
				]);
				buttons.push(Object.keys(roomConfig['lawn']).map(
					lawnid => PetUtils.button(`/pet lawn search ${lawnid}`, lawnid)
				));
				if (roomConfig['boss']) {
					buttons.push(['<b>强大的霸主宝可梦出现了!</b>']);
					buttons.push(roomConfig['boss'].map(boss => PetUtils.button(`/pet lawn search ${boss}`, `挑战${boss}`)));
				}
			} else if (room.roomid === 'gym') {
				buttons.push(['<b>去道馆证明自己的实力吧!</b>']);
				buttons.push(Object.keys(PetBattle.gymConfig).map(
					gymid => PetUtils.button(`/pet lawn search ${gymid}`, `${gymid}道馆`)
				));
			} else {
				buttons.push(['<b>这个房间没有野生的宝可梦哦</b>', `<a href="/${bestRoom}">自动跳转</a>`]);
			}
			user.sendTo(room.roomid, `|uhtml|pet-welcome|${buttons.map(line => line.join(' ')).join('<br>')}`);
		}

	}

}