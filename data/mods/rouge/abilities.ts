export const Abilities: { [k: string]: ModdedAbilityData } = {
	shopman: {
		onDamage(damage, target, source, effect) {
			
				return false;
			
		},
		onFoeTrapPokemon(pokemon) {
			if (!pokemon.hasAbility('shadowtag') && pokemon.isAdjacent(this.effectState.target)) {
				pokemon.tryTrap(true);
			}
		},
		onFoeMaybeTrapPokemon(pokemon, source) {
			if (!source) source = this.effectState.target;
			if (!source || !pokemon.isAdjacent(source)) return;
			if (!pokemon.hasAbility('shadowtag')) {
				pokemon.maybeTrapped = true;
			}
		},
		name: "Shop Man",
		rating: 4,
		num: 98,
	},
	anfist: {
		onBasePowerPriority: 23,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['punch']) {
				this.debug('An Fist boost');
				return this.chainModify(4);
			}
		},
		name: "An Fist",
		rating: 3,
		num: 89,
	},
	snorlax: {
		onUpdate(pokemon) {
			if (pokemon.status === 'psn' || pokemon.status === 'tox') {
				this.add('-activate', pokemon, 'ability: Immunity');
				pokemon.cureStatus();
			}
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'psn' && status.id !== 'tox') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Immunity');
			}
			return false;
		},
		onSourceModifyAtkPriority: 6,
		onSourceModifyAtk(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Thick Fat weaken');
				return this.chainModify(0.5);
			}
		},
		onSourceModifySpAPriority: 5,
		onSourceModifySpA(atk, attacker, defender, move) {
			if (move.type === 'Ice' || move.type === 'Fire') {
				this.debug('Thick Fat weaken');
				return this.chainModify(0.5);
			}
		},
		onTryHeal(damage, target, source, effect) {
			if (!effect) return;
			if (effect.id === 'berryjuice' || effect.id === 'leftovers') {
				return this.chainModify(2);
			}

		},
		isBreakable: true,
		name: "Snorlax",
		rating: 2,
		num: 17,
	},
	richloli: {
		name: "Rich Loli",

		
		onModifyAccuracyPriority: -2,
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			this.debug('richloli - decreasing accuracy');
			return this.chainModify([615, 4096]);
		},
		isBreakable: true,
		num: 255,
		gen: 3,
	},
	defensepower: {
		onStart(pokemon) {
			pokemon.storedStats.atk = pokemon.storedStats.def;
			this.add('-ability', pokemon, 'Defense Power')
		},
		name: "Defense Power",
		rating: 3.5,
		num: 235,
	},
	ununown: {
		
		onAllyEffectiveness(typeMod, target, type, move) {
			if (this.prng.next(2)) {
				if (
					target?.isActive && move.effectType === 'Move' && move.category !== 'Status'
				) {
					let type2 = move.type;
					switch (move.type) {
						case 'Bug': type2 = 'Fairy'; break;
						case 'Dragon': type2 = 'Steel'; break;
						case 'Fairy': type2 = 'Fire'; break;
						case 'Fighting': type2 = 'Psychic'; break;
						case 'Flying': type2 = 'Electric'; break;
						case 'Ghost': type2 = 'Dark'; break;
						case 'Ground': type2 = 'Grass'; break;
						case 'Normal': type2 = 'Steel'; break;
						case 'Rock': type2 = 'Steel'; break;
						default: break;

					}
					if (!target.setType(type2)) return -1;
					this.add('-start', target, 'typechange', type2, '[from] ability: Ununown');
					return -1;
				}
			}
		},

		name: "Ununown",
		rating: 0,
		num: 16,
	},
	//-------------player abilites
	bomber: {
		name: 'Bomber',
		rating: 3,
		num: 89,
		onModifyAtkPriority: 5,
		onModifyAtk(atk) {
			return this.chainModify(2);
		},
		onModifySpAPriority: 5,
		onModifySpA(spa) {
			return this.chainModify(2);
		},
		onStart(pokemon) {
			for (let move of pokemon.moveSlots) {
				move.maxpp = 1;
				move.pp=1
			}
		}
	},
	hide: {
		name: 'Hide',
		rating: 3,
		num: 89,
		onTryHit(target, source, move) {
			if (target !== source && move.type === 'Fighting') {
				
				this.add('-immune', target, '[from] ability: Hide');
				
				return null;
			}
		},
		onBasePowerPriority: 35,
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Ghost') {
				return this.chainModify([3, 2]);
			}
		},
		
	},
	diffuser: {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (move.target === 'allAdjacent' || move.target === 'allAdjacentFoes') {
				return this.chainModify([5325, 4096]);
			}
		},
		name: "Diffuser",
		rating: 3.5,
		num: 181,
	},
	concentrator: {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (move.target === 'normal' || move.target === 'randomNormal' || move.target === 'any') {
				return this.chainModify([3, 2]);
			}
		},
		name: "Concentrator",
		rating: 3.5,
		num: 181,
	},
	hardshell: {
		onSourceModifyDamage(damage, source, target, move) {
			switch (target.getMoveHitData(move).typeMod) {
				
				
				case 0:return this.chainModify(0.9);
				case 1: return this.chainModify(0.8);
				case 2: return this.chainModify(0.6);
				default:
				case -1: return this.chainModify(0.95);
			}
		},
		isBreakable: true,
		name: "Hard Shell",
		rating: 3,
		num: 111,
	},
	giantkiller: {
		name: "Giant Killer",

		onModifyDamage(damage, source, target, move) {
			if (target.getWeight()>=150)
				return this.chainModify([5324, 4096]);
		},

		rating: 3.5,
		num: 270,

	},
	irreducible: {
		onBoost(boost, target, source, effect) {
			let showMsg = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
				this.add("-fail", target, "unboost", "[from] ability: Irreducible", "[of] " + target);
			}
		},
		isBreakable: true,
		name: "Irreducible",
		rating: 2,
		num: 29,
	},
	hyperactivity: {
		
		onResidual(pokemon) {
			pokemon.removeVolatile('choicelock');
			
		},
		onDisableMove() {

		},
		name: "Hyperactivity",
		rating: 3,
		num: 111,
	},
	
	
	
};
