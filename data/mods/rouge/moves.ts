
import { Pokemonpool } from "../../../config/rouge/pokemonpool";
import { PRNG, Teams, Dex } from "../../../sim";
import { addrelics, addroom, getnextwave, save } from "./rulesets";
const natures = Dex.natures.all().map(x => x.name);
function rooms(num: number=0) {
	if (num == 1)
		return [
			
			{
				move: 'Common room',
				id: Dex.toID('Common room'),
				pp: 1,
				maxpp: 1,
				target: 'self',
				disabled: false,
				used: false,
				virtual: true,
			},
			

		

		];
	if (num == 2)
		return [{
			move: 'Champion room',
			id: Dex.toID('Champion room'),
			pp: 1,
			maxpp: 1,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		},];
	return [
		{
			move: 'Item room',
			id: Dex.toID('Item room'),
			pp: 1,
			maxpp: 1,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		},
		{
			move: 'Pokemon room',
			id: Dex.toID('Pokemon room'),
			pp: 1,
			maxpp: 1,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		},
		{
			move: 'Move room',
			id: Dex.toID('Move room'),
			pp: 1,
			maxpp: 1,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		},
		{
			move: 'Ability room',
			id: Dex.toID('Ability room'),
			pp: 1,
			maxpp: 1,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		},
		{
			move: 'Common room',
			id: Dex.toID('Common room'),
			pp: 1,
			maxpp: 1,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		},
		{
			move: 'Elite room',
			id: Dex.toID('Elite room'),
			pp: 1,
			maxpp: 1,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		},
		

	];
	
}
function chooseroom(pokemon: Pokemon, prng: PRNG) {
	pokemon.moveSlots = [{
		move: 'Choose Next room',
		id: Dex.toID('Choose Next room'),
		pp: 0,
		maxpp: 1,
		target: 'self',
		disabled: true,
		used: false,
		virtual: true,
	}]
	let nextwave = getnextwave(Dex.toID(pokemon.side.name))
	if (nextwave===1)
		pokemon.moveSlots = pokemon.moveSlots.concat(rooms(1))
	else if (nextwave === 13)
		pokemon.moveSlots.push({
			move: 'Champion room',
			id: Dex.toID('Champion room'),
			pp: 1,
			maxpp: 1,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		})
	else
		pokemon.moveSlots = pokemon.moveSlots.concat(sample(rooms(), 2, prng))
}
function restoreAbility(set: PokemonSet, s: string): PokemonSet {
	if (['0', '1', 'H', 'S'].includes(set.ability)) return set;
	set.ability = s.split('|')[3] || '0';
	if (['0', '1', 'H', 'S'].includes(set.ability)) return set;
	const species = Dex.species.get(set.species || set.name);
	// @ts-ignore
	set.ability = ['1', 'H', 'S'].find(i => Dex.toID(species.abilities[i]) === Dex.toID(set.ability)) || '0';
	return set;
}
export function sample<T>(items: T[], number: number, prng: PRNG = new PRNG(),otheritems:T[]=[]) {

	if (items.length === 0) {
		return [];
	}
	const len = items.length;
	items = items.concat(otheritems);
	const len2 = items.length;
	if (number > len2) number = len2;
	const indexs = new Set<number>();
	while (indexs.size < number) {
		if (otheritems && prng.next(2) === 0) {
			const index = prng.next(len);
			indexs.add(index)
		} else {
			const index = prng.next(len2);
			indexs.add(index)
		}
	}
	const newitems = [];
	for (let i of indexs) {
		newitems.push(items[i])
	}
	return newitems;
}
export function unpack(pokeset: any | any[], prng: PRNG = new PRNG(), level?: number) {
	let buf = '';
	
	if (!Array.isArray(pokeset))
		pokeset = [pokeset];
	
	for (const set of pokeset) {
		if (buf) buf += ']';
		// name
		buf += (set.name || set.species);

		// species
		const id = Dex.toID(set.species || set.name);
		buf += '|' + (Dex.toID(set.name || set.species) === id ? '' : id);

		// item
		buf += '|' + (Array.isArray(set.item) ? prng.sample(set.item) : set.item);

		// ability
		buf += '|' + (Array.isArray(set.ability) ? prng.sample(set.ability) : set.ability);

		// moves
		buf += '|' + sample(set.moves, 4, prng).join(',');

		// nature
		if (set.nature)
			buf += '|' + set.nature;
		else
			buf += '|' + prng.sample(natures);

		// evs
		if (set.evs === ',,,,,') {
			buf += '|';
		} else {
			buf += '|' + set.evs;
		}

		// gender
		if (set.gender) {
			buf += '|' + set.gender;
		} else {
			buf += '|';
		}

		// ivs

		if (set.ivs === ',,,,,') {
			buf += '|';
		} else {
			buf += '|' + set.ivs;
		}

		// shiny
		if (set.shiny) {
			buf += '|S';
		} else {
			buf += '|';
		}

		// level
		if (level)
			buf += '|' + level;
		else
			if (set.level && set.level !== 100) {
				buf += '|' + set.level;
			} else {
				buf += '|';
			}

		// happiness
		if (set.happiness !== undefined && set.happiness !== 255) {
			buf += '|' + set.happiness;
		} else {
			buf += '|';
		}

		if (set.pokeball || set.hpType || set.gigantamax) {
			buf += ',' + (set.hpType || '');
			buf += ',' + (set.pokeball || '');
			buf += ',' + (set.gigantamax ? 'G' : '');
		}
		
	}
	return buf;
}
export function range(start: number, end: number) {
	return new Array(end - start).fill(start).map((el, i) => start + i);
}
function selectpokemon(pokemon: Pokemon, type: string, pro: string = 'Select Pokemon ', pp: number=1, name: string = '') {//type 前面要有空格，pro后面要有空格
	pokemon.moveSlots = [];
	let a = range(1, pokemon.side.team.length + 1);

	for (let i of a) {
		pokemon.moveSlots.push({
			move: pro+ i + type,
			id: Dex.toID(pro + i + type),
			pp: pp,
			maxpp: pp,
			target: 'self',
			disabled: false,
			used: false,
			virtual: true,
		});
	}
};
export const Moves: { [k: string]: ModdedMoveData } = {
	wsscurse: {
		num: 174,
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Wss Curse",
		pp: 10,
		priority: 0,
		flags: { authentic: 1 },
		volatileStatus: 'curse',
		onTryHit(target, source, move) {
			if (move.volatileStatus && target.volatiles['curse']) {
				return false;
			}
		},
		condition: {
			onStart(pokemon, source) {
				this.add('-start', pokemon, 'Curse', '[of] ' + source);
			},
			onResidualOrder: 12,
			onResidual(pokemon) {
				this.directDamage(pokemon.baseMaxhp / 4);
			},
		},
		secondary: null,
		target: "randomNormal",
		type: "Ghost",
		zMove: { effect: 'curse' },
		contestType: "Tough",
	},
	starmieboost: {
		num: 702,
		accuracy: true,
		basePower: 0,
		category: "Status",
		isNonstandard: "Past",
		name: "Starmie Boost",
		pp: 1,
		priority: 0,
		flags: {},
		isZ: false,
		boosts: {
			atk: 1,
			def: 1,
			spa: 1,
			spd: 1,
			spe: 1,
		},
		secondary: null,
		target: "self",
		type: "Normal",
		contestType: "Beautiful",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'extremeevoboost', target);
		},
	},
	hiddenpowerlegend: {
		num: 796,
		accuracy: 100,
		basePower: 60,
		category: "Special",
		name: "Hidden Power Legend",
		pp: 15,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		onEffectiveness(typeMod, target, type) {
			return 1;
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hidden Power', target);
		},
		ignoreImmunity: true,
		secondary: null,
		target: "normal",
		type: "Normal",
	},
	supersteelbeam: {
		num: 796,
		accuracy: 95,
		basePower: 200,
		category: "Special",
		name: "Super Steel Beam",
		pp: 5,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		mindBlownRecoil: true,
		onAfterMove(pokemon, target, move) {
			if (move.mindBlownRecoil && !move.multihit) {
				this.damage(Math.round(pokemon.maxhp / 2), pokemon, pokemon, this.dex.conditions.get('Steel Beam'), true);
			}
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Steel Beam', target);
		},
		secondary: null,
		target: "normal",
		type: "Steel",
	},
	sheercolder: {
		num: 329,
		accuracy: 50,
		basePowerCallback(pokemon, target, move) {
			if (!pokemon.hasType('ice'))
				move.accuracy = 40;
			return null
		},
		basePower: 0,
		category: "Special",
		name: "Sheer Colder",
		pp: 5,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		secondary: null,
		ohko: 'Ice',
		target: "normal",
		type: "Ice",
		zMove: { basePower: 180 },
		maxMove: { basePower: 130 },
		contestType: "Beautiful",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Sheer Cold', target);
		},
	},
	doubleimpression: {
		num: 660,
		accuracy: 100,
		basePower: 60,
		category: "Physical",
		name: "Double Impression",
		pp: 10,
		priority: 2,
		flags: { contact: 1, protect: 1, mirror: 1 },
		onTry(source) {
			if (source.activeMoveActions > 1) {
				this.hint("Double Impression only works on your first turn out.");
				return false;
			}
		},
		secondary: null,
		target: "normal",
		type: "Bug",
		contestType: "Cute",
		multihit: 2,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'First Impression', target);
		},
	},
	superlightofruin: {
		num: 617,
		accuracy: 90,
		basePower: 190,
		category: "Special",
		isNonstandard: "Past",
		name: "Super Light of Ruin",
		pp: 5,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		recoil: [1, 2],
		secondary: null,
		target: "normal",
		type: "Fairy",
		contestType: "Beautiful",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Light of Ruin', target);
		},
	},
	swamppower: {
		num: 414,
		accuracy: 100,
		basePower: 110,
		category: "Special",
		name: "Swamp Power",
		pp: 10,
		priority: 0,
		flags: { protect: 1, mirror: 1, nonsky: 1 },
		self: {
			boosts: {
				spe: -1,
			},
		},
		target: "normal",
		type: "Ground",
		contestType: "Beautiful",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Earth Power', target);
		},
	},
	stimpack: {
		num: 349,
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Stim Pack",
		pp: 20,
		priority: 0,
		flags: { snatch: 1, dance: 1 },
		boosts: {
			atk: 1,
			spa: 1,
			spe: 1,
		},
		onHit(pokemon) {
			this.damage(pokemon.maxhp * 0.15, pokemon, pokemon, "recoil");
		},
		secondary: null,
		target: "self",
		type: "Normal",
		zMove: { effect: 'clearnegativeboost' },
		contestType: "Cool",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'No Retreat', target);
		},
	},
	steelterrain: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		
		name: "Steel Terrain",
		gen: 8,
		pp: 10,
		priority: 0,
		flags: {},
		terrain: 'steelterrain',
		condition: {
			duration: 5,
			
			durationCallback(target,source, effect) {
				if (source?.hasItem('terrainextender')) {
					return 8;
				}
				if (effect?.effectType === 'Rule') {
					return 0;
				}
				
				return 5;
			},
			onBasePowerPriority: 6,
			onBasePower(basePower, attacker, defender, move) {
				if (move.type === 'Steel' && attacker.isGrounded() && !attacker.isSemiInvulnerable()) {
					this.debug('Steel terrain boost');
					return this.chainModify([5325, 4096]);
				}
			},
			onFieldStart(field, source, effect) {
				if (effect && effect.effectType === 'Ability') {
					this.add('-fieldstart', 'move: Steel Terrain', '[from] ability: ' + effect, '[of] ' + source);
				} else {
					this.add('-fieldstart', 'move: Steel Terrain');
				}
				this.add('-message', 'The battlefield was covered in Steel!');
			},
			onDamagePriority: -100,
			onDamage(damage, source, target, move) {
				if (target.side === this.p2 && target.isGrounded())
					if (source.getMoveHitData(move as ActiveMove).typeMod > 0) {
						this.debug('Filter neutralize');
						return this.chainModify(0.85);
					}
			},
			
			onFieldResidualOrder: 21,
			onFieldResidualSubOrder: 3,
			onFieldEnd() {
				this.add('-fieldend', 'move: Steel Terrain');
				this.add('-message', 'The battlefield is no longer covered in Steel.');
			},
		},
		secondary: null,
		target: "all",
		type: "Steel",
	},
	supersilverwind: {
		num: 318,
		accuracy: 100,
		basePower: 80,
		category: "Special",
		isNonstandard: "Past",
		name: "Super Silver Wind",
		pp: 5,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		secondary: {
			chance: 30,
			self: {
				boosts: {
					atk: 1,
					def: 1,
					spa: 1,
					spd: 1,
					spe: 1,
				},
			},
		},
		target: "normal",
		type: "Bug",
		contestType: "Beautiful",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Silver Wind', target);
		},
	},
	superparaboliccharge: {
		num: 570,
		accuracy: 100,
		basePower: 85,
		category: "Special",
		name: "Super Parabolic Charge",
		pp: 20,
		priority: 0,
		flags: { protect: 1, mirror: 1, heal: 1 },
		drain: [1, 2],
		secondary: null,
		target: "allAdjacent",
		type: "Electric",
		contestType: "Clever",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Parabolic Charge', target);
		},
	},
	superspiritbreak: {
		num: 789,
		accuracy: 100,
		basePower: 90,
		category: "Physical",
		name: "Super Spirit Break",
		pp: 15,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1 },
		secondary: {
			chance: 100,
			boosts: {
				spa: -1,
			},
		},
		target: "normal",
		type: "Fairy",
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Spirit Break', target);
		},
	},
	dualace: {
		num: 814,
		accuracy: 100,
		basePower: 55,
		category: "Physical",
		name: "Dual Ace",
		pp: 10,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1 },
		multihit: 2,
		secondary: null,
		target: "normal",
		type: "Flying",
		maxMove: { basePower: 130 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Aerial Ace', target);
		},
	},
	//--------shop's  moves
	getsuperband: {
		num: 1000,
		name: 'Get Super Band',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			//let a = this.prng.sample(pokemon.side.team.filter(x => x.name != pokemon.name));
			//a.item = 'Super Band';
			//this.add('html', `<div class="broadcast-green"><strong>your ${a.name} has got the Super Band</strong></div>`);
			//this.p1.active[0].faint();
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Band,it is Choice Band of 2x Atk',
	},
	getsuperspecs: {
		num: 1001,
		name: 'Get Super Specs',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Specs,it is Choice Specs of 2x Spa',
		shortDesc: 'random pokemon of your team get Super Specs,it is Choice Specs of 2x Spa',
	},
	getsuperscarf: {
		num: 1002,
		name: 'Get Super Scarf',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Scarf,it is Choice Scarf of 2x Spe',
		shortDesc: 'random pokemon of your team get Super Scarf,it is Choice Scarf of 2x Spe',
	},
	getsupervest: {
		num: 1000,
		name: 'Get Super Vest',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Vest,it is Assault Vest of 2x Spd',
		shortDesc: 'random pokemon of your team get Super Vest,it is Assault Vest of 2x Spd',
	},
	getdiseviolite: {
		num: 1000,
		name: 'Get Diseviolite',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Diseviolite,it is an Eviolite whether it has evos or not ',
		shortDesc: 'random pokemon of your team get Diseviolite,it is an Eviolite whether it has evos or not',
	},
	getsuperquickclaw: {
		num: 1002,
		name: 'Get Super Quick Claw',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Quick Claw,it is Quick Claw of 40% chance',
		shortDesc: 'random pokemon of your team get Super Quick Claw,it is Quick Claw of 40% chance',
	},
	getsupermetronome: {
		num: 1002,
		name: 'Get Super Metronome',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Scarf,it is Choice Scarf of 2x Spe',
		shortDesc: 'random pokemon of your team get Super Scarf,it is Choice Scarf of 2x Spe',
	},
	getsuperlifeorb: {
		num: 1002,
		name: 'Get Super Life Orb',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Life Orb,it is Choice Scarf of 2x Spe',
		shortDesc: 'random pokemon of your team get Super Life Orb,it is Choice Scarf of 2x Spe',
	},
	getintactapple: {
		num: 1002,
		name: 'Get Intact Apple',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Scarf,it is Choice Scarf of 2x Spe',
		shortDesc: 'random pokemon of your team get Super Scarf,it is Choice Scarf of 2x Spe',
	},
	getimmunityherb: {
		num: 1002,
		name: 'Get Immunity Herb',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Immunity Herb,it makes pokemon immune first damage',
		shortDesc: 'random pokemon of your team get Immunity Herb,it makes pokemon immune first damage',
	},
	getbrighterpowder: {
		num: 1002,
		name: 'Get Brighter Powder',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Super Scarf,it is Choice Scarf of 2x Spe',
		shortDesc: 'random pokemon of your team get Super Scarf,it is Choice Scarf of 2x Spe',
	},
	getberserkgene: {
		num: 1002,
		name: 'Get Berserk Gene',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getsupermuscleband: {
		num: 1002,
		name: 'Get Super Muscle Band',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getsuperwiseglasses: {
		num: 1002,
		name: 'Get Super Wise Glasses',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getadaptiveslate: {
		num: 1002,
		name: 'Get Adaptive Slate',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getexplosivearm: {
		num: 1002,
		name: 'Get Explosive Arm',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getdoubleedgedsword: {
		num: 1002,
		name: 'Get Double-edged Sword',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getflexibledevice: {
		num: 1002,
		name: 'Get Flexible Device',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getpainconnector: {
		num: 1002,
		name: 'Get Pain Connector',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getsightlens: {
		num: 1002,
		name: 'Get Sight Lens',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getdeepseadew: {
		num: 1002,
		name: 'Get Deep Sea Dew',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getseismiclever: {
		num: 1002,
		name: 'Get Seismic Lever',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Berserk Gene',
		shortDesc: 'random pokemon of your team get Berserk Gene',
	},
	getazureflute: {
		num: 1002,
		name: 'Get Azure Flute',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Azure Flute',
		shortDesc: 'random pokemon of your team get Azure Flute',
	},
	getgladiatorhelmet: {
		num: 1002,
		name: 'Get Gladiator Helmet',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Azure Flute',
		shortDesc: 'random pokemon of your team get Azure Flute',
	},
	getsuperbrightpowder: {
		num: 1002,
		name: 'Get Super Bright Powder',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Get Item');

		},
		desc: 'random pokemon of your team get Azure Flute',
		shortDesc: 'random pokemon of your team get Azure Flute',
	},
	//----------movemoves

	learnextremespeed: {
		num: 1000,
		name: 'Learn Extreme Speed',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');

			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnsheercolder: {
		num: 1000,
		name: 'Learn Sheer Colder',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},

	learnsupersteelbeam: {
		num: 1000,
		name: 'Learn Super Steel Beam',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnshellsmash: {
		num: 1000,
		name: 'Learn Shell Smash',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learndoubleironbash: {
		num: 1000,
		name: 'Learn Double Iron Bash',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnnoretreat: {
		num: 1000,
		name: 'Learn No Retreat',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnsurgingstrikes: {
		num: 1000,
		name: 'Learn Surging Strikes',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnphotongeyser: {
		num: 1000,
		name: 'Learn Photon Geyser',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnboomburst: {
		num: 1000,
		name: 'Learn Boomburst',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnaeroblast: {
		num: 1000,
		name: 'Learn Aeroblast',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learndoubleimpression: {
		num: 1000,
		name: 'Learn Double Impression',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnknockoff: {
		num: 1000,
		name: 'Learn Knock Off',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learndragonhammer: {
		num: 1000,
		name: 'Learn Dragon Hammer',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learncoreenforcer: {
		num: 1000,
		name: 'Learn Core Enforcer',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnboltbeak: {
		num: 1000,
		name: 'Learn Bolt Beak',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnsuperlightofruin: {
		num: 1000,
		name: 'Learn Super Light of Ruin',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnsecretsword: {
		num: 1000,
		name: 'Learn Secret Sword',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnvcreate: {
		num: 1000,
		name: 'Learn V-create',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnpoltergeist: {
		num: 1000,
		name: 'Learn Poltergeist',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnappleacid: {
		num: 1000,
		name: 'Learn Apple Acid',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnswamppower: {
		num: 1000,
		name: 'Learn Swamp Power',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learntripleaxel: {
		num: 1000,
		name: 'Learn Triple Axel',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnshellsidearm: {
		num: 1000,
		name: 'Learn Shell Side Arm',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnmeteorbeam: {
		num: 1000,
		name: 'Learn Meteor Beam',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnmoongeistbeam: {
		num: 1000,
		name: 'Learn Moongeist Beam',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learndragondance: {
		num: 1000,
		name: 'Learn Dragon Dance',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnslackoff: {
		num: 1000,
		name: 'Learn Slack Off',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnhypnosis: {
		num: 1000,
		name: 'Learn Hypnosis',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnquiverdance: {
		num: 1000,
		name: 'Learn Quiver Dance',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnstimpack: {
		num: 1000,
		name: 'Learn Stim Pack',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnsupersilverwind: {
		num: 1000,
		name: 'Learn Super Silver Wind',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnbaddybad: {
		num: 1000,
		name: 'Learn Baddy Bad',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learndragonenergy: {
		num: 1000,
		name: 'Learn Dragon Energy',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnsuperparaboliccharge: {
		num: 1000,
		name: 'Learn Super Parabolic Charge',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnsuperspiritbreak: {
		num: 1000,
		name: 'Learn Super Spirit Break',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnsacredsword: {
		num: 1000,
		name: 'Learn Sacred Sword',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnblueflare: {
		num: 1000,
		name: 'Learn Blue Flare',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learndualace: {
		num: 1000,
		name: 'Learn Dual Ace',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learngravapple: {
		num: 1000,
		name: 'Learn Grav Apple',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnprecipiceblades: {
		num: 1000,
		name: 'Learn Precipice Blades',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnfreezedry: {
		num: 1000,
		name: 'Learn Freeze-Dry',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learngunkshot: {
		num: 1000,
		name: 'Learn Gunk Shot',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learndiamondstorm: {
		num: 1000,
		name: 'Learn Diamond Storm',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	learnoriginpulse: {
		num: 1000,
		name: 'Learn Origin Pulse',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {
			selectpokemon(pokemon, ' Learn Move');
			pokemon.moveSlots.push({
				move: move.name,
				id: this.toID('move.name'),
				pp: 0,
				maxpp: 1,
				target: 'self',
				disabled: true,
				used: false,
				virtual: true,
			})

		},

	},
	//------------- commonmoves--------------
	evoapokemon: {
		num: 1000,
		name: 'Evo A Pokemon',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			let x: PokemonSet[] | PokemonSet = pokemon.side.team.filter(x => Dex.species.get(x.species).evos.length);
			if (x.length > 0) {
				x = this.prng.sample(x);
				let lastname = x.name;
				let evo = Dex.species.get(x.species).evos;
				if (evo.length !== 0) {
					x.species = this.prng.sample(evo);
					x.name = x.species;
					x = restoreAbility(x, Teams.pack([x]));
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${lastname} has evolved to ${x.name}</strong></div>`);
			} else
				this.add('html', `<div class="broadcast-green"><strong>none of your pokemons has evos</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: 'evo your a pokemon which can evo',
	},
	evoall: {
		num: 1000,
		name: 'Evo All',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			for (let x of pokemon.side.team.filter(x => Dex.species.get(x.species).evos)) {
				let evo = Dex.species.get(x.species).evos;
				if (evo.length !== 0) {
					x.species = this.prng.sample(evo);
					x.name = x.species;
					x = restoreAbility(x, Teams.pack([x]))
				}
			}
			this.add('html', `<div class="broadcast-green"><strong>your pokemons have been evolved</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: 'evo your every pokemon which can evo',
	},
	allevsadd24: {
		num: 1000,
		name: 'All Evs Add 24',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			for (let x of pokemon.side.team.filter(x => x.name != pokemon.name)) {
				x.evs.atk = Math.min(x.evs.atk + 24, 252);
				x.evs.def = Math.min(x.evs.def + 24, 252);
				x.evs.hp = Math.min(x.evs.hp + 24, 252);
				x.evs.spa = Math.min(x.evs.spa + 24, 252);
				x.evs.spd = Math.min(x.evs.spd + 24, 252);
				x.evs.spe = Math.min(x.evs.spe + 24, 252);
			}
			this.add('html', `<div class="broadcast-green"><strong>your pokemons' evs has been increased 24</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: 'evo your every pokemon which can evo',
	},
	allhpevsadd160: {
		num: 1000,
		name: 'All Hp Evs Add 160',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			for (let x of pokemon.side.team.filter(x => x.name != pokemon.name)) {
				x.evs.hp = Math.min(x.evs.hp + 160, 252);
			}
			this.add('html', `<div class="broadcast-green"><strong>your pokemons' Hp evs has been increased 160</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		shortDesc: 'evo your every pokemon which can evo',
	},
	allatkevsadd160: {
		num: 1000,
		name: 'All Atk Evs Add 160',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			for (let x of pokemon.side.team.filter(x => x.name != pokemon.name)) {
				x.evs.hp = Math.min(x.evs.atk + 160, 252);
			}
			this.add('html', `<div class="broadcast-green"><strong>your pokemons' Atk evs has been increased 160</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		shortDesc: 'evo your every pokemon which can evo',
	},
	alldefevsadd160: {
		num: 1000,
		name: 'All Def Evs Add 160',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			for (let x of pokemon.side.team.filter(x => x.name != pokemon.name)) {
				x.evs.hp = Math.min(x.evs.def + 160, 252);
			}
			this.add('html', `<div class="broadcast-green"><strong>your pokemons' Def evs has been increased 160</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		shortDesc: 'evo your every pokemon which can evo',
	},
	allspaevsadd160: {
		num: 1000,
		name: 'All Spa Evs Add 160',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			for (let x of pokemon.side.team.filter(x => x.name != pokemon.name)) {
				x.evs.hp = Math.min(x.evs.spa + 160, 252);
			}
			this.add('html', `<div class="broadcast-green"><strong>your pokemons' Spa evs has been increased 160</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		shortDesc: 'evo your every pokemon which can evo',
	},
	allspdevsadd160: {
		num: 1000,
		name: 'All Spd Evs Add 160',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			for (let x of pokemon.side.team.filter(x => x.name != pokemon.name)) {
				x.evs.hp = Math.min(x.evs.spd + 160, 252);
			}
			this.add('html', `<div class="broadcast-green"><strong>your pokemons' Spd evs has been increased 160</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		shortDesc: 'evo your every pokemon which can evo',
	},
	allspeevsadd160: {
		num: 1000,
		name: 'All Spe Evs Add 160',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			for (let x of pokemon.side.team.filter(x => x.name != pokemon.name)) {
				x.evs.hp = Math.min(x.evs.spe + 160, 252);
			}
			this.add('html', `<div class="broadcast-green"><strong>your pokemons' Spe evs has been increased 160</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		shortDesc: 'evo your every pokemon which can evo',
	},
	randonemonallevsadd72: {
		num: 1000,
		name: 'Rand One Mon All Evs Add 72',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			let a = this.prng.sample(pokemon.side.team.filter(x => x.name != pokemon.name));
			a.evs.atk = Math.min(a.evs.atk + 72, 252);
			a.evs.def = Math.min(a.evs.def + 72, 252);
			a.evs.hp = Math.min(a.evs.hp + 72, 252);
			a.evs.spa = Math.min(a.evs.spa + 72, 252);
			a.evs.spd = Math.min(a.evs.spd + 72, 252);
			a.evs.spe = Math.min(a.evs.spe + 72, 252);
			this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s evs has been increased 72</strong></div>`);
			chooseroom(pokemon, this.prng);
		},

	},
	randonemontwoevsfill: {
		num: 1000,
		name: 'Rand One Mon Two Evs Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			let a = this.prng.sample(pokemon.side.team.filter(x => x.name != pokemon.name));
			let randevs: (keyof typeof a.evs)[] = sample(['atk', 'def', 'hp', 'spa', 'spd', 'spe'], 2, this.prng);
			a.evs[randevs[0]] = 252;
			a.evs[randevs[1]] = 252;

			this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s ${randevs[0]} and ${randevs[1]} has been full</strong></div>`);
			chooseroom(pokemon, this.prng);
		},

	},
	chooseonemonallevsadd48: {
		num: 1000,
		name: 'Choose One Mon All Evs Add 48',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' All Evs Add 48', 'Pokemon ');

		},

	},
	chooseonemonthreeevshalf: {
		num: 1000,
		name: 'Choose One Mon Three Evs Half',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Three Evs Half', 'Pokemon ');

		},

	},
	chooseonemonatkspefill: {
		num: 1000,
		name: 'Choose One Mon Atk Spe fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Atk Spe fill', 'Pokemon ');

		},

	},
	chooseonemonspaspefill: {
		num: 1000,
		name: 'Choose One Mon Spa Spe fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Spa Spe fill', 'Pokemon ');

		},

	},
	chooseonemonhpanotherfill: {
		num: 1000,
		name: 'Choose One Mon Hp Another fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Hp Another fill', 'Pokemon ');

		},

	},
	retransmissionmovespool: {
		num: 1000,
		name: 'Retransmission Moves Pool',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, '', 'Retransmission Moves Pool of pokemon ', 3);

			pokemon.moveSlots.push({
				move: 'Skip',
				id: this.toID('skip'),
				pp: 1,
				maxpp: 1,
				target: 'self',
				disabled: false,
				used: false,
				virtual: true,
			});

		},

	},
	retransmissionpokemonset: {
		num: 1000,
		name: 'Retransmission PokemonSet',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, '', 'Retransmission Set of pokemon ', 3);

			pokemon.moveSlots.push({
				move: 'Skip',
				id: this.toID('skip'),
				pp: 1,
				maxpp: 1,
				target: 'self',
				disabled: false,
				used: false,
				virtual: true,
			});

		},

	},
	deletepokemon: {
		num: 1000,
		name: 'Delete Pokemon',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, '', 'Delete Pokemon ');

		},

	},
	//--------------pokemonmoves----------
	getmunchlax: {
		num: 1000,
		name: 'Get Munchlax',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Munchlax, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Munchlax has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	gettauros: {
		num: 1000,
		name: 'Get Tauros',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Tauros, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Tauros has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getferroseed: {
		num: 1000,
		name: 'Get Ferroseed',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Ferroseed, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Ferroseed has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getthundurus: {
		num: 1000,
		name: 'Get Thundurus',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Thundurus, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Thundurus has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getmawile: {
		num: 1000,
		name: 'Get Mawile',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Mawile, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Mawile has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getgrowlithe: {
		num: 1000,
		name: 'Get Growlithe',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Growlithe, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Growlithe has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getslowbro: {
		num: 1000,
		name: 'Get Slowbro',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Slowbro, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Slowbro has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getlapras: {
		num: 1000,
		name: 'Get Lapras',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Lapras, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Lapras has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getdreepy: {
		num: 1000,
		name: 'Get Dreepy',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Dreepy, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Dreepy has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getangod: {
		num: 1000,
		name: 'Get Angod',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Angod, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Angod has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getbeldum: {
		num: 1000,
		name: 'Get Beldum',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Beldum, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Beldum has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getonix: {
		num: 1000,
		name: 'Get Onix',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Onix, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Onix has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getslakoth: {
		num: 1000,
		name: 'Get Slakoth',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Slakoth, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Slakoth has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getsolosis: {
		num: 1000,
		name: 'Get Solosis',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Solosis, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Solosis has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	gettapubulu: {
		num: 1000,
		name: 'Get Tapu Bulu',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool["Tapu Bulu"], this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Tapu Bulu has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getindeedee: {
		num: 1000,
		name: 'Get Indeedee',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Indeedee, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Indeedee has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getpincurchin: {
		num: 1000,
		name: 'Get Pincurchin',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Pincurchin, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Pincurchin has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	gettapufini: {
		num: 1000,
		name: 'Get Tapu Fini',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool["Tapu Fini"], this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Tapu Fini has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getyanmega: {
		num: 1000,
		name: 'Get Yanmega',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Yanmega, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Yanmega has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getpinsir: {
		num: 1000,
		name: 'Get Pinsir',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Pinsir, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Pinsir has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getsneasel: {
		num: 1000,
		name: 'Get Sneasel',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Sneasel, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Sneasel has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	gethoundour: {
		num: 1000,
		name: 'Get Houndour',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Houndour, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Houndour has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getseadra: {
		num: 1000,
		name: 'Get Seadra',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Seadra, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Seadra has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getshinx: {
		num: 1000,
		name: 'Get Shinx',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Shinx, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Shinx has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getriolu: {
		num: 1000,
		name: 'Get Riolu',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Riolu, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Riolu has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getvirizion: {
		num: 1000,
		name: 'Get Virizion',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Virizion, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Virizion has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getfletchinder: {
		num: 1000,
		name: 'Get Fletchinder',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Fletchinder, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Fletchinder has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getroselia: {
		num: 1000,
		name: 'Get Roselia',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Roselia, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Roselia has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getnidoking: {
		num: 1000,
		name: 'Get Nidoking',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Nidoking, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Nidoking has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getnidoqueen: {
		num: 1000,
		name: 'Get Nidoqueen',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Nidoqueen, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Nidoqueen has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getlarvitar: {
		num: 1000,
		name: 'Get Larvitar',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Larvitar, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Larvitar has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getdiancie: {
		num: 1000,
		name: 'Get Diancie',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Diancie, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Diancie has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getgolisopod: {
		num: 1000,
		name: 'Get Golisopod',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Golisopod, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Golisopod has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getgastly: {
		num: 1000,
		name: 'Get Gastly',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Gastly, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Gastly has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getdhelmise: {
		num: 1000,
		name: 'Get Dhelmise',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Dhelmise, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Dhelmise has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getslowpoke: {
		num: 1000,
		name: 'Get Slowpoke',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Slowpoke, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Slowpoke has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getlarvesta: {
		num: 1000,
		name: 'Get Larvesta',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Larvesta, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Larvesta has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getskarmory: {
		num: 1000,
		name: 'Get Skarmory',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Skarmory, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Skarmory has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	gettorkoal: {
		num: 1000,
		name: 'Get Torkoal',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Torkoal, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Torkoal has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getspearow: {
		num: 1000,
		name: 'Get Spearow',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Spearow, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Spearow has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getabsol: {
		num: 1000,
		name: 'Get Absol',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Absol, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Absol has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getclefairy: {
		num: 1000,
		name: 'Get Clefairy',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Clefairy, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Clefairy has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	gettyrunt: {
		num: 1000,
		name: 'Get Tyrunt',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Tyrunt, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Tyrunt has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getdrilbur: {
		num: 1000,
		name: 'Get Drilbur',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Drilbur, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Drilbur has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getshellder: {
		num: 1000,
		name: 'Get Shellder',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Shellder, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Shellder has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getheracross: {
		num: 1000,
		name: 'Get Heracross',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Heracross, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Heracross has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getshucklemega: {
		num: 1000,
		name: 'Get Shuckle-Mega',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool["Shuckle-Mega"], this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Shuckle-Mega has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	gettapukoko: {
		num: 1000,
		name: 'Get Tapu Koko',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool["Tapu Koko"], this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Shuckle-Mega has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	gettapulele: {
		num: 1000,
		name: 'Get Tapu Lele',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool["Tapu Lele"], this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Shuckle-Mega has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getswinub: {
		num: 1000,
		name: 'Get Swinub',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool.Swinub, this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Heracross has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	getdugtrioalola: {
		num: 1000,
		name: 'Get Dugtrio-Alola',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length < 6) {
				pokemon.side.team = pokemon.side.team.concat(Teams.unpack(unpack(Pokemonpool["Dugtrio-Alola"], this.prng, pokemon.side.team[0].level))!);
				this.add('html', `<div class="broadcast-green"><strong>Heracross has joined in your team</strong></div>`);
				chooseroom(pokemon, this.prng);
			} else {
				this.add('html', `<div class="broadcast-green"><strong>your team is full</strong></div>`);
			}

		},

	},
	//-------------abilitymoves------------

	becomebomber: {
		num: 1002,
		name: 'Become Bomber',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');

		},
		desc: '',
		shortDesc: '',
	},
	becomesolarpower: {
		num: 1002,
		name: 'Become Solar Power',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomebeastboost: {
		num: 1002,
		name: 'Become Beast Boost',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomefurcoat: {
		num: 1002,
		name: 'Become Fur Coat',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomegorillatactics: {
		num: 1002,
		name: 'Become Gorilla Tactics',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomedownload: {
		num: 1002,
		name: 'Become Download',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomefluffy: {
		num: 1002,
		name: 'Become Fluffy',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomehustle: {
		num: 1002,
		name: 'Become Hustle',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeicescales: {
		num: 1002,
		name: 'Become Ice Scales',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeintimidate: {
		num: 1002,
		name: 'Become Intimidate',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomemoldbreaker: {
		num: 1002,
		name: 'Become Mold Breaker',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeprankster: {
		num: 1002,
		name: 'Become Prankster',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeprotean: {
		num: 1002,
		name: 'Become Protean',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomequickdraw: {
		num: 1002,
		name: 'Become Quick Draw',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeregenerator: {
		num: 1002,
		name: 'Become Regenerator',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomesheerforce: {
		num: 1002,
		name: 'Become Sheer Force',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomespeedboost: {
		num: 1002,
		name: 'Become Speed Boost',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becometintedlens: {
		num: 1002,
		name: 'Become Tinted Lens',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeunburden: {
		num: 1002,
		name: 'Become Unburden',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeguts: {
		num: 1002,
		name: 'Become Guts',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomehide: {
		num: 1002,
		name: 'Become Hide',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomediffuser: {
		num: 1002,
		name: 'Become Diffuser',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeconcentrator: {
		num: 1002,
		name: 'Become Concentrator',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomehardshell: {
		num: 1002,
		name: 'Become Hard Shell',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomegiantkiller: {
		num: 1002,
		name: 'Become Giant Killer',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomeirreducible: {
		num: 1002,
		name: 'Become Irreducible',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	becomehyperactivity: {
		num: 1002,
		name: 'Become Hyperactivity',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			selectpokemon(pokemon, ' Transform Ability');
		},
		desc: '',
		shortDesc: '',
	},
	//----------------elitemoves---------
	gainartirain: {
		num: 1002,
		name: 'Gain Artirain',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'artirain');
			this.add('html', `<div class="broadcast-green"><strong>you get the artirain</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainartihail: {
		num: 1002,
		name: 'Gain Artihail',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'artihail');
			this.add('html', `<div class="broadcast-green"><strong>you get the artihail</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainartistorm: {
		num: 1002,
		name: 'Gain Artistorm',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'artistorm');
			this.add('html', `<div class="broadcast-green"><strong>you get the artistorm</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainartisunny: {
		num: 1002,
		name: 'Gain Artisunny',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'artisunny');
			this.add('html', `<div class="broadcast-green"><strong>you get the artisunny</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainconfidentstart: {
		num: 1002,
		name: 'Gain Confident Start',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'confidentstart');
			this.add('html', `<div class="broadcast-green"><strong>you get the Confident Start</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainartilightscreen: {
		num: 1002,
		name: 'Gain Artilightscreen',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'artilightscreen');
			this.add('html', `<div class="broadcast-green"><strong>you get the Artilightscreen</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainartireflect: {
		num: 1002,
		name: 'Gain Artireflect',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'artireflect');
			this.add('html', `<div class="broadcast-green"><strong>you get the Artireflect</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainfocusdevice: {
		num: 1002,
		name: 'Gain Focus Device',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'focusdevice');
			this.add('html', `<div class="broadcast-green"><strong>you get the Focus Device</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainangelhalo: {
		num: 1002,
		name: 'Gain Angel Halo',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'angelhalo');
			this.add('html', `<div class="broadcast-green"><strong>you get the Angel Halo</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gainindustrialplant: {
		num: 1002,
		name: 'Gain Industrial Plant',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'industrialplant');
			this.add('html', `<div class="broadcast-green"><strong>you get the Industrial Plant</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gaineggofcompassion: {
		num: 1002,
		name: 'Gain Egg Of Compassion',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'eggofcompassion');
			this.add('html', `<div class="broadcast-green"><strong>you get the Egg Of Compassion</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gaindancingfloor: {
		num: 1002,
		name: 'Gain Dancing Floor',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'dancingfloor');
			this.add('html', `<div class="broadcast-green"><strong>you get the Dancing Floor</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	gaindragonthrones: {
		num: 1002,
		name: 'Gain Dragon Thrones',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			addrelics(this.toID(pokemon.side.name), 'dragonthrones');
			this.add('html', `<div class="broadcast-green"><strong>you get the Dragon Thrones</strong></div>`);
			chooseroom(pokemon, this.prng);
		},
		desc: '',
		shortDesc: '',
	},
	//------------功能性技能------------


	skip: {
		num: 1000,
		name: 'Skip',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			this.add('html', `<div class="broadcast-green"><strong>your skip the reward</strong></div>`);
			chooseroom(pokemon, this.prng);


		},

	},
	thanksforplaying:{
		num: 1000,
		name: 'Thanks For Playing',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: { },
		onHit(pokemon) {
			this.add('html', `<div class="broadcast-green"><strong>You passed the demo temporarily，thank you for playing</strong></div>`);
			save('', this.toID(this.p2.name));
			this.win(this.p2)


		},
	},
	retransmissionmovespoolofpokemon1: {
		num: 1000,
		name: 'Retransmission Moves Pool of pokemon 1',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 1) return
			const name = pokemon.side.team[0].name as keyof typeof Pokemonpool
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng)
			pokemon.side.team[0].moves = newmoves
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has relearned ' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionmovespoolofpokemon2: {
		num: 1000,
		name: 'Retransmission Moves Pool of pokemon 2',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 2) return
			const name = pokemon.side.team[1].name as keyof typeof Pokemonpool
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng)
			pokemon.side.team[1].moves = newmoves
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has relearned ' + newmoves.join(',') + '</strong></div>');

			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionmovespoolofpokemon3: {
		num: 1000,
		name: 'Retransmission Moves Pool of pokemon 3',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 3) return
			const name = pokemon.side.team[2].name as keyof typeof Pokemonpool
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng)
			pokemon.side.team[2].moves = newmoves
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has relearned ' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionmovespoolofpokemon4: {
		num: 1000,
		name: 'Retransmission Moves Pool of pokemon 4',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 4) return
			const name = pokemon.side.team[3].name as keyof typeof Pokemonpool
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng)
			pokemon.side.team[3].moves = newmoves
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has relearned ' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionmovespoolofpokemon5: {
		num: 1000,
		name: 'Retransmission Moves Pool of pokemon 5',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 5) return
			const name = pokemon.side.team[4].name as keyof typeof Pokemonpool
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng)
			pokemon.side.team[4].moves = newmoves
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has relearned ' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionmovespoolofpokemon6: {
		num: 1000,
		name: 'Retransmission Moves Pool of pokemon 6',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 6) return
			const name = pokemon.side.team[5].name as keyof typeof Pokemonpool
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng)
			pokemon.side.team[5].moves = newmoves
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has relearned ' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},

	
	
	retransmissionsetofpokemon1: {
		num: 1000,
		name: 'Retransmission Set of pokemon 1',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 1) return;
			const name = pokemon.side.team[0].name as keyof typeof Pokemonpool;
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng);
			const newability = Array.isArray(Pokemonpool[name].ability) ? this.prng.sample(Pokemonpool[name].ability as string[]) : Pokemonpool[name].ability as string;
			const newitem = Array.isArray(Pokemonpool[name].item) ? this.prng.sample(Pokemonpool[name].item as string[]) : Pokemonpool[name].item as string;
			pokemon.side.team[0].moves = newmoves;
			pokemon.side.team[0].ability = newability;
			pokemon.side.team[0].item = newitem;
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has reseted <br>' + newitem + '<br>' + newability + '<br>' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionsetofpokemon2: {
		num: 1000,
		name: 'Retransmission Set of pokemon 2',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 2) return;
			const name = pokemon.side.team[1].name as keyof typeof Pokemonpool;
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng);
			const newability = Array.isArray(Pokemonpool[name].ability) ? this.prng.sample(Pokemonpool[name].ability as string[]) : Pokemonpool[name].ability as string;
			const newitem = Array.isArray(Pokemonpool[name].item) ? this.prng.sample(Pokemonpool[name].item as string[]) : Pokemonpool[name].item as string;
			pokemon.side.team[1].moves = newmoves;
			pokemon.side.team[1].ability = newability;
			pokemon.side.team[1].item = newitem;
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has reseted <br>' + newitem + '<br>' + newability + '<br>' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionsetofpokemon3: {
		num: 1000,
		name: 'Retransmission Set of pokemon 3',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 3) return;
			const name = pokemon.side.team[2].name as keyof typeof Pokemonpool;
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng);
			const newability = Array.isArray(Pokemonpool[name].ability) ? this.prng.sample(Pokemonpool[name].ability as string[]) : Pokemonpool[name].ability as string;
			const newitem = Array.isArray(Pokemonpool[name].item) ? this.prng.sample(Pokemonpool[name].item as string[]) : Pokemonpool[name].item as string;
			pokemon.side.team[2].moves = newmoves;
			pokemon.side.team[2].ability = newability;
			pokemon.side.team[2].item = newitem;
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has reseted <br>' + newitem + '<br>' + newability + '<br>' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionsetofpokemon4: {
		num: 1000,
		name: 'Retransmission Set of pokemon 4',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 4) return;
			const name = pokemon.side.team[3].name as keyof typeof Pokemonpool;
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng);
			const newability = Array.isArray(Pokemonpool[name].ability) ? this.prng.sample(Pokemonpool[name].ability as string[]) : Pokemonpool[name].ability as string;
			const newitem = Array.isArray(Pokemonpool[name].item) ? this.prng.sample(Pokemonpool[name].item as string[]) : Pokemonpool[name].item as string;
			pokemon.side.team[3].moves = newmoves;
			pokemon.side.team[3].ability = newability;
			pokemon.side.team[3].item = newitem;
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has reseted <br>' + newitem + '<br>' + newability + '<br>' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionsetofpokemon5: {
		num: 1000,
		name: 'Retransmission Set of pokemon 5',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 5) return;
			const name = pokemon.side.team[4].name as keyof typeof Pokemonpool;
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng);
			const newability = Array.isArray(Pokemonpool[name].ability) ? this.prng.sample(Pokemonpool[name].ability as string[]) : Pokemonpool[name].ability as string;
			const newitem = Array.isArray(Pokemonpool[name].item) ? this.prng.sample(Pokemonpool[name].item as string[]) : Pokemonpool[name].item as string;
			pokemon.side.team[4].moves = newmoves;
			pokemon.side.team[4].ability = newability;
			pokemon.side.team[4].item = newitem;
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has reseted <br>' + newitem + '<br>' + newability + '<br>' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	retransmissionsetofpokemon6: {
		num: 1000,
		name: 'Retransmission Set of pokemon 6',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 2,
		isZ: false,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, target, move) {
			if (pokemon.side.team.length < 6) return;
			const name = pokemon.side.team[5].name as keyof typeof Pokemonpool;
			if (!Pokemonpool[name]) return;
			const newmoves = sample(Pokemonpool[name].moves, 4, this.prng);
			const newability = Array.isArray(Pokemonpool[name].ability) ? this.prng.sample(Pokemonpool[name].ability as string[]) : Pokemonpool[name].ability as string;
			const newitem = Array.isArray(Pokemonpool[name].item) ? this.prng.sample(Pokemonpool[name].item as string[]) : Pokemonpool[name].item as string;
			pokemon.side.team[5].moves = newmoves;
			pokemon.side.team[5].ability = newability;
			pokemon.side.team[5].item = newitem;
			this.add('html', '<div class="broadcast-green"><strong>your ' + name + 'has reseted <br>' + newitem + '<br>' + newability + '<br>' + newmoves.join(',') + '</strong></div>');
			const movedata = pokemon.getMoveData(move)
			if (movedata)
				if (movedata.pp < 1)
					chooseroom(pokemon, this.prng);
		},

	},
	
	deletepokemon1: {
		num: 1000,
		name: 'Delete Pokemon 1',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 0) {
				let a = pokemon.side.team.splice(0,1);
				this.add('html', `<div class="broadcast-green"><strong>your ${a[0].name} has deleted</strong></div>`);
			}
			chooseroom(pokemon, this.prng);


		},

	},
	deletepokemon2: {
		num: 1000,
		name: 'Delete Pokemon 2',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 1) {
				let a = pokemon.side.team.splice(1,1);
				this.add('html', `<div class="broadcast-green"><strong>your ${a[0].name} has deleted</strong></div>`);
			}
			chooseroom(pokemon, this.prng);


		},

	},
	deletepokemon3: {
		num: 1000,
		name: 'Delete Pokemon 3',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 2) {
				let a = pokemon.side.team.splice(2,1);
				this.add('html', `<div class="broadcast-green"><strong>your ${a[0].name} has deleted</strong></div>`);
			}
			chooseroom(pokemon, this.prng);


		},

	},
	deletepokemon4: {
		num: 1000,
		name: 'Delete Pokemon 4',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 3) {
				let a = pokemon.side.team.splice(3,1);
				this.add('html', `<div class="broadcast-green"><strong>your ${a[0].name} has deleted</strong></div>`);
			}
			chooseroom(pokemon, this.prng);


		},

	},
	deletepokemon5: {
		num: 1000,
		name: 'Delete Pokemon 5',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 4) {
				let a = pokemon.side.team.splice(4,1);
				this.add('html', `<div class="broadcast-green"><strong>your ${a[0].name} has deleted</strong></div>`);
			}
			chooseroom(pokemon, this.prng);


		},

	},
	deletepokemon6: {
		num: 1000,
		name: 'Delete Pokemon 6',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 5) {
				let a = pokemon.side.team.splice(5,1);
				this.add('html', `<div class="broadcast-green"><strong>your ${a[0].name} has deleted</strong></div>`);
			}
			chooseroom(pokemon, this.prng);


		},

	},
	pokemon1atkspefill: {
		num: 1000,
		name: 'Pokemon 1 Atk Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 0) {
				let a = pokemon.side.team[0];

				a.evs.atk = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Atk and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon2atkspefill: {
		num: 1000,
		name: 'Pokemon 2 Atk Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 1) {
				let a = pokemon.side.team[1];

				a.evs.atk = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Atk and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon3atkspefill: {
		num: 1000,
		name: 'Pokemon 3 Atk Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 2) {
				let a = pokemon.side.team[2];

				a.evs.atk = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Atk and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon4atkspefill: {
		num: 1000,
		name: 'Pokemon 4 Atk Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 3) {
				let a = pokemon.side.team[3];

				a.evs.atk = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Atk and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon5atkspefill: {
		num: 1000,
		name: 'Pokemon 5 Atk Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 4) {
				let a = pokemon.side.team[4];

				a.evs.atk = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Atk and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon6atkspefill: {
		num: 1000,
		name: 'Pokemon 6 Atk Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 5) {
				let a = pokemon.side.team[5];

				a.evs.atk = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Atk and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon1spaspefill: {
		num: 1000,
		name: 'Pokemon 1 Spa Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 0) {
				let a = pokemon.side.team[0];

				a.evs.spa = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Spa and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon2spaspefill: {
		num: 1000,
		name: 'Pokemon 2 Spa Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 1) {
				let a = pokemon.side.team[1];

				a.evs.spa = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Spa and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon3spaspefill: {
		num: 1000,
		name: 'Pokemon 3 Spa Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 2) {
				let a = pokemon.side.team[2];

				a.evs.spa = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Spa and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon4spaspefill: {
		num: 1000,
		name: 'Pokemon 4 Spa Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 3) {
				let a = pokemon.side.team[3];

				a.evs.spa = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Spa and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon5spaspefill: {
		num: 1000,
		name: 'Pokemon 5 Spa Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 4) {
				let a = pokemon.side.team[4];

				a.evs.spa = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Spa and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon6spaspefill: {
		num: 1000,
		name: 'Pokemon 6 Spa Spe Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 5) {
				let a = pokemon.side.team[5];

				a.evs.spa = 252;
				a.evs.spe = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Spa and Spe  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon1hpanotherfill: {
		num: 1000,
		name: 'Pokemon 1 Hp Another Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 0) {
				let a = pokemon.side.team[0];
				let randevs: keyof typeof a.evs= this.sample(['atk', 'def', 'spa', 'spd', 'spe']);
				a.evs.hp = 252;
				a.evs[randevs] = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Hp and ${randevs}  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon2hpanotherfill: {
		num: 1000,
		name: 'Pokemon 2 Hp Another Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 1) {
				let a = pokemon.side.team[1];
				let randevs: keyof typeof a.evs = this.sample(['atk', 'def', 'spa', 'spd', 'spe']);
				a.evs.hp = 252;
				a.evs[randevs] = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Hp and ${randevs}  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon3hpanotherfill: {
		num: 1000,
		name: 'Pokemon 3 Hp Another Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 2) {
				let a = pokemon.side.team[2];
				let randevs: keyof typeof a.evs = this.sample(['atk', 'def', 'spa', 'spd', 'spe']);
				a.evs.hp = 252;
				a.evs[randevs] = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Hp and ${randevs}  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon4hpanotherfill: {
		num: 1000,
		name: 'Pokemon 4 Hp Another Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 3) {
				let a = pokemon.side.team[3];
				let randevs: keyof typeof a.evs = this.sample(['atk', 'def', 'spa', 'spd', 'spe']);
				a.evs.hp = 252;
				a.evs[randevs] = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Hp and ${randevs}  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon5hpanotherfill: {
		num: 1000,
		name: 'Pokemon 5 Hp Another Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 4) {
				let a = pokemon.side.team[4];
				let randevs: keyof typeof a.evs = this.sample(['atk', 'def', 'spa', 'spd', 'spe']);
				a.evs.hp = 252;
				a.evs[randevs] = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Hp and ${randevs}  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon6hpanotherfill: {
		num: 1000,
		name: 'Pokemon 6 Hp Another Fill',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 5) {
				let a = pokemon.side.team[5];
				let randevs: keyof typeof a.evs = this.sample(['atk', 'def', 'spa', 'spd', 'spe']);
				a.evs.hp = 252;
				a.evs[randevs] = 252;
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s Hp and ${randevs}  has been full</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon1threeevshalf: {
		num: 1000,
		name: 'Pokemon 1 Three Evs Half',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 0) {
				let a = pokemon.side.team[0];
				let randevs: (keyof typeof a.evs)[] = sample(['atk', 'def', 'hp', 'spa', 'spd', 'spe'], 3, this.prng);
				a.evs[randevs[0]] = 126;
				a.evs[randevs[1]] = 126;
				a.evs[randevs[2]] = 126
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s ${randevs[0]},${randevs[1]} and ${randevs[2]} has been half</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon2threeevshalf: {
		num: 1000,
		name: 'Pokemon 2 Three Evs Half',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 1) {
				let a = pokemon.side.team[1];
				let randevs: (keyof typeof a.evs)[] = sample(['atk', 'def', 'hp', 'spa', 'spd', 'spe'], 3, this.prng);
				a.evs[randevs[0]] = 126;
				a.evs[randevs[1]] = 126;
				a.evs[randevs[2]] = 126
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s ${randevs[0]},${randevs[1]} and ${randevs[2]} has been half</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon3threeevshalf: {
		num: 1000,
		name: 'Pokemon 3 Three Evs Half',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 2) {
				let a = pokemon.side.team[2];
				let randevs: (keyof typeof a.evs)[] = sample(['atk', 'def', 'hp', 'spa', 'spd', 'spe'], 3, this.prng);
				a.evs[randevs[0]] = 126;
				a.evs[randevs[1]] = 126;
				a.evs[randevs[2]] = 126
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s ${randevs[0]},${randevs[1]} and ${randevs[2]} has been half</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon4threeevshalf: {
		num: 1000,
		name: 'Pokemon 4 Three Evs Half',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 3) {
				let a = pokemon.side.team[3];
				let randevs: (keyof typeof a.evs)[] = sample(['atk', 'def', 'hp', 'spa', 'spd', 'spe'], 3, this.prng);
				a.evs[randevs[0]] = 126;
				a.evs[randevs[1]] = 126;
				a.evs[randevs[2]] = 126
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s ${randevs[0]},${randevs[1]} and ${randevs[2]} has been half</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon5threeevshalf: {
		num: 1000,
		name: 'Pokemon 5 Three Evs Half',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 4) {
				let a = pokemon.side.team[4];
				let randevs: (keyof typeof a.evs)[] = sample(['atk', 'def', 'hp', 'spa', 'spd', 'spe'], 3, this.prng);
				a.evs[randevs[0]] = 126;
				a.evs[randevs[1]] = 126;
				a.evs[randevs[2]] = 126
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s ${randevs[0]},${randevs[1]} and ${randevs[2]} has been half</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon6threeevshalf: {
		num: 1000,
		name: 'Pokemon 6 Three Evs Half',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 5) {
				let a = pokemon.side.team[5];
				let randevs: (keyof typeof a.evs)[] = sample(['atk', 'def', 'hp', 'spa', 'spd', 'spe'], 3, this.prng);
				a.evs[randevs[0]] = 126;
				a.evs[randevs[1]] = 126;
				a.evs[randevs[2]] = 126
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s ${randevs[0]},${randevs[1]} and ${randevs[2]} has been half</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},

	pokemon1allevsadd48: {
		num: 1000,
		name: 'Pokemon 1 All Evs Add 48',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 0) {
				let lastmove = this.lastMove?.name;
				let a = pokemon.side.team[0];
				a.evs.atk = Math.min(a.evs.atk + 48, 252);
				a.evs.def = Math.min(a.evs.def + 48, 252);
				a.evs.hp = Math.min(a.evs.hp + 48, 252);
				a.evs.spa = Math.min(a.evs.spa + 48, 252);
				a.evs.spd = Math.min(a.evs.spd + 48, 252);
				a.evs.spe = Math.min(a.evs.spe + 48, 252);
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s evs has been increased 48</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	
	pokemon2allevsadd48: {
		num: 1000,
		name: 'Pokemon 2 All Evs Add 48',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 1) {
				let lastmove = this.lastMove?.name;
				let a = pokemon.side.team[1];
				a.evs.atk = Math.min(a.evs.atk + 48, 252);
				a.evs.def = Math.min(a.evs.def + 48, 252);
				a.evs.hp = Math.min(a.evs.hp + 48, 252);
				a.evs.spa = Math.min(a.evs.spa + 48, 252);
				a.evs.spd = Math.min(a.evs.spd + 48, 252);
				a.evs.spe = Math.min(a.evs.spe + 48, 252);
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s evs has been increased 48</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon3allevsadd48: {
		num: 1000,
		name: 'Pokemon 3 All Evs Add 48',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 2) {
				let lastmove = this.lastMove?.name;
				let a = pokemon.side.team[2];
				a.evs.atk = Math.min(a.evs.atk + 48, 252);
				a.evs.def = Math.min(a.evs.def + 48, 252);
				a.evs.hp = Math.min(a.evs.hp + 48, 252);
				a.evs.spa = Math.min(a.evs.spa + 48, 252);
				a.evs.spd = Math.min(a.evs.spd + 48, 252);
				a.evs.spe = Math.min(a.evs.spe + 48, 252);
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s evs has been increased 48</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon4allevsadd48: {
		num: 1000,
		name: 'Pokemon 4 All Evs Add 48',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 3) {
				let lastmove = this.lastMove?.name;
				let a = pokemon.side.team[3];
				a.evs.atk = Math.min(a.evs.atk + 48, 252);
				a.evs.def = Math.min(a.evs.def + 48, 252);
				a.evs.hp = Math.min(a.evs.hp + 48, 252);
				a.evs.spa = Math.min(a.evs.spa + 48, 252);
				a.evs.spd = Math.min(a.evs.spd + 48, 252);
				a.evs.spe = Math.min(a.evs.spe + 48, 252);
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s evs has been increased 48</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon5allevsadd48: {
		num: 1000,
		name: 'Pokemon 5 All Evs Add 48',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 4) {
				let lastmove = this.lastMove?.name;
				let a = pokemon.side.team[4];
				a.evs.atk = Math.min(a.evs.atk + 48, 252);
				a.evs.def = Math.min(a.evs.def + 48, 252);
				a.evs.hp = Math.min(a.evs.hp + 48, 252);
				a.evs.spa = Math.min(a.evs.spa + 48, 252);
				a.evs.spd = Math.min(a.evs.spd + 48, 252);
				a.evs.spe = Math.min(a.evs.spe + 48, 252);
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s evs has been increased 48</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	pokemon6allevsadd48: {
		num: 1000,
		name: 'Pokemon 6 All Evs Add 48',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			if (pokemon.side.team.length > 5) {
				let lastmove = this.lastMove?.name;
				let a = pokemon.side.team[5];
				a.evs.atk = Math.min(a.evs.atk + 48, 252);
				a.evs.def = Math.min(a.evs.def + 48, 252);
				a.evs.hp = Math.min(a.evs.hp + 48, 252);
				a.evs.spa = Math.min(a.evs.spa + 48, 252);
				a.evs.spd = Math.min(a.evs.spd + 48, 252);
				a.evs.spe = Math.min(a.evs.spe + 48, 252);
				this.add('html', `<div class="broadcast-green"><strong>your ${a.name}'s evs has been increased 48</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon1getitem:{
		num:1000,
		name:'Select Pokemon 1 Get Item',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		
		onHit(pokemon) {
			if (pokemon.side.team.length > 0) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[0].item = lastmove.toLowerCase().replace('get', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[0].name} has got ${lastmove?.replace('Get', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon2getitem: {
		num: 1000,
		name: 'Select Pokemon 2 Get Item',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 1) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[1].item = lastmove.toLowerCase().replace('get', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[1].name} has got ${lastmove?.replace('Get', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon3getitem: {
		num: 1000,
		name: 'Select Pokemon 3 Get Item',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 2) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[2].item = lastmove.toLowerCase().replace('get', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[2].name} has got ${lastmove?.replace('Get', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon4getitem: {
		num: 1000,
		name: 'Select Pokemon 4 Get Item',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 3) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[3].item = lastmove.toLowerCase().replace('get', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[3].name} has got ${lastmove?.replace('Get', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon5getitem: {
		num: 1000,
		name: 'Select Pokemon 5 Get Item',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 4) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[4].item = lastmove.toLowerCase().replace('get', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[4].name} has got ${lastmove?.replace('Get', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon6getitem: {
		num: 1000,
		name: 'Select Pokemon 6 Get Item',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 5) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[5].item = lastmove.toLowerCase().replace('get', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[5].name} has got ${lastmove?.replace('Get', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon1transformability: {
		num: 1000,
		name: 'Select Pokemon 1 Transform Ability',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 0) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[0].ability = lastmove.toLowerCase().replace('become', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[0].name}'s ablity has become ${lastmove?.replace('Become', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon2transformability: {
		num: 1000,
		name: 'Select Pokemon 2 Transform Ability',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 1) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[1].ability = lastmove.toLowerCase().replace('become', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[1].name}'s ablity has become ${lastmove?.replace('Become', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon3transformability: {
		num: 1000,
		name: 'Select Pokemon 3 Transform Ability',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 2) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[2].ability = lastmove.toLowerCase().replace('become', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[2].name}'s ablity has become ${lastmove?.replace('Become', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon4transformability: {
		num: 1000,
		name: 'Select Pokemon 4 Transform Ability',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 3) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[3].ability = lastmove.toLowerCase().replace('become', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[3].name}'s ablity has become ${lastmove?.replace('Become', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon5transformability: {
		num: 1000,
		name: 'Select Pokemon 5 Transform Ability',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 4) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[4].ability = lastmove.toLowerCase().replace('become', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[4].name}'s ablity has become ${lastmove?.replace('Become', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon6transformability: {
		num: 1000,
		name: 'Select Pokemon 6 Transform Ability',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon) {
			if (pokemon.side.team.length > 5) {
				let lastmove = this.lastMove?.name;

				if (lastmove) {
					pokemon.side.team[5].ability = lastmove.toLowerCase().replace('become', '').trim();
				}

				this.add('html', `<div class="broadcast-green"><strong>your ${pokemon.side.team[5].name}'s ablity has become ${lastmove?.replace('Become', '')}</strong></div>`);
			}
			chooseroom(pokemon, this.prng);

		},
	},
	selectpokemon1learnmove: {
		num: 1000,
		name: 'Select Pokemon 1 Learn Move',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			let lastmove = pokemon.moveSlots[pokemon.moveSlots.length-1]
			pokemon.moveSlots = [];


			for (let i = 1; i < 5;i++) {
				pokemon.moveSlots.push({
					move: 'Replace Move ' + i,
					id: this.toID('Replace Move ' + i),
					pp: 1,
					maxpp: 1,
					target: 'self',
					disabled: false,
					used: false,
					virtual: true,
				});
			}
			pokemon.moveSlots.push(lastmove);

		},
	},
	selectpokemon2learnmove: {
		num: 1000,
		name: 'Select Pokemon 2 Learn Move',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			let lastmove = pokemon.moveSlots[pokemon.moveSlots.length - 1]
			pokemon.moveSlots = [];


			for (let i = 1; i < 5; i++) {
				pokemon.moveSlots.push({
					move: 'Replace Move ' + i,
					id: this.toID('Replace Move ' + i),
					pp: 1,
					maxpp: 1,
					target: 'self',
					disabled: false,
					used: false,
					virtual: true,
				});
			}
			pokemon.moveSlots.push(lastmove);

		},
	},
	selectpokemon3learnmove: {
		num: 1000,
		name: 'Select Pokemon 3 Learn Move',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			let lastmove = pokemon.moveSlots[pokemon.moveSlots.length - 1]
			pokemon.moveSlots = [];


			for (let i = 1; i < 5; i++) {
				pokemon.moveSlots.push({
					move: 'Replace Move ' + i,
					id: this.toID('Replace Move ' + i),
					pp: 1,
					maxpp: 1,
					target: 'self',
					disabled: false,
					used: false,
					virtual: true,
				});
			}
			pokemon.moveSlots.push(lastmove);

		},
	},
	selectpokemon4learnmove: {
		num: 1000,
		name: 'Select Pokemon 4 Learn Move',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			let lastmove = pokemon.moveSlots[pokemon.moveSlots.length - 1]
			pokemon.moveSlots = [];


			for (let i = 1; i < 5; i++) {
				pokemon.moveSlots.push({
					move: 'Replace Move ' + i,
					id: this.toID('Replace Move ' + i),
					pp: 1,
					maxpp: 1,
					target: 'self',
					disabled: false,
					used: false,
					virtual: true,
				});
			}
			pokemon.moveSlots.push(lastmove);

		},
	},
	selectpokemon5learnmove: {
		num: 1000,
		name: 'Select Pokemon 5 Learn Move',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			let lastmove = pokemon.moveSlots[pokemon.moveSlots.length - 1]
			pokemon.moveSlots = [];


			for (let i = 1; i < 5; i++) {
				pokemon.moveSlots.push({
					move: 'Replace Move ' + i,
					id: this.toID('Replace Move ' + i),
					pp: 1,
					maxpp: 1,
					target: 'self',
					disabled: false,
					used: false,
					virtual: true,
				});
			}
			pokemon.moveSlots.push(lastmove);

		},
	},
	selectpokemon6learnmove: {
		num: 1000,
		name: 'Select Pokemon 6 Learn Move',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: -10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
			let lastmove = pokemon.moveSlots[pokemon.moveSlots.length - 1]
			pokemon.moveSlots = [];


			for (let i = 1; i < 5; i++) {
				pokemon.moveSlots.push({
					move: 'Replace Move ' + i,
					id: this.toID('Replace Move ' + i),
					pp: 1,
					maxpp: 1,
					target: 'self',
					disabled: false,
					used: false,
					virtual: true,
				});
			}
			pokemon.moveSlots.push(lastmove);

		},
	},
	replacemove1: {
		num: 1000,
		name: 'Replace Move 1',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {
				
			let lastmove = this.lastMove?.name.replace(/[^0-9]/ig, "");
			let premove,a;
			let move = pokemon.moveSlots[pokemon.moveSlots.length - 1].move.replace('Learn', '')
			if (lastmove) {
				a = pokemon.side.team[Number(lastmove)-1];
				if (a.moves.length < 4)
					a.moves.push(move);
				else {
					premove=a.moves[0]
					a.moves[0] = move
				}
						
			}

			this.add('html', `<div class="broadcast-green"><strong>your ${a?.name} has forgot ${premove} and learned ${move}</strong></div>`);
		
			chooseroom(pokemon, this.prng);

		},
	},
	replacemove2: {
		num: 1000,
		name: 'Replace Move 2',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {

			let lastmove = this.lastMove?.name.replace(/[^0-9]/ig, "");
			let premove, a;
			let move = pokemon.moveSlots[pokemon.moveSlots.length - 1].move.replace('Learn', '')
			if (lastmove) {
				a = pokemon.side.team[Number(lastmove)-1];
				if (a.moves.length < 4)
					a.moves.push(move);
				else {
					premove = a.moves[1]
					a.moves[1] = move
				}

			}

			this.add('html', `<div class="broadcast-green"><strong>your ${a?.name} has forgot ${premove} and learned ${move}</strong></div>`);

			chooseroom(pokemon, this.prng);

		},
	},
	replacemove3: {
		num: 1000,
		name: 'Replace Move 3',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {

			let lastmove = this.lastMove?.name.replace(/[^0-9]/ig, "");
			let premove, a;
			let move = pokemon.moveSlots[pokemon.moveSlots.length - 1].move.replace('Learn', '')
			if (lastmove) {
				a = pokemon.side.team[Number(lastmove)-1];
				if (a.moves.length < 4)
					a.moves.push(move);
				else {
					premove = a.moves[2]
					a.moves[2] = move
				}

			}

			this.add('html', `<div class="broadcast-green"><strong>your ${a?.name} has forgot ${premove} and learned ${move}</strong></div>`);

			chooseroom(pokemon, this.prng);

		},
	},
	replacemove4: {
		num: 1000,
		name: 'Replace Move 4',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},

		onHit(pokemon) {

			let lastmove = this.lastMove?.name.replace(/[^0-9]/ig, "");
			let premove, a;
			let move = pokemon.moveSlots[pokemon.moveSlots.length - 1].move.replace('Learn', '')
			if (lastmove) {
				a = pokemon.side.team[Number(lastmove)-1];
				if (a.moves.length < 4)
					a.moves.push(move);
				else {
					premove = a.moves[3]
					a.moves[3] = move
				}

			}

			this.add('html', `<div class="broadcast-green"><strong>your ${a?.name} has forgot ${premove} and learned ${move}</strong></div>`);


			chooseroom(pokemon, this.prng);
		},
	},

	//-----------------rooms-----------------
	choosenextroom: {
		num: 1000,
		name: 'Choose Next room',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
	},
	itemroom: {
		num: 1000,
		name: 'Item room',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon,source,move) {

			addroom(this.toID(this.p2.name), move.id)

			this.p1.active[0].faint();

		},
	},
	moveroom: {
		num: 1000,
		name: 'move room',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {

			addroom(this.toID(this.p2.name), move.id)

			this.p1.active[0].faint();

		},
	},
	abilityroom: {
		num: 1000,
		name: 'Ability room',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {

			addroom(this.toID(this.p2.name), move.id)

			this.p1.active[0].faint();

		},
	},
	pokemonroom: {
		num: 1000,
		name: 'Pokemon room',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {

			addroom(this.toID(this.p2.name), move.id)

			this.p1.active[0].faint();

		},
	},
	commonroom: {
		num: 1000,
		name: 'Common room',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {

			addroom(this.toID(this.p2.name), move.id)

			this.p1.active[0].faint();

		},
	},
	eliteroom: {
		num: 1000,
		name: 'Elite room',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {

			addroom(this.toID(this.p2.name), move.id)

			this.p1.active[0].faint();

		},
	},
	championroom: {
		num: 1000,
		name: 'Champion room',
		type: 'Normal',
		accuracy: true,
		basePower: 0,
		category: 'Status',
		pp: 1,
		isZ: true,
		priority: 10,
		target: 'self',
		flags: {},
		onHit(pokemon, source, move) {

			addroom(this.toID(this.p2.name), move.id)

			this.p1.active[0].faint();

		},
	},




};
