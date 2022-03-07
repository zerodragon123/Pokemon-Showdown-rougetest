export const Conditions: {[k: string]: ConditionData} = {
	acidrain: {
		name: 'Acid Rain',
		effectType: 'Weather',
		duration: 0,
		onModifyMove(move, target) {
			if (!move.ignoreImmunity) move.ignoreImmunity = {};
			if (move.ignoreImmunity !== true) {
				move.ignoreImmunity['Steel'] = true;
				move.ignoreImmunity['Poison'] = true;
			}
		},
		onWeatherModifyDamage(relayVar: number, source: Pokemon, target: Pokemon, move) {
			if (move.type === 'Poison') {
				if (!target.status) target.setStatus('tox', source, move, true)
				this.debug('Acid Rain Day poison boost');
				return this.chainModify(1.5);
			}
			if (move.type === 'Psychic') {
				this.debug('Acid Rain psychic suppress');
				return this.chainModify(0.5);
			}
		},
		onFieldStart(battle, source, effect) {
			if (effect?.effectType === 'Ability') {
				this.add('-weather', 'Acid Rain', '[from] ability: ' + effect, '[of] ' + source);
			} else {
				this.add('-weather', 'Acid Rain');
			}
			this.add('-message', 'Acid Rain began to fall.');
		},
		onFieldResidualOrder: 1,
		onFieldResidual() {
			this.add('-weather', 'Acid Rain', '[upkeep]');
			if (this.field.isWeather('acidrain')) this.eachEvent('Weather');
		},
		onWeather(target) {
			if (!target.hasType('Poison')) {
				this.damage(target.baseMaxhp / 8);
				this.add('-message', 'The Acid Rain hurt the Pokemon.');
			}
		},
		onFieldEnd() {
			this.add('-weather', 'none');
			this.add('-message', 'The Acid Rain subsided.');
		},
	},
	mercyaura: {
		name: 'Mercy Aura',
		effectType: 'Weather',
		duration: 0,
		onEffectivenessPriority: -1,
		onEffectiveness(typeMod, target, type, move) {
			if (move.type === 'Grass') {
				if (['Fire', 'Bug', 'Poison', 'Steel', 'Dragon', 'Flying'].includes(type)) return 1;
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
		onSetStatus(status, target, source, effect) {
			if ((effect as Move)?.status && target.hasType('Grass')) {
				this.add('-immune', target);
			}
			return false;
		},
		onTryAddVolatile(status, target) {
			if (status.id === 'yawn' && target.hasType('Grass')) 
			{
				this.add('-immune', target);
				return null;
			}
		},
		onFieldResidualOrder: 1,
		onFieldEnd() {
			this.add('-fieldend', 'Mercy Aura');
			this.add('-message', 'The Mercy Aura subsided.');
		},
	},
	ballaura: {
		name: 'Ball Aura',
		effectType: 'Weather',
		duration: 5,
		onEffectivenessPriority: -1,
		onEffectiveness(typeMod, target, type, move) {
			if (move.type === 'Electric') {
				if (['Ground'].includes(type)) return 0;
			}
		},
		onModifyMove(move, pokemon, target) {
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
		onWeatherModifyDamage(relayVar: number, source: Pokemon, target: Pokemon, move){
			if (move.type === 'Electric') {
				if (!target.status) target.setStatus('par', source, move, true);
			}
			if(move.type === 'Ground') return this.chainModify(0.5);
			return this.chainModify(1);
		},
		onFieldResidualOrder: 1,
		onFieldEnd() {
			this.add('-fieldend', 'Ball Aura');
			this.add('-message', 'The Ball Aura subsided.');
		},
	},
	dragonsmajesty: {
		name: "Dragon's Majesty",
		effectType: 'Weather',
		duration: 999,
		onEffectivenessPriority: -1,
		onEffectiveness(typeMod, target, type, move) {
			if (move.type === 'Dragon') {
				if (['Fairy'].includes(type)) return 0;
			}
		},
		onSetStatus(status, target, source, effect) {
			if (target.hasType('Dragon')) {
				if (status.id === 'slp'  && !target.isSemiInvulnerable()) {
					if (effect.id === 'yawn' || (effect.effectType === 'Move' && !effect.secondaries)) {
						this.add('-activate', target, "move: Dragon's Majesty");
					}
					return false;
				}
			}
		},
		onModifyMove(move, pokemon, target) {
			if (move.type === 'Dragon') {
				move.ignoreImmunity = true;				
			}
			if (move.id === 'clangoroussoulblaze') { 
				move.ignoreAbility = true;
			}
		},
		onTryMove(source, target, move) {
			let pp = 0, maxpp = 0;
			if (source.hasType('Dragon') && !move.isZ && source.level > 80) {
				for (const eachMove of source.getMoves()) {
					if (eachMove.pp && eachMove.maxpp) {
						if (eachMove.pp < eachMove.maxpp - 1) return;
						pp += eachMove.pp;
						maxpp += eachMove.maxpp;
					}
				}
				if (pp >= maxpp - 1) {
					this.attrLastMove('[still]');
					this.actions.useMoveInner('Clangorous Soulblaze', source);
					return null;
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
		onWeatherModifyDamage(relayVar: number, source: Pokemon, target: Pokemon, move) {
		},
		onBoost(boost, target, source, effect) {
			if (source && target === source) return;
			if (!(target.hasType('Dragon'))) return;
			let showMsg = false;
			let i: BoostID;
			for (i in boost) {
				if (boost[i]! < 0) {
					delete boost[i];
					showMsg = true;
				}
			}
			if (showMsg && !(effect as ActiveMove).secondaries && effect.id !== 'octolock') {
				this.add("-fail", target, "unboost", "[from] weather: Dragon's Majesty", "[of] " + target);
			}
		},
		onDamage(damage, target, source, effect) {
			if (!(target.hasType('Dragon'))) return;
			if (effect.effectType !== 'Move') {
				if (effect.effectType === 'Ability') this.add('-activate', source, 'ability: ' + effect.name);
				return false;
			}
		},
		onFieldResidualOrder: 1,
		onFieldEnd() {
			this.add('-fieldend', "dragon's majesty");
			this.add('-message', "The Dragon's Majesty subsided.");
		},
	},
};