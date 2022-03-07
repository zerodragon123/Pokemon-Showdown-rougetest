export const Conditions: {[k: string]: ModdedConditionData} = {
	elite: {
		name: 'Elite',
		noCopy: true,
		duration: 0,
		onStart(pokemon) {
			
			const ratio = 2;
			this.add('-activate', pokemon, 'move: elite');
			this.add('-start', pokemon, 'elite');
			pokemon.maxhp = Math.floor(pokemon.maxhp * ratio);
			pokemon.hp = Math.floor(pokemon.hp * ratio);
			this.add('-heal', pokemon, pokemon.getHealth, '[silent]');
			pokemon.storedStats.atk = Math.floor(pokemon.storedStats.atk * 1.5);
			pokemon.storedStats.spa = Math.floor(pokemon.storedStats.spa * 1.5);
		},
	},
	halo: {
		name: 'Halo',
		noCopy: true,
		duration: 0,
		onStart(pokemon) {
			this.add('-activate', pokemon, 'move: halo');
			this.add('-start', pokemon, 'halo');
			pokemon.storedStats.atk = Math.floor(pokemon.storedStats.atk * 1.2);
			pokemon.storedStats.spa = Math.floor(pokemon.storedStats.spa * 1.2);
			pokemon.storedStats.def = Math.floor(pokemon.storedStats.def * 1.2);
			pokemon.storedStats.spd = Math.floor(pokemon.storedStats.spd * 1.2);
			pokemon.storedStats.spe = Math.floor(pokemon.storedStats.spe * 1.2);
		},
	},
	raindance: {
		inherit: true,
		onFieldStart(field, source, effect) {

			if (effect?.effectType === 'Rule' && source.side === this.p2) {
				this.effectState.duration = 0;
			}
			if (effect?.effectType === 'Ability' ) {
				if (this.gen <= 5) this.effectState.duration = 0;
				this.add('-weather', 'RainDance', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-weather', 'RainDance');
			}
			
		},
	},
	sunnyday: {
		inherit: true,
		onFieldStart(field, source, effect) {
			if (effect?.effectType === 'Rule' && source.side === this.p2) {
				this.effectState.duration = 0;
			}
			if (effect?.effectType === 'Ability') {
				if (this.gen <= 5) this.effectState.duration = 0;
				this.add('-weather', 'SunnyDay', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-weather', 'SunnyDay');
			}

		},
	},
	sandstorm: {
		inherit: true,
		onFieldStart(field, source, effect) {
			if (effect?.effectType === 'Rule' && source.side === this.p2) {
				this.effectState.duration = 0;
			}
			if (effect?.effectType === 'Ability') {
				if (this.gen <= 5) this.effectState.duration = 0;
				this.add('-weather', 'Sandstorm', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-weather', 'Sandstorm');
			}

		},
	},
	hail: {
		inherit: true,
		onFieldStart(field, source, effect) {
			if (effect?.effectType === 'Rule' && source.side === this.p2) {
				this.effectState.duration = 0;
			}
			if (effect?.effectType === 'Ability') {
				if (this.gen <= 5) this.effectState.duration = 0;
				this.add('-weather', 'Hail', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-weather', 'Hail');
			}

		},
	},
	focusroom: {
		name: 'Focus Room',
		effectType: 'Weather',
		duration: 0,
	
		onDamage(damage, target, source, effect) {
			if (target.hp === target.maxhp && damage >= target.hp && effect && effect.effectType === 'Move' && target.side===this.p2) {
				if (target.useItem()) {
					return target.hp - 1;
				}
			}
		},
		onFieldStart(battle, source, effect) {
			if (effect?.effectType === 'Ability') {
				this.add('-fieldstart', 'Focus Room', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-fieldstart', 'Focus Room');
			}
			this.add('-message', 'Focus Room is radiated.');
		},
		
		onFieldResidualOrder: 1,
		onFieldEnd() {
			this.add('-fieldend', 'Focus Room');
			this.add('-message', 'The Focus Room subsided.');
		},
	},
	mercyaura: {
		name: 'Mercy Aura',
		effectType: 'Weather',
		duration: 0,
		onEffectivenessPriority: -1,
		onEffectiveness(typeMod, target, type, move) {
			if (target)
				if (target.side === this.p1)
					if (move.type === 'Grass') {
						if (['Fire', 'Bug', 'Poison', 'Steel', 'Dragon', 'Flying'].includes(type)) return 0;
					}
		},
		onFieldStart(battle, source, effect) {
			if (effect?.effectType === 'Ability') {
				this.add('-fieldstart', 'Mercy Aura', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-fieldstart', 'Mercy Aura');
			}
			this.add('-message', 'Mercy Aura is radiated.');
		},
		
		
		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', 'Mercy Aura', '[upkeep]');
			this.eachEvent('Weather');
		},
		onFieldEnd() {
			this.add('-fieldend', 'Mercy Aura');
			this.add('-message', 'The Mercy Aura subsided.');
		},
	},
	ballaura: {
		name: 'Ball Aura',
		effectType: 'Weather',
		duration: 0,
		onEffectivenessPriority: -1,
		onEffectiveness(typeMod, target, type, move) {
			if (target)
				if (target.side === this.p1)
					if (move.type === 'Electric') {
						if (['Ground'].includes(type)) return -1;
					}
		},

		onModifyMove(move, pokemon, target) {
			if (pokemon.side === this.p2)
				if (move.type === 'Electric') {
					move.ignoreImmunity = true;
					move.ignoreAbility = true;
				}

		},

		onFieldStart(battle, source, effect) {
			if (effect?.effectType === 'Ability') {
				this.add('-fieldstart', 'Ball Aura', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-fieldstart', 'Ball Aura');
			}
			this.add('-message', 'Ball Aura is radiated.');


		},

		onWeatherModifyDamage(relayVar: number, source: Pokemon, target: Pokemon, move) {
			if (source.side === this.p2) {
				if (move.type === 'Electric' && this.prng.next(5)===1) {
					if (!target.status) target.setStatus('par', source, move, true);
				}
				return this.chainModify(1.2);
			}
		},

		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', 'Ball Aura', '[upkeep]');
			this.eachEvent('Weather');
		},
		onFieldEnd() {
			this.add('-fieldend', 'Ball Aura');
			this.add('-message', 'The Mercy Aura subsided.');
		},
	},
	dragonsmajesty: {
		name: "Dragon's Majesty",
		effectType: 'Weather',
		duration: 0,
		onEffectivenessPriority: -1,
		


		onTryMove(source, target, move) {
			if (source.side === this.p2 && move.name.toLowerCase() !== 'struggle') {
				let pp = 0, maxpp = 0;
				if (source.hasType('Dragon') && !move.isZ && source.level > 80) {

					for (const eachMove of source.getMoves()) {
						if (eachMove.pp && eachMove.maxpp) {
							if (eachMove.pp < eachMove.maxpp - 1) return;
							pp += eachMove.pp;
							maxpp += eachMove.maxpp
						}
					}

					if (pp >= maxpp - 1) {
						this.attrLastMove('[still]');

						this.actions.useMoveInner('Clangorous Soulblaze', source);
						return null;
					}
				}
			}
		},
		onFieldStart(battle, source, effect) {
			if (effect?.effectType === 'Ability') {
				this.add('-fieldstart', "Dragon's Majesty", '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-fieldstart', "Dragon's Majesty");
			}
			this.add('-message', "Dragon's Majesty is radiated.");
		},
		
		
		

		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', "Dragon's Majesty", '[upkeep]');
			this.eachEvent('Weather');
		},
		onFieldEnd() {
			this.add('-fieldend', "dragon's majesty");
			this.add('-message', "The Dragon's Majesty subsided.");
		},
	},
};
