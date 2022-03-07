export const Items: { [k: string]: ModdedItemData } = {
	superband: {
		name: "Super Band",
		spritenum: 68,
		fling: {
			basePower: 10,
		},
		onStart(pokemon) {
			if (pokemon.volatiles['choicelock']) {
				this.debug('removing choicelock: ' + pokemon.volatiles['choicelock']);
			}
			pokemon.removeVolatile('choicelock');
		},
		onModifyMove(move, pokemon) {
			pokemon.addVolatile('choicelock');
		},
		onModifyAtkPriority: 1,
		onModifyAtk(atk, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			return this.chainModify(2);
		},
		isChoice: true,
		num: 220,
		gen: 3,
	},
	superscarf: {
		name: "Super Scarf",
		spritenum: 69,
		fling: {
			basePower: 10,
		},
		onStart(pokemon) {
			if (pokemon.volatiles['choicelock']) {
				this.debug('removing choicelock: ' + pokemon.volatiles['choicelock']);
			}
			pokemon.removeVolatile('choicelock');
		},
		onModifyMove(move, pokemon) {
			pokemon.addVolatile('choicelock');
		},
		onModifySpe(spe, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			return this.chainModify(2);
		},
		isChoice: true,
		num: 287,
		gen: 4,
	},
	superspecs: {
		name: "Super Specs",
		spritenum: 70,
		fling: {
			basePower: 10,
		},
		onStart(pokemon) {
			if (pokemon.volatiles['choicelock']) {
				this.debug('removing choicelock: ' + pokemon.volatiles['choicelock']);
			}
			pokemon.removeVolatile('choicelock');
		},
		onModifyMove(move, pokemon) {
			pokemon.addVolatile('choicelock');
		},
		onModifySpAPriority: 1,
		onModifySpA(spa, pokemon) {
			if (pokemon.volatiles['dynamax']) return;
			return this.chainModify(2);
		},
		isChoice: true,
		num: 297,
		gen: 4,
	},
	supervest: {
		name: "Super Vest",
		spritenum: 581,
		fling: {
			basePower: 80,
		},
		onModifySpDPriority: 1,
		onModifySpD(spd) {
			return this.chainModify(2);
		},
		onDisableMove(pokemon) {
			for (const moveSlot of pokemon.moveSlots) {
				if (this.dex.moves.get(moveSlot.move).category === 'Status') {
					pokemon.disableMove(moveSlot.id);
				}
			}
		},
		num: 640,
		gen: 6,
	},
	diseviolite: {
		name: "Diseviolite",
		spritenum: 130,
		fling: {
			basePower: 40,
		},
		onModifyDefPriority: 2,
		onModifyDef(def, pokemon) {
				return this.chainModify(1.5);			
		},
		onModifySpDPriority: 2,
		onModifySpD(spd, pokemon) {			
				return this.chainModify(1.5);			
		},
		num: 538,
		gen: 5,
	},
	superquickclaw: {
		onFractionalPriorityPriority: -2,
		onFractionalPriority(priority, pokemon) {
			if (priority <= 0 && this.randomChance(2, 5)) {
				this.add('-activate', pokemon, 'item: Quick Claw');
				return 0.1;
			}
		},
		name: "Super Quick Claw",
		spritenum: 373,
		fling: {
			basePower: 80,
		},
		num: 217,
		gen: 2,
	},
	supermetronome: {
		name: "Super Metronome",
		spritenum: 289,
		fling: {
			basePower: 30,
		},
		onStart(pokemon) {
			pokemon.addVolatile('supermetronome');
		},
		condition: {
			onStart(pokemon) {
				this.effectState.lastMove = '';
				this.effectState.numConsecutive = 0;
			},
			onTryMovePriority: -2,
			onTryMove(pokemon, target, move) {
				if (!pokemon.hasItem('supermetronome')) {
					pokemon.removeVolatile('supermetronome');
					return;
				}
				if (this.effectState.lastMove === move.id && pokemon.moveLastTurnResult) {
					this.effectState.numConsecutive++;
				} else if (pokemon.volatiles['twoturnmove'] && this.effectState.lastMove !== move.id) {
					this.effectState.numConsecutive = 1;
				} else {
					this.effectState.numConsecutive = 0;
				}
				this.effectState.lastMove = move.id;
			},
			onModifyDamage(damage, source, target, move) {
				const dmgMod = [4096, 5324, 6553, 7782, 9011, 10240];
				const numConsecutive = this.effectState.numConsecutive > 5 ? 5 : this.effectState.numConsecutive;
				this.debug(`Current Metronome boost: ${dmgMod[numConsecutive]}/4096`);
				return this.chainModify([dmgMod[numConsecutive], 4096]);
			},
		},
		num: 277,
		gen: 4,
	},
	superlifeorb: {
		name: "Super Life Orb",
		spritenum: 249,
		fling: {
			basePower: 30,
		},
		onModifyDamage(damage, source, target, move) {
			return this.chainModify([6144, 4096]);
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (source && source !== target && move && move.category !== 'Status') {
				this.damage(source.baseMaxhp / 10, source, source, this.dex.items.get('lifeorb'));
			}
		},
		num: 270,
		gen: 4,
	},
	intactapple: {
		name: "Intact Apple",
		spritenum: 242,
		fling: {
			basePower: 10,
		},
		onResidualOrder: 5,
		onResidualSubOrder: 4,
		onResidual(pokemon) {
			this.heal(pokemon.baseMaxhp / 8);
		},
		num: 234,
		gen: 2,
	},
	immunityherb: {
		name: "Immunity Herb",
		spritenum: 285,
		fling: {
			basePower: 10,
			
		},
		
		onSourceModifyDamage(damage, source, target, move) {
				
				if (target.useItem()) {

					this.add('-useitem', target, this.effect, '[immune]');
					return this.chainModify(0);
				}
			
		},
	},
	supermuscleband: {
		name: "Super Muscle Band",
		spritenum: 297,
		fling: {
			basePower: 10,
		},
		onBasePowerPriority: 16,
		onBasePower(basePower, user, target, move) {
			if (move.category === 'Physical') {
				return this.chainModify([4915, 4096]);
			}
		},
		num: 266,
		gen: 4,
	},
	superwiseglasses: {
		name: "Super Wise Glasses",
		spritenum: 539,
		fling: {
			basePower: 10,
		},
		onBasePowerPriority: 16,
		onBasePower(basePower, user, target, move) {
			if (move.category === 'Special') {
				return this.chainModify([4915, 4096]);
			}
		},
		num: 267,
		gen: 4,
	},
	adaptiveslate: {
		name: "Adaptive Slate",
		spritenum: 539,
		fling: {
			basePower: 10,
		},
		onModifyMove(move) {
			move.stab = 1.8;
		},
		num: 267,
		gen: 4,
	},
	explosivearm: {
		name: "Explosive Arm",
		spritenum: 249,
		fling: {
			basePower: 30,
		},
		onModifyDamage(damage, source, target, move) {
			return this.chainModify([8192, 4096]);
		},
		onModifyDefPriority: 2,
		onModifyDef(def, pokemon) {
			return this.chainModify(0.5);
		},
		onModifySpDPriority: 2,
		onModifySpD(spd, pokemon) {
			return this.chainModify(0.5);
		},
		num: 270,
		gen: 4,
	},
	doubleedgedsword: {
		name: "Double-edged Sword",
		spritenum: 249,
		fling: {
			basePower: 30,
		},
		onModifyDamage(damage, source, target, move) {
			return this.chainModify([10240, 4096]);
		},
		onAfterMoveSecondarySelf(source, target, move) {
			if (source && source !== target && move && move.category !== 'Status') {
				this.directDamage(source.baseMaxhp / 10*3, source, source);
			}
		},
		
		num: 270,
		gen: 4,
	},
	flexibledevice: {
		name: "Flexible Device",
		spritenum: 249,
		fling: {
			basePower: 30,
		},
		onModifyDamage(damage, source, target, move) {
			return this.chainModify([5324, 4096]);
		},
		onModifySpe(spe, pokemon) {
			return this.chainModify([5324, 4096]);
		},
		onModifyDefPriority: 2,
		onModifyDef(def, pokemon) {
			if ( pokemon.species.name.toLowerCase() === 'kartana') return
			return this.chainModify(0.666);
		},
		onModifySpDPriority: 2,
		onModifySpD(spd, pokemon) {
			if ( pokemon.species.name.toLowerCase() === 'kartana') return
			return this.chainModify(0.666);
		},
		
		num: 270,
		gen: 4,
	},
	painconnector: {
		name: "Pain Connector",
		spritenum: 249,
		fling: {
			basePower: 30,
		},
		
		onAnyDamagingHit(damage, target, source, move) {
			if (!target.fainted&& source && target !== source && move && move.category !== 'Status') {
				this.heal(Math.floor(damage / 2), target, target);
				this.damage(Math.floor(damage / 2), source, source);
			}
		},

		num: 270,
		gen: 4,
	},
	sightlens: {
		name: "Sight Lens",
		spritenum: 537,
		fling: {
			basePower: 10,
		},
		onSourceModifyAccuracyPriority: -2,
		onSourceModifyAccuracy(accuracy) {
			if (typeof accuracy === 'number') {
				return this.chainModify([4915, 4096]);
			}
		},
		num: 265,
		gen: 4,
	},
	deepseadew: {
		name: "Deep Sea Dew",
		onModifyMovePriority: -1,
		onModifyMove(move, target) {
			if (move.category !== "Status" && move.basePower >0) {
				if (!move.secondaries) move.secondaries = [];
				for (const secondary of move.secondaries) {
					if (secondary.volatileStatus === 'partiallytrapped') return;
				}
				move.secondaries.push({
					volatileStatus: 'partiallytrapped',
				});
				this.add('-activate', target, 'item: Deep Sea Dew');
			}
		},
		gen: 8,
	},
	seismiclever: {
		name: "Seismic Lever",
		spritenum: 249,
		fling: {
			basePower: 30,
		},
		
		onFoeDamage(damage, target, source, effect) {
			if (effect.effectType === 'Move')
				return damage + source.level/2
		},

		num: 270,
		gen: 4,
	},
	azureflute: {
		name: "Azure Flute",
		spritenum: 242,
		fling: {
			basePower: 10,
		},
		onResidualOrder: 5,
		onResidualSubOrder: 4,
		onResidual(pokemon) {
			if (this.prng.next(32) === 1) {
				for (let foe of pokemon.foes()) {
					this.add('-activate', pokemon, 'item: Azure Flute');
					foe.faint()
				}
			}
		},
		num: 234,
		gen: 2,
	},
	gladiatorhelmet: {
		onDamage(damage, target, source, effect) {
			if (effect.id === 'recoil') {
				if (!this.activeMove) throw new Error("Battle.activeMove is null");
				if (this.activeMove.id !== 'struggle') return null;
			}
		},
		name: "Gladiator Helmet",
		num: 69,
	},
	superbrightpowder: {
		name: "Super Bright Powder",
		spritenum: 51,
		fling: {
			basePower: 10,
		},
		onModifyAccuracyPriority: -2,
		onModifyAccuracy(accuracy,source,target) {
			if (typeof accuracy !== 'number') return;
			this.debug('brightpowder - decreasing accuracy');
			if (target.volatiles['elite']) return;
			return this.chainModify([3277, 4096]);
		},
		num: 213,
		gen: 2,
	},
};
