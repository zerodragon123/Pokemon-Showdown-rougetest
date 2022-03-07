export const Moves: { [k: string]: ModdedMoveData } = {
	/*-----椰蛋树------*/
	totemexeggutorattack: {
		/*num: 118,*/
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Totem Exeggutor Attack",
		pp: 160,
		priority: 0,
		multihit: 3,
		flags: {},
		onHit(target, source, effect) {
			const validTargets = this.sides.slice(1).map(side => side.active[0]).filter(pokemon => !pokemon.fainted);
			if (validTargets.length > 0) {
				this.actions.useMove(
					this.prng.sample(['totemleafstorm', 'totemdracometeor', 'totemflamethrower']),
					this.p1.active[0],
					this.prng.sample(validTargets)
				);
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
		contestType: "Cute",
	},
	totemleafstorm: {
		/*num: 437,*/
		accuracy: 100,
		basePower: 130,
		category: "Special",
		name: "Totem Leaf Storm",
		pp: 15,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Leaf Storm', target);
		},
		flags: { protect: 1, mirror: 1 },
		onHit(target) {
			target.clearBoosts();
			this.add('-clearboost', target);
		},
		//secondary: {
		//	chance: 100,
		//	boosts: {
		//		spe: -1,
		//	},
		//},

		target: "normal",
		type: "Grass",
		contestType: "Beautiful",
	},
	totemdracometeor: {
		/*num: 434,*/
		accuracy: 100,
		basePower: 130,
		category: "Special",
		name: "Totem Draco Meteor",
		pp: 15,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Draco Meteor', target);
		},
		flags: { protect: 1, mirror: 1 },
		secondary: {
			chance: 100,
			boosts: {
				atk: -1,
			},
		},

		target: "normal",
		type: "Dragon",
		contestType: "Beautiful",
	},
	totemflamethrower: {
		/*num: 53,*/
		accuracy: 100,
		basePower: 90,
		category: "Special",
		name: "Totem Flamethrower",
		pp: 15,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Flamethrower', target);
		},
		flags: { protect: 1, mirror: 1 },
		weather: 'sunnyday',
		secondary: {
			chance: 30,
			status: 'brn',
		},

		target: "normal",
		type: "Fire",
		contestType: "Beautiful",
	},
	/*-----火蛾------*/
	totemvolcaronaattack: {
		/*num: 118,*/
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Totem Volcarona Attack",
		pp: 160,
		priority: 0,
		multihit: 3,
		flags: {},
		onHit(target, source, effect) {
			const validTargets = this.sides.slice(1).map(side => side.active[0]).filter(pokemon => !pokemon.fainted);
			if (validTargets.length > 0) {
				this.actions.useMove(
					this.prng.sample(['totemheatwave', 'totembugbuzz', 'totemscorchingsands']),
					this.p1.active[0],
					this.prng.sample(validTargets)
				);
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
		contestType: "Cute",
	},
	totemheatwave: {
		/*num: 463,*/
		accuracy: 100,
		basePower: 115,
		category: "Special",
		name: "Totem Heat Wave",
		pp: 5,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Heat Wave');
		},
		weather: 'sunnyday',
		secondary: null,
		target: "allAdjacent",
		type: "Fire",

	},
	totembugbuzz: {
		/*num: 405,*/
		accuracy: 100,
		basePower: 120,
		category: "Special",
		name: "Totem Bug Buzz",
		pp: 10,
		priority: 0,
		flags: { protect: 1, mirror: 1, sound: 1, authentic: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target) {
			target.clearBoosts();
			this.add('-clearboost', target);
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Bug Buzz', target);
		},
		target: "normal",
		type: "Bug",
		contestType: "Beautiful",
	},
	totemscorchingsands: {
		/*num: 414,*/
		accuracy: 100,
		basePower: 100,
		category: "Special",
		name: "Totem Scorching Sands",
		pp: 10,
		priority: 0,
		flags: { protect: 1, mirror: 1, nonsky: 1 },
		onTryMove() {
			this.attrLastMove('[still]');
		},
		secondary: {
			chance: 30,
			status: 'brn',
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Scorching Sands', target);
		},
		target: "normal",
		type: "Ground",
		contestType: "Beautiful",
	},
	/*-----飞鱼-------*/
	totemmantineattack: {
		/*num: 118,*/
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Totem Mantine Attack",
		pp: 160,
		priority: 0,
		multihit: 3,
		flags: {},
		onHit(target, source, effect) {
			const validTargets = this.sides.slice(1).map(side => side.active[0]).filter(pokemon => !pokemon.fainted);
			if (validTargets.length > 0) {
				this.actions.useMove(
					this.prng.sample(['totemhydropump', 'totemhurricane', 'totemicebeam']),
					this.p1.active[0],
					this.prng.sample(validTargets)
				);
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
		contestType: "Cute",
	},
	totemhydropump: {
		/*num: 437,*/
		accuracy: 100,
		basePower: 130,
		category: "Special",
		name: "Totem Hydro Pump",
		pp: 15,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hydro Pump', target);
		},
		flags: { protect: 1, mirror: 1 },
		weather: 'raindance',
		//secondary: {
		//	chance: 100,
		//	boosts: {
		//		spe: -1,
		//	},
		//},
		target: "normal",
		type: "Water",
		contestType: "Beautiful",
	},
	totemhurricane: {
		/*num: 437,*/
		accuracy: 100,
		basePower: 130,
		category: "Special",
		name: "Totem Hurricane",
		pp: 15,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Hurricane', target);
		},
		flags: { protect: 1, mirror: 1 },
		forceSwitch: true,
		target: "normal",
		type: "Flying",
		contestType: "Beautiful",
	},
	totemicebeam: {
		/*num: 53,*/
		accuracy: 100,
		basePower: 90,
		category: "Special",
		name: "Totem Ice Beam",
		pp: 15,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Ice Beam', target);
		},
		flags: { protect: 1, mirror: 1 },
		secondary: {
			chance: 100,
			boosts: {
				spe: -1,
			},
		},
		target: "normal",
		type: "Ice",
		contestType: "Beautiful",
	},
	/*----心蝙蝠-----*/
	totemswoobatattack: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Totem Swoobat Attack",
		pp: 160,
		priority: 0,
		multihit: 3,
		flags: {},
		onModifyMove(move, pokemon, target) {
			if (pokemon.positiveBoosts() >= 4 && this.prng.sample([1, 0])===1)
				move.multihit = 1;
		},
		onHit(target, source, effect) {
			const validTargets = this.sides.slice(1).map(side => side.active[0]).filter(pokemon => !pokemon.fainted);
			let moves = source.boosts.spa < 6 ? ['totembatflamethrower', 'totemaircutter', 'calmmind'] : ['totembatflamethrower', 'totemaircutter'];
			if (effect.multihit === 1) moves = ['totemstoredpower'];
			if (validTargets.length > 0) {
				this.actions.useMove(
					this.prng.sample(moves),
					this.p1.active[0],
					this.prng.sample(validTargets)
				);
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
		contestType: "Cute",
	},
	totembatflamethrower: {
		num: 257,
		accuracy: 100,
		basePower: 100,
		category: "Special",
		name: "Totem Bat Flamethrower",
		pp: 10,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		secondaries: [{
			chance: 20,
			status: 'brn',
		}, {
			chance: 100,
			self: {
				boosts: {
					def: 1,
				},
			},
		}],

		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Flamethrower', target);
		},
		target: "normal",
		type: "Fire",
		contestType: "Beautiful",
	},
	totemaircutter: {
		/*num: 314,*/
		accuracy: 100,
		basePower: 75,
		category: "Special",
		name: "Totem Air Cutter",
		pp: 25,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		critRatio: 2,
		secondary: null,
		self: {
			boosts: {
				spe: 1,
			},
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Air Cutter');
		},
		target: "allAdjacent",
		type: "Flying",
		contestType: "Cool",
	},
	totemstoredpower: {
		/*num: 500,*/
		accuracy: 100,
		basePower: 80,
		basePowerCallback(pokemon, target, move) {
			return move.basePower + 10 * pokemon.positiveBoosts();
		},
		category: "Special",
		name: "Totem Stored Power",
		pp: 20,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		secondary: null,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Stored Power');
		},
		onEffectiveness(typeMod, target, type) {
			if (type === 'Dark') return -1;
		},
		ignoreImmunity: true,
		target: "allAdjacent",
		type: "Psychic",
		zMove: { basePower: 160 },
		maxMove: { basePower: 130 },
		contestType: "Clever",
	},
	/*---伊布---*/
	totemeeveeattack: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Totem Eevee Attack",
		pp: 160,
		priority: 0,
		multihit: 4,
		flags: {},
		onModifyMove(move, pokemon, target) {
			if (pokemon.hp <= pokemon.maxhp / 3) {
				move.multihit = 2;
				move.priority = 1;
			}
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target, source, effect) {
			const validTargets = this.sides.slice(1).map(side => side.active[0]).filter(pokemon => !pokemon.fainted);
			const moves = source.hp <= source.maxhp / 3 ? ['eeveelastresort'] : ['baddybad', 'glitzyglow', 'buzzybuzz', 'bouncybubble', 'freezyfrost', 'sappyseed', 'sizzlyslide', 'sparklyswirl', 'veeveevolley'];

			if (validTargets.length > 0) {
				this.actions.useMove(
					this.prng.sample(moves),
					this.p1.active[0],
					this.prng.sample(validTargets)
				);
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
		contestType: "Cute",
	},
	eeveelastresort: {
		num: 387,
		accuracy: 100,
		basePower: 140,
		category: "Physical",
		name: "Eevee Last Resort",
		pp: 5,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1 },
		onEffectiveness(typeMod, target, type) {
			return 0;
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Last Resort', target);
		},
		ignoreImmunity: true,
		ignoreAbility: true,
		secondary: null,
		target: "normal",
		type: "Normal",
		contestType: "Cute",
	},
	baddybad: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
		self: {
			sideCondition: 'eeveereflect',
		},
	},
	glitzyglow: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
		self: {
			sideCondition: 'eeveelightscreen',
		},
	},
	bouncybubble: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
		drain: [3, 2],

		onDamage(damage, target, source) {
			if (source.hp === source.maxhp && source.positiveBoosts() <= 6)
				this.boost({
					def: 1,
					spd: 1
				}, source);
		},
	},
	buzzybuzz: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
	},
	freezyfrost: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
		onHit(target, source) {

			this.add('-clearallboost');
			for (const pokemon of this.getAllActive().filter(pokemon => pokemon.side !== this.p1)) {
				pokemon.clearBoosts();
			}
		},
	},
	sappyseed: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
		onHit(target, source) {
			for (const pokemon of this.getAllActive().filter(pokemon => pokemon.side !== this.p1)) {
				if (pokemon.hasType('Grass')) continue;
				pokemon.addVolatile('leechseed', source);
			}
		},
	},
	sizzlyslide: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
	},
	sparklyswirl: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
		infiltrates: true,
		self: undefined,
		onHit(target, source) {
			for (const pokemon of this.getAllActive().filter(pokemon => pokemon.side !== this.p1)) {
				if (pokemon.volatiles['protect'] || pokemon.volatiles['kingsshield'] || pokemon.volatiles['endure'])
					this.boost({ atk: -2, spa: -2, spe: -2 }, pokemon, source, null, true);
				this.directDamage(1, pokemon, source);
			}
		},
	},
	veeveevolley: {
		accuracy: 100,
		basePower: 130,
		inherit: true,
		basePowerCallback() {
			return 130;
		},
		ignoreImmunity: true,
		ignoreEvasion: true,
		ignoreDefensive: true,
		ignoreAbility: true,
	},
	/*---重泥挽马---*/
	totemmudsdaleattack: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Totem Mudsdale Attack",
		pp: 160,
		priority: 0,
		multihit: 3,
		flags: {},
		
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target, source, effect) {
			const validTargets = this.sides.slice(1).map(side => side.active[0]).filter(pokemon => !pokemon.fainted);

			const moves = target.volatiles['chargeready'] ? ['earthquake', 'rockslide', 'totemhighhorsepower']:['earthquake', 'rockslide', 'totemhighhorsepower', 'chargeready'];

			if (validTargets.length > 0) {
				this.actions.useMove(
					this.prng.sample(moves),
					this.p1.active[0],
					this.prng.sample(validTargets)
				);
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
		contestType: "Cute",
	},
	chargeready:{
		name: 'Charge Ready',
		accuracy: true,
		basePower: 0,
		pp: 20,
		category: 'Status',
		target: 'self',
		type: 'Normal',
		priority: 0,
		flags: {},
		volatileStatus: 'chargeready',
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'charge', target);
		},
		condition: {
			duration: 2,
			onStart(target) {
				this.add('-start', target, 'chargeready');
			},
			onModifyPriorityPriority: 100,
			onModifyPriority() {
				return 1;
			},
			onEnd(target) {
				this.add('-end', target, 'chargeready');
			},
		},
	},
	totemhighhorsepower: {
		num: 667,
		accuracy: 100,
		basePower: 95,
		category: "Physical",
		name: "Totem High Horsepower",
		pp: 10,
		priority: 0,
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onPrepareHit(target, source) {
			this.add('-anim', source, 'High Horsepower', target);
		},
		onHit(target, source, effect) {
			this.boost(this.prng.sample([{ spa: -1 }, { atk: -1 }, { def: -1 }, { spd: -1 }, { spe: -1 }]), target);
		},
		flags: { contact: 1, protect: 1, mirror: 1 },
		secondary: null,
		target: "normal",
		type: "Ground",
		contestType: "Tough",
	},
	/*----------大嘴雀-------*/
	totemfearowattack: {
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "Totem Fearow Attack",
		pp: 160,
		priority: 0,
		multihit: 3,
		flags: {},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target, source, effect) {
			const validTargets = this.sides.slice(1).map(side => side.active[0]).filter(pokemon => !pokemon.fainted);

			const moves = ['totemmindblown', 'skyattack', 'totemfacade', 'sacredfire'];

			if (validTargets.length > 0) {
				this.actions.useMove(
					this.prng.sample(moves),
					this.p1.active[0],
					this.prng.sample(validTargets)
				);
			}
		},
		secondary: null,
		target: "self",
		type: "Normal",
		contestType: "Cute",
	},
	totemmindblown: {
		/*num: 720,*/
		accuracy: 100,
		basePower: 150,
		category: "Physical",
		name: "Totom Mind Blown",
		pp: 5,
		priority: 0,
		flags: { protect: 1, mirror: 1 },
		//mindBlownRecoil: true,
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Mind Blown');
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onAfterMove(pokemon, target, move) {
			this.damage(pokemon.baseMaxhp/2, pokemon, pokemon, this.dex.conditions.get('Mind Blown'),true);
		},
		onEffectiveness(typeMod, target, type) {
			if (typeMod < 0) return 0;
		},
		secondary: null,
		target: "allAdjacent",
		type: "Fire",
		contestType: "Cool",
	},
	totemfacade: {
		num: 263,
		accuracy: 100,
		basePower: 140,
		category: "Physical",
		name: "Totem Facade",
		pp: 20,
		priority: 0,
		flags: { contact: 1, protect: 1, mirror: 1 },
		onPrepareHit(target, source) {
			this.add('-anim', source, 'Facade', target);
		},
		onTryMove() {
			this.attrLastMove('[still]');
		},
		onHit(target, source) {
			for (const pokemon of this.getAllActive().filter(pokemon => pokemon.side !== this.p1)) {
				this.boost({ spe: -1 }, pokemon);
			}
		},
		secondary: null,
		target: "normal",
		type: "Normal",
		contestType: "Cute",
	},
	/*-----others--------*/
	lightscreen: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('lightclay')) {
					return 8;
				}
				return 5;
			},
			onAnyModifyDamage(damage, source, target, move) {
				if (!target.volatiles['dynamax2'] && this.getCategory(move) === 'Special') {
					if (!target.getMoveHitData(move).crit && !move.infiltrates) {
						this.debug('Light Screen weaken');
						if (this.activePerHalf > 1) return this.chainModify([2732, 4096]);
						return this.chainModify(0.5);
					}
				}
			},
			onSideStart(side) {
				this.add('-sidestart', side, 'move: Light Screen');
			},
			onSideResidualOrder: 26,
			onSideResidualSubOrder: 2,
			onSideEnd(side) {
				this.add('-sideend', side, 'move: Light Screen');
			},
		},
	},
	reflect: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('lightclay')) {
					return 8;
				}
				return 5;
			},
			onAnyModifyDamage(damage, source, target, move) {
				if (!target.volatiles['dynamax2'] && this.getCategory(move) === 'Physical') {
					if (!target.getMoveHitData(move).crit && !move.infiltrates) {
						this.debug('Reflect weaken');
						if (this.activePerHalf > 1) return this.chainModify([2732, 4096]);
						return this.chainModify(0.5);
					}
				}
			},
			onSideStart(side) {
				this.add('-sidestart', side, 'Reflect');
			},
			onSideResidualOrder: 26,
			onSideResidualSubOrder: 1,
			onSideEnd(side) {
				this.add('-sideend', side, 'Reflect');
			},
		},
	},
	auroraveil: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasItem('lightclay')) {
					return 8;
				}
				return 5;
			},
			onAnyModifyDamage(damage, source, target, move) {
				if (target !== source && this.effectState.target.hasAlly(target) && !target.volatiles['dynamax2']) {
					if ((target.side.getSideCondition('reflect') && this.getCategory(move) === 'Physical') ||
						(target.side.getSideCondition('lightscreen') && this.getCategory(move) === 'Special')) {
						return;
					}
					if (!target.getMoveHitData(move).crit && !move.infiltrates) {
						this.debug('Aurora Veil weaken');
						if (this.activePerHalf > 1) return this.chainModify([2732, 4096]);
						return this.chainModify(0.5);
					}
				}
			},
			onSideStart(side) {
				this.add('-sidestart', side, 'move: Aurora Veil');
			},
			onSideResidualOrder: 26,
			onSideResidualSubOrder: 10,
			onSideEnd(side) {
				this.add('-sideend', side, 'move: Aurora Veil');
			},
		},
	},
	gearup: {
		inherit: true,
		onHitSide(side, source, move) {

			const targets = side.allies().concat(side.foes()).filter(target => (
				target.hasAbility(['plus', 'minus']) &&
				(!target.volatiles['maxguard'] || this.runEvent('TryHit', target, source, move))
			));
			if (!targets.length) return false;
			let didSomething = false;
			for (const target of targets) {
				didSomething = this.boost({ atk: 1, spa: 1 }, target, source, move, false, true) || didSomething;
			}
			return didSomething;
		},

	},
	magneticflux: {
		inherit: true,
		onHitSide(side, source, move) {
			const targets = side.allies().concat(side.foes()).filter(ally => (
				ally.hasAbility(['plus', 'minus']) &&
				(!ally.volatiles['maxguard'] || this.runEvent('TryHit', ally, source, move))
			));
			if (!targets.length) return false;

			let didSomething = false;
			for (const target of targets) {
				didSomething = this.boost({ def: 1, spd: 1 }, target, source, move, false, true) || didSomething;
			}
			return didSomething;
		},
	},
	grudge: {
		inherit: true,
		condition: {
			onStart(pokemon) {
				this.add('-singlemove', pokemon, 'Grudge');
			},
			onFaint(target, source, effect) {
				if (!source || source.fainted || !effect) return;
				if (effect.effectType === 'Move' && !effect.isFutureMove && source.lastMove) {
					let move: Move = source.lastMove;
					if (move.isMax && move.baseMove) move = this.dex.moves.get(move.baseMove);
					if (source.volatiles['dynamax2']) {
						this.add('-hint', "Dynamaxed Pokémon are immune to grudge.");
						return;
					}
					for (const moveSlot of source.moveSlots) {
						if (moveSlot.id === move.id) {
							moveSlot.pp = 0;
							this.add('-activate', source, 'move: Grudge', move.name);
						}
					}
				}
			},
			onBeforeMovePriority: 100,
			onBeforeMove(pokemon) {
				this.debug('removing Grudge before attack');
				pokemon.removeVolatile('grudge');
			},
		},
	},
	destinybond: {
		inherit: true,
		condition: {
			onStart(pokemon) {
				this.add('-singlemove', pokemon, 'Destiny Bond');
			},
			onFaint(target, source, effect) {
				if (!source || !effect || target.isAlly(source)) return;
				if (effect.effectType === 'Move' && !effect.isFutureMove) {
					if (source.volatiles['dynamax'] || source.volatiles['dynamax2']) {
						this.add('-hint', "Dynamaxed Pokémon are immune to Destiny Bond.");
						return;
					}
					this.add('-activate', target, 'move: Destiny Bond');
					source.faint();
				}
			},
			onBeforeMovePriority: -1,
			onBeforeMove(pokemon, target, move) {
				if (move.id === 'destinybond') return;
				this.debug('removing Destiny Bond before attack');
				pokemon.removeVolatile('destinybond');
			},
			onMoveAborted(pokemon, target, move) {
				pokemon.removeVolatile('destinybond');
			},
		},
	},
	followme: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(target, source, effect) {
				if (effect?.id === 'zpower') {
					this.add('-singleturn', target, 'move: Follow Me', '[zeffect]');
				} else {
					this.add('-singleturn', target, 'move: Follow Me');
				}
			},
			onFoeRedirectTargetPriority: 1,
			onFoeRedirectTarget(target, source, source2, move) {
				if (!this.effectState.target.isSkyDropped() && this.validTarget(this.effectState.target, source, move.target)) {
					if (move.smartTarget) move.smartTarget = false;
					this.debug("Follow Me redirected target of move");
					return this.effectState.target;
				}
			},

			onAllyRedirectTarget(target, source, source2, move) {
				if (this.effectState.target.side === this.p3)
					if (!this.effectState.target.isSkyDropped() && this.validTarget(this.effectState.target, source, move.target)) {
						if (move.smartTarget) move.smartTarget = false;
						this.debug("Follow Me redirected target of move");
						return this.effectState.target;
					}
			},
		},

	},
	spotlight: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(pokemon) {
				this.add('-singleturn', pokemon, 'move: Spotlight');
			},
			onFoeRedirectTargetPriority: 2,
			onFoeRedirectTarget(target, source, source2, move) {
				if (this.validTarget(this.effectState.target, source, move.target)) {
					this.debug("Spotlight redirected target of move");
					return this.effectState.target;
				}
			},

			onAllyRedirectTarget(target, source, source2, move) {
				if (this.effectState.target.side === this.p3)
					if (!this.effectState.target.isSkyDropped() && this.validTarget(this.effectState.target, source, move.target)) {
						if (move.smartTarget) move.smartTarget = false;
						this.debug("Spotlight redirected target of move");
						return this.effectState.target;
					}
			},
		},

	},
	howl: {
		inherit: true,
		onTryMove(pokemon, target, move) {
			if (pokemon.side === this.p2 || pokemon.side === this.p4)
				this.boost({ atk: 1 }, this.p3!.active[0], pokemon, move, false, true);
			else {
				this.boost({ atk: 1 }, this.p2.active[0], pokemon, move, false, true);
				this.boost({ atk: 1 }, this.p4!.active[0], pokemon, move, false, true);
			}
		},
	},
	junglehealing: {
		inherit: true,
		target: 'all',
		onHit(pokemon) {
			if (pokemon.volatiles['dynamax2']) return null;
			const success = !!this.heal(this.modify(pokemon.maxhp, 0.25));
			return pokemon.cureStatus() || success;
		},
	},
	lifedew: {
		inherit: true,
		onTryMove(pokemon, target, move) {
			if (pokemon.side === this.p2 || pokemon.side === this.p4)
				this.heal(this.modify(this.p3!.active[0].maxhp, 0.25), this.p3!.active[0]);
			else {
				this.heal(this.modify(this.p2.active[0].maxhp, 0.25), this.p2.active[0]);
				this.heal(this.modify(this.p4!.active[0].maxhp, 0.25), this.p4!.active[0]);
			}
		},
	},
	helpinghand: {
		inherit: true,
		target: 'normal',
	},
	coaching: {
		inherit: true,
		target: 'normal',
	},
	aromaticmist: {
		inherit: true,
		target: 'normal',
	},
	sleeptalk: {
		inherit: true,
		onHit(pokemon) {
			const noSleepTalk = [
				'assist', 'beakblast', 'belch', 'bide', 'celebrate', 'chatter', 'copycat', 'dynamaxcannon', 'focuspunch', 'mefirst', 'metronome', 'mimic', 'mirrormove', 'naturepower', 'shelltrap', 'sketch', 'sleeptalk', 'uproar',
			];
			const moves = [];
			for (const moveSlot of pokemon.moveSlots) {
				const moveid = moveSlot.id;
				if (!moveid) continue;
				const move = this.dex.moves.get(moveid);
				if (noSleepTalk.includes(moveid) || move.flags['charge'] || (move.isZ && move.basePower !== 1)) {
					continue;
				}
				moves.push(moveid);
			}
			let randomMove = '';
			if (moves.length) randomMove = this.sample(moves);
			if (!randomMove) {
				return false;
			}
			if (this.dex.moves.get(randomMove).target === 'normal' || this.dex.moves.get(randomMove).target === 'adjacentFoe' || this.dex.moves.get(randomMove).target === 'any')
				this.actions.useMove(randomMove, pokemon, this.p1.active[0]);
			else
				this.actions.useMove(randomMove, pokemon);
		},
	},
	mist: {
		inherit: true,
		condition: {
			duration: 5,
			onBoost(boost, target, source, effect) {
				if (effect.effectType === 'Move' && effect.infiltrates) return;
				if (source && target !== source) {
					let showMsg = false;
					let i: BoostID;
					for (i in boost) {
						if (boost[i]! < 0) {
							delete boost[i];
							showMsg = true;
						}
					}
					if (showMsg && !(effect as ActiveMove).secondaries) {
						this.add('-activate', target, 'move: Mist');
					}
				}
			},
			onSideStart(side) {
				this.add('-sidestart', side, 'Mist');
			},
			onSideResidualOrder: 26,
			onSideResidualSubOrder: 4,
			onSideEnd(side) {
				this.add('-sideend', side, 'Mist');
			},
		},
	},
	safeguard: {
		inherit: true,
		condition: {
			duration: 5,
			durationCallback(target, source, effect) {
				if (source?.hasAbility('persistent')) {
					this.add('-activate', source, 'ability: Persistent', effect);
					return 7;
				}
				return 5;
			},
			onSetStatus(status, target, source, effect) {
				if (!effect || !source) return;
				if (effect.id === 'yawn') return;
				if (effect.effectType === 'Move' && effect.infiltrates && !target.isAlly(source)) return;
				if (target !== source) {
					this.debug('interrupting setStatus');
					if (effect.id === 'synchronize' || (effect.effectType === 'Move' && !effect.secondaries)) {
						this.add('-activate', target, 'move: Safeguard');
					}
					return null;
				}
			},
			onTryAddVolatile(status, target, source, effect) {
				if (!effect || !source) return;
				if (effect.effectType === 'Move' && effect.infiltrates) return;
				if ((status.id === 'confusion' || status.id === 'yawn') && target !== source) {
					if (effect.effectType === 'Move' && !effect.secondaries) this.add('-activate', target, 'move: Safeguard');
					return null;
				}
			},
			onSideStart(side) {
				this.add('-sidestart', side, 'Safeguard');
			},
			onSideResidualOrder: 26,
			onSideResidualSubOrder: 3,
			onSideEnd(side) {
				this.add('-sideend', side, 'Safeguard');
			},
		},
	},
	afteryou: {
		num: 495,
		accuracy: true,
		basePower: 0,
		category: "Status",
		name: "After You",
		pp: 15,
		priority: 0,
		flags: { authentic: 1, mystery: 1 },
		onHit(target) {
			if (target.side.active.length < 2 && this.gameType !== 'multi') return false; // fails in singles
			const action = this.queue.willMove(target);
			if (action) {
				this.queue.prioritizeAction(action);
				this.add('-activate', target, 'move: After You');
			} else {
				return false;
			}
		},
		secondary: null,
		target: "normal",
		type: "Normal",
		zMove: { boost: { spe: 1 } },
		contestType: "Cute",
	},
	tailwind: {
		inherit: true,
		condition: {
			duration: 4,
			durationCallback(target, source, effect) {
				if (source?.hasAbility('persistent')) {
					this.add('-activate', source, 'ability: Persistent', effect);
					return 6;
				}
				return 4;
			},
			onSideStart(side) {
				this.add('-sidestart', side, 'move: Tailwind');
				this.add('-sidestart', side.foe, 'move: Tailwind');
			},
			onAnyModifySpe(spe, pokemon) {
				if (!pokemon.volatiles['dynamax2'])
					return this.chainModify(2);
				else
					return;
			},
			onSideResidualOrder: 26,
			onSideResidualSubOrder: 5,
			onSideEnd(side) {
				this.add('-sideend', side, 'move: Tailwind');
				this.add('-sideend', side.foe, 'move: Tailwind');
			},
		},
	},
	ragepowder: {
		inherit: true,
		condition: {
			duration: 1,
			onStart(pokemon) {
				this.add('-singleturn', pokemon, 'move: Rage Powder');
			},
			onFoeRedirectTargetPriority: 1,
			onFoeRedirectTarget(target, source, source2, move) {
				const ragePowderUser = this.effectState.target;
				if (ragePowderUser.isSkyDropped()) return;

				if (source.runStatusImmunity('powder') && this.validTarget(ragePowderUser, source, move.target)) {
					if (move.smartTarget) move.smartTarget = false;
					this.debug("Rage Powder redirected target of move");
					return ragePowderUser;
				}

			},
			onAllyRedirectTarget(target, source, source2, move) {
				if (this.effectState.target.side === this.p3)
					if (source.runStatusImmunity('powder') && this.validTarget(this.effectState.target, source, move.target)) {
						if (move.smartTarget) move.smartTarget = false;
						this.debug("Follow Me redirected target of move");
						return this.effectState.target;
					}
			},
		},
	},
	acupressure: {
		inherit: true,
		target: 'self',
	},
	imprison: {
		inherit: true,
		volatileStatus: undefined,
		condition: undefined,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用封印');
			return false;
		}
	},
	metronome: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用摇手指');
			return false;
		},
		onHit() {
		},
	},
	quickguard: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用快速防守');
			return false;
		},
		onHitSide(side, source) {

		},
		condition: {},
	},
	wideguard: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用广域防守');
			return false;
		},
		onHitSide(side, source) {
		},
		condition: {},
	},
	matblock: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用掀榻榻米');
			return false;
		},
		condition: {},
	},
	aromatherapy: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用芳香治疗');
			return false;
		},
		onHit() { },
	},
	healbell: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用治愈铃声');
			return false;
		},
		onHit() { },
	},
	waterpledge: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用誓约技能');
			return false;
		},
		onPrepareHit() {
		},
	},
	grasspledge: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用誓约技能');
			return false;
		},
		onPrepareHit() {
		},
	},
	firepledge: {
		inherit: true,
		onTryHit(pokemon) {
			this.add('message', '在boss气场下你不能使用誓约技能');
			return false;
		},
		onPrepareHit() {
		},
	},
}