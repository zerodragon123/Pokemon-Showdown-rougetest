export const Abilities: { [k: string]: ModdedAbilityData } = {
	/*------------椰子------------*/
	harvest2: {
		isPermanent: true,
		/*isUnbreakable: true,*/
		name: "Harvest2",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onStart(pokemon) {
			pokemon.addVolatile('dynamax2');
			//for (const action of this.queue) {
			//	if (action.choice === 'runPrimal' && action.pokemon === source && source.species.id === 'groudon') return;
			//	if (action.choice !== 'runSwitch' && action.choice !== 'runPrimal') break;
			//}
			this.field.setWeather('sunnyday');
		},
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'frz') return false;
			if (type === 'slp') return false;
			if (type === 'par') return false;
			if (type === 'tox') return false;
			if (type === 'psn') return false;
			if (type === 'brn') return false;
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'slp') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Insomnia');
			}
			return false;
			//if (status.id !== 'par') return;
			//if ((effect as Move)?.status) {
			//	this.add('-immune', target, '[from] ability: Limber');
			//}
			//return false;
			//if (status.id !== 'frz') return;
			//if ((effect as Move)?.status) {
			//	this.add('-immune', target, '[from] ability: Limber');
			//}
			//return false;
		},
		onResidual(pokemon) {
			if (this.field.isWeather(['sunnyday', 'desolateland']) || this.randomChance(1, 2)) {
				if (pokemon.hp && !pokemon.item && this.dex.items.get(pokemon.lastItem).isBerry) {
					pokemon.setItem(pokemon.lastItem);
					pokemon.lastItem = '';
					this.add('-item', pokemon, pokemon.getItem(), '[from] ability: Harvest');
				}
			}
		},
		rating: 2.5,
		num: 139,
	},
	/*---------飞鱼-------------*/
	hydraulicpressure: {
		isPermanent: true,
		/*isUnbreakable: true,*/
		name: "Hydraulic Pressure",
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onStart(pokemon) {
			pokemon.addVolatile('dynamax2');
			//for (const action of this.queue) {
			//	if (action.choice === 'runPrimal' && action.pokemon === source && source.species.id === 'groudon') return;
			//	if (action.choice !== 'runSwitch' && action.choice !== 'runPrimal') break;
			//}
			this.add('-ability', pokemon, 'Hydraulic Pressure');
			this.field.setWeather('raindance');
		},
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		onImmunity(type, pokemon) {
			if (type === 'frz') return false;
			if (type === 'slp') return false;
			if (type === 'par') return false;
			if (type === 'tox') return false;
			if (type === 'psn') return false;
			if (type === 'brn') return false;
		},
		onSetStatus(status, target, source, effect) {
			if (status.id !== 'slp') return;
			if ((effect as Move)?.status) {
				this.add('-immune', target, '[from] ability: Insomnia');
			}
			return false;
			//if (status.id !== 'par') return;
			//if ((effect as Move)?.status) {
			//	this.add('-immune', target, '[from] ability: Limber');
			//}
			//return false;
			//if (status.id !== 'frz') return;
			//if ((effect as Move)?.status) {
			//	this.add('-immune', target, '[from] ability: Limber');
			//}
			//return false;
		},
		onDeductPP(target, source) {
			if (target.side === source.side) return;
			return 3;
		},
		rating: 2.5,
		num: 139,
	},
	/*------火蛾--------*/
	hotdance: {
		isPermanent: true,
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onStart(pokemon) {
			pokemon.addVolatile('dynamax2');
		},
		onModifyDefPriority: 6,
		onModifyDef(def) {
			return this.chainModify(1.3);
		},
		onImmunity(type, pokemon) {
			if (type === 'frz') return false;
			if (type === 'slp') return false;
			if (type === 'par') return false;
			if (type === 'tox') return false;
			if (type === 'psn') return false;
			if (type === 'brn') return false;
		},
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
			if (
				effect.effectType === "Move" &&
				!effect.multihit &&
				!effect.negateSecondary
			) {
				target.abilityState.checkedBerserk = false;
			} else {
				target.abilityState.checkedBerserk = true;
			}
		},
		onTryEatItem(item, pokemon) {
			const healingItems = [
				'aguavberry', 'enigmaberry', 'figyberry', 'iapapaberry', 'magoberry', 'sitrusberry', 'wikiberry', 'oranberry', 'berryjuice',
			];
			if (healingItems.includes(item.id)) {
				return pokemon.abilityState.checkedBerserk;
			}
			return true;
		},
		onAfterMoveSecondary(target, source, move) {
			target.abilityState.checkedBerserk = true;
			if (!source || source === target || !target.hp || !move.totalDamage) return;
			const lastAttackedBy = target.getLastAttackedBy();
			if (!lastAttackedBy) return;
			const damage = move.multihit ? move.totalDamage : lastAttackedBy.damage;
			if (target.hp <= target.maxhp / 2 && target.hp + damage > target.maxhp / 2) {
				this.actions.useMove('quiverdance', target);
			}
		},
		name: "Hot Dance",
		rating: 2,

	},
	/*-------心蝙蝠---------*/
	crouchingdefense: {
		isPermanent: true,
		isBreakable: false,
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onStart(pokemon) {
			pokemon.addVolatile('dynamax2');
		},
		onImmunity(type, pokemon) {
			if (type === 'frz') return false;
			if (type === 'slp') return false;
			if (type === 'par') return false;
			if (type === 'tox') return false;
			if (type === 'psn') return false;
			if (type === 'brn') return false;
		},
		onBoost(boost, target, source, effect) {
			if (effect && effect.id === 'zpower') return;
			let i: BoostID;
			for (i in boost) {
				boost[i]! *= 4;
			}
		},
		onResidual(pokemon) {
			let stats: BoostID[] = [];
			const boost: SparseBoostsTable = {};
			let statPlus: BoostID;
			for (statPlus in pokemon.boosts) {
				if (statPlus === 'evasion') continue;
				if (pokemon.boosts[statPlus] < 6) {
					stats.push(statPlus);
				}
			}
			let randomStat: BoostID | undefined = stats.length ? this.sample(stats) : undefined;
			if (randomStat) boost[randomStat] = 1;

			stats = [];
			let statMinus: BoostID;
			for (statMinus in pokemon.boosts) {
				if (statMinus === 'spa' || statMinus === 'accuracy') continue;
				if (pokemon.boosts[statMinus] > -6 && statMinus !== randomStat) {
					stats.push(statMinus);
				}
			}
			let randomStats: BoostID | undefined = stats.length ? this.sample(stats) : undefined;
			if (randomStats) boost[randomStats] = -1;
			/*if (randomStats[1]) boost[randomStats[1]] = -1;*/

			this.boost(boost, pokemon, pokemon);
		},
		name: "Crouching Defense",
		rating: 2,
	},
	/*-----伊布-----*/
	destinyeve: {
		isPermanent: true,
		isBreakable: false,
		onStart(pokemon) {
			pokemon.addVolatile('dynamax2');
		},
		onImmunity(type, pokemon) {
			if (type === 'frz') return false;
			if (type === 'slp') return false;
			if (type === 'par') return false;
			if (type === 'tox') return false;
			if (type === 'psn') return false;
			if (type === 'brn') return false;
		},
		onModifyMove(move) {
			move.stab = 2;
			delete move.flags['contact'];
		},
		onAnyAfterMove() {
			if (this.p1.active[0].hp < this.p1.active[0].maxhp / 3 && this.p1.active[0].positiveBoosts() < 10)
				this.actions.useMove('extremeevoboost', this.p1.active[0]);
		},
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			if (pokemon.storedStats.atk < 105) pokemon.storedStats.atk = 105;
			if (pokemon.storedStats.spa < 105) pokemon.storedStats.spa = 105;
			if (pokemon.storedStats.def < 90) pokemon.storedStats.def = 90;
			if (pokemon.storedStats.spd < 90) pokemon.storedStats.spd = 90;
		},
		onSourceBasePowerPriority: 18,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (defender.volatiles['tarshot'])
				if (move.type === 'Fire') {
					return this.chainModify(0.75);
				}
		},
		onDamage(damage, target, source, effect) {
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
			if (
				effect.effectType === "Move" &&
				!effect.multihit &&
				!effect.negateSecondary
			) {
				target.abilityState.checkedBerserk = false;
			} else {
				target.abilityState.checkedBerserk = true;
			}
			if (target.side === this.p1) {
				if (damage >= target.maxhp / 4)
					return target.maxhp / 4;
			}
		},
		onTryEatItem(item, pokemon) {
			const healingItems = [
				'aguavberry', 'enigmaberry', 'figyberry', 'iapapaberry', 'magoberry', 'sitrusberry', 'wikiberry', 'oranberry', 'berryjuice',
			];
			if (healingItems.includes(item.id)) {
				return pokemon.abilityState.checkedBerserk;
			}
			return true;
		},
		onAfterMoveSecondary(target, source, move) {
			target.abilityState.checkedBerserk = true;
			if (!source || source === target || !target.hp || !move.totalDamage) return;
			const lastAttackedBy = target.getLastAttackedBy();
			if (!lastAttackedBy) return;
			const damage = move.multihit ? move.totalDamage : lastAttackedBy.damage;
			if (target.hp <= target.maxhp / 3 && target.hp + damage > target.maxhp / 3 && target.positiveBoosts()<10) {
				this.actions.useMove('extremeevoboost', target);
			}
		},
		name: 'Destiny Eve',
		rating: 2,
	},
	/*---------重泥挽马----------*/
	superstamina: {
		isPermanent: true,
		isBreakable: false,
		onStart(pokemon) {
			pokemon.addVolatile('dynamax2');
		},
		onImmunity(type, pokemon) {
			if (type === 'frz') return false;
			if (type === 'slp') return false;
			if (type === 'par') return false;
			if (type === 'tox') return false;
			if (type === 'psn') return false;
			if (type === 'brn') return false;
		},
		onDamagingHit(damage, target, source, effect) {
			if (effect.category === 'Physical') {
				if (target.boosts.def === 6)
					this.boost({ def: -6 }, target, target)
				else {
					if (effect.category === 'Physical')
						this.boost({ def: 1 });
				}
			}
			if (effect.category === 'Special') {
				if (target.boosts.spd === 6)
					this.boost({ spd: -6 }, target, target)
				else {
					this.boost({ spd: 1 });
				}
			}
		},
		onModifyMove(move, pokemon, target) {
			if (move.type === 'Rock') {
				move.volatileStatus = 'smackdown';
			}
		},
		onModifyDamage(relayVar, source, target, move) {
			if (move.type === 'Ground') {
				return this.chainModify((move.basePower + this.turn * 15) / move.basePower);
			}
		},
		name: "Super Stamina",
		rating: 3.5,
		num: 192,
	},
	/*----------大嘴雀-------*/
	possessedbyphoenix: {
		isPermanent: true,
		isBreakable: false,
		onStart(pokemon) {
			pokemon.addVolatile('dynamax2');
		},
		onImmunity(type, pokemon) {
			if (type === 'frz') return false;
			if (type === 'slp') return false;
			if (type === 'par') return false;
			if (type === 'tox') return false;
			if (type === 'psn') return false;
			if (type === 'brn') return false;
		},
		onModifyMove(move) {
			if (move.id === 'sacredfire') move.ignoreAbility = true;
			delete move.flags['contact'];
			move.drain = [1, 2]
			if (move.secondaries) {
				this.debug('doubling secondary chance');
				for (const secondary of move.secondaries) {
					if (secondary.chance) secondary.chance *= 2;
				}
			}
			if (move.self?.chance) move.self.chance *= 2;
		},
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			if (pokemon.storedStats.atk < 105) pokemon.storedStats.atk = 105;
			if (pokemon.storedStats.def < 81) pokemon.storedStats.def = 81;
			if (pokemon.storedStats.spd < 81) pokemon.storedStats.spd = 81;
		},
		onSourceBasePowerPriority: 19,
		onSourceBasePower(basePower, attacker, defender, move) {
			if (move.type === 'Fire' || move.type==='Ice') {
					return this.chainModify(0.5);
			}
		},
		onTryHit(pokemon, target, move) {
			if (move.ohko) {
				this.add('-immune', pokemon, '[from] ability: Sturdy');
				return null;
			}
		},
		onDamagePriority: -30,
		onDamage(damage, target, source, effect) {
			if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move') {
				this.add('-ability', target, 'Sturdy');
				return target.hp - 1;
			}
		},
		onModifyDamage(relayVar, source, target, move) {
			if (move.type === 'Fire') {
				return this.chainModify(1.5);
			}
		},
		onChargeMove(pokemon, target, move) {
			this.debug('Possessed By Phoenix - remove charge turn for ' + move.id);
			this.attrLastMove('[still]');
			this.addMove('-anim', pokemon, move.name, target);
			return false; // skip charge turn
		},
		name: 'Possessed By Phoenix',
		rating: 2,
	},
	/*------others---------*/
	minus: {
		inherit: true,
		onModifySpA(spa, pokemon) {
			const a: Pokemon[] = [];
			for (const allyActive of a.concat(pokemon.allies(), pokemon.foes())) {
				if (allyActive.hasAbility(['minus', 'plus'])) {
					return this.chainModify(1.5);
				}
			}
		},
	},
	plus: {
		inherit: true,
		onModifySpA(spa, pokemon) {
			const a: Pokemon[] = [];
			for (const allyActive of a.concat(pokemon.allies(), pokemon.foes())) {
				if (allyActive.hasAbility(['minus', 'plus'])) {
					return this.chainModify(1.5);
				}
			}
		},
	},
	intimidate: {
		inherit: true,
		onStart(pokemon) {
			let activated = false;
			if (pokemon.side === this.p1) {
				for (const target of pokemon.adjacentFoes().concat(pokemon.adjacentAllies())) {
					if (!activated) {
						this.add('-ability', pokemon, 'Intimidate', 'boost');
						activated = true;
					}
					if (target.volatiles['substitute']) {
						this.add('-immune', target);
					} else {
						this.boost({ atk: -1 }, target, pokemon, null, true);
					}
				}
			} else {
				for (const target of this.p1.active) {
					if (!activated) {
						this.add('-ability', pokemon, 'Intimidate', 'boost');
						activated = true;
					}
					if (target.volatiles['substitute']) {
						this.add('-immune', target);
					} else {
						this.boost({ atk: -1 }, target, pokemon, null, true);
					}
				}
			}
		},
	},
	screencleaner: {
		inherit: true,
		onStart(pokemon) {
			let activated = false;
			for (const sideCondition of ['reflect', 'lightscreen', 'auroraveil', 'eeveelightscreen','eeveereflect']) {
				for (const side of [pokemon.side, ...pokemon.side.foeSidesWithConditions()]) {
					if (side.getSideCondition(sideCondition)) {
						if (!activated) {
							this.add('-activate', pokemon, 'ability: Screen Cleaner');
							activated = true;
						}
						side.removeSideCondition(sideCondition);
					}
				}
			}
		},

	},
}