export const Items: { [k: string]: ModdedItemData } = {
	/*---------椰子----------*/
	goldencustapberry: {
		name: "Golden Custap Berry",
		spritenum: 86,
		isBerry: true,
		naturalGift: {
			basePower: 100,
			type: "Ghost",
		},
		onFractionalPriorityPriority: -2,
		onFractionalPriority(priority, pokemon) {
			if (
				priority <= 0 &&
				(pokemon.hp <= pokemon.maxhp)
			) {
				if (pokemon.eatItem()) {
					this.add('-activate', pokemon, 'item: Golden Custap Berry', '[consumed]');
					return 0.1;
				}
			}
		},
		onEat() { },
		num: 210,
		gen: 4,
	},
	/*------飞鱼--------*/
	deepseadew: {
		name: "Deep Sea Dew",
		onModifyMovePriority: -1,
		onModifyMove(move, target) {
			if (move.category !== "Status" && move.type === 'Water') {
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
	/*------火蛾-------*/
	firemousefur: {
		name: 'Fire Mouse Fur',
		spritenum: 186,
		onResidualOrder: 28,
		onResidualSubOrder: 3,
		onResidual(pokemon) {
			if (!this.p2.active[0].hasType('fire'))
				this.damage(this.p2.active[0].baseMaxhp / 8, this.p2.active[0]);
			if (!this.p3!.active[0].hasType('fire'))
				this.damage(this.p3!.active[0].baseMaxhp / 8, this.p3!.active[0]);
			if (!this.p4!.active[0].hasType('fire'))
				this.damage(this.p4!.active[0].baseMaxhp / 8, this.p4!.active[0]);
		},
		fling: {
			basePower: 80,
		},
		gen: 4,
		num: 210,
	},
	/*----心蝙蝠-----*/
	gungnir: {
		name: 'Gungnir',
		spritenum: 186,
		onResidualOrder: 28,
		onResidualSubOrder: 3,
		onResidual(pokemon) {
			const validTargets = this.sides.slice(1).map(side => side.active[0]).filter(pokemon => !pokemon.fainted);
			let t = undefined;
			if (validTargets.length > 0)
				t = this.damage(pokemon.level * 1.2, this.prng.sample(validTargets));
			if (t)
				this.heal(t * 1.5, pokemon);
		},
		gen: 4,
		num: 210,
	},
	/*-----伊布-----*/
	boostedgear: {
		name: 'Boosted Gear',
		spritenum: 1000,
		onModifyMove(move, pokemon, target) {
			if (move.multihit && move.id !== 'beatup')
				if (Array.isArray(move.multihit))
					move.multihit = move.multihit.map(hit => hit + 1);
				else
					move.multihit = move.multihit + 1;
		},
		gen: 4,
		num: 2100,
	},
	/*------------重泥挽马--------------*/
	longinus: {
		name: 'Longinus',
		spritenum: 186,
		onResidualOrder: 28,
		onResidualSubOrder: 3,
		onResidual(pokemon) {
			for (const target of this.getAllActive().filter(target => target.side !== pokemon.side)) {
				//if (target !== pokemon)
				target.clearBoosts();
				this.add('-clearboost', target);

			}
		},
		gen: 4,
		num: 210,
	},
	/*----------大嘴雀-------*/
	elixirofimmortality: {
		name: "Elixir of Immortality",
		spritenum: 22,
		fling: {
			basePower: 30,
		},
		desc:'f',
		onDamage(damage, pokemon, source) {
			if (Math.random() <damage / pokemon.maxhp) {
				pokemon.getItem().desc = 't';
			}
		},
		onUpdate(pokemon) {
			if (pokemon.getItem().desc === 't') {
				if (this.runEvent('TryHeal', pokemon) && pokemon.useItem()) {
					this.heal(pokemon.maxhp);
				}
			}
		},
		num: 43,
		gen: 2,
	},
	/*------others---------*/
	stickybarb: {
		inherit: true,
		onResidual(pokemon) {
			if (!pokemon.volatiles['dynamax2']) this.damage(pokemon.baseMaxhp / 8);
		},
	},
	blacksludge: {
		inherit: true,
		onResidual(pokemon) {
			if (pokemon.hasType('Poison')) {
				this.heal(pokemon.baseMaxhp / 16);
			} else {
				if (!pokemon.volatiles['dynamax2']) this.damage(pokemon.baseMaxhp / 8);
			}
		},
	},
};
