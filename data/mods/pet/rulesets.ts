/*
	p1 = Bot Side
	p2 = User Side
*/

import { FS } from "../../../lib";
import { PetModeGymConfig } from "../../../config/pet-mode/gym-config";

const USERPATH = 'config/pet-mode/user-properties';
const DEPOSITPATH = 'config/pet-mode/deposit';

const catchRate: {[speciesid: string]: number} = JSON.parse(FS('config/pet-mode/catch-rate.json').readIfExistsSync());
const catchStatusCorrection: {[statusid: string]: number} = {'': 1, 'psn': 1.5, 'par': 1.5, 'brn': 1.5, 'slp': 2.5, 'frz': 2.5};
const gymConfig: {[gymname: string]: {
	'maxlevel': number, 'botteam': string, 'userteam': string, 'ace': string,
	'bonus'?: string, 'terrain'?: string, 'weather'?: string, 'pseudoweather'?: string,
	'msg': {'start': string, 'ace': string, 'win': string, 'lose': string}
}} = PetModeGymConfig;
const userToGym: {[userid: string]: string} = {};

function argmax(s: StatsTable): 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' {
	return Object.keys(s)[Object.values(s).indexOf(Math.max(...Object.values(s)))] as 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';
}

function addExperience(userid: string, foespecies: string, foelevel: number): boolean {
	let levelUp = false;
	const foespec = Dex.species.get(foespecies);
	const foebst = foespec.bst;
	const maxEvsIndex = argmax(foespec.baseStats);
	const f = Object.keys(foespec.baseStats).indexOf(maxEvsIndex);
	const s = Math.floor(foespec.baseStats[maxEvsIndex] / 40) * 4;
	let userProperty = JSON.parse(FS(`${USERPATH}/${userid}.json`).readIfExistsSync());
	const len = userProperty['bag'].length;
	for (let index in userProperty['bag']) {
		const ownPoke = userProperty['bag'][index];
		let features = ownPoke.split('|');
		if (Dex.toID(features[1]) === 'egg') {
			features[6] = Math.min((parseInt(features[6]) || 0) + 1, 20) + ',,,,,';
			userProperty['bag'][index] = features.join('|');
		} else if (ownPoke) {
			let level = parseFloat(features[10]) || 100;
			// 经验 = sqrt(100 * foeLevel) * foeBst / log3(team.length + 2)
			// level + 1 所需经验 = level * bst * 1.5
			if (level < userProperty['badges'].length * 10 + 10) {
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
			userProperty['bag'][index] = features.join('|');
		}
	}
	FS(`${USERPATH}/${userid}.json`).safeWriteSync(JSON.stringify(userProperty));
	return levelUp;
}

function writeCatchRate(userid: string, speciesid: string, hp: number, maxhp: number, status: string) {
	const baseSpecies = Dex.toID(Dex.species.get(speciesid).baseSpecies);
	const R = (1 - hp / maxhp / 1.5) * (catchRate[baseSpecies] || 3) * (catchStatusCorrection[status] || 1);
	FS(`${DEPOSITPATH}/${userid}.txt`).safeWriteSync(Math.floor(R).toString());
}

function addBadge(userid: string, badgename: string): boolean {
	if (FS(`${DEPOSITPATH}/${userid}.txt`).readIfExistsSync() !== badgename) return false;
	let userProperty = JSON.parse(FS(`${USERPATH}/${userid}.json`).readIfExistsSync());
	if (userProperty['badges'].indexOf(badgename) < 0) {
		userProperty['badges'].push(badgename);
		FS(`${USERPATH}/${userid}.json`).safeWriteSync(JSON.stringify(userProperty));
		return true;
	}
	return false;
}

function addBox(userid: string) {
	let userProperty = JSON.parse(FS(`${USERPATH}/${userid}.json`).readIfExistsSync());
	userProperty['box'] = userProperty['box'].concat(new Array(30).fill(''));
	FS(`${USERPATH}/${userid}.json`).safeWriteSync(JSON.stringify(userProperty));
}

function registerUser(userid: string): string | undefined {
	let gymName = FS(`${DEPOSITPATH}/${userid}.txt`).readIfExistsSync();
	if (gymConfig[gymName]) {
		userToGym[userid] = gymName;
		return gymName;
	}
}

function checkWin(pokemonOnFaint: Pokemon, sides: Side[]): Side | undefined {
	const aliveSides = sides.filter(side => {
		return side.pokemon.filter(pokemon => !pokemon.fainted).length > (pokemonOnFaint.side.id === side.id ? 1 : 0);
	});
	if (aliveSides.length === 1) return aliveSides[0];
}

export const Rulesets: {[k: string]: FormatData} = {

	pschinapetmode: {
		name: 'PS China Pet Mode',
		ruleset: ['Dynamax Clause'],
	},

	pschinapetmodebalanced: {
		name: 'PS China Pet Mode Balanced',
		ruleset: ['Dynamax Clause', 'Sleep Clause Mod', 'Endless Battle Clause', 'Team Preview', 'HP Percentage Mod', 'Cancel Mod'],
	},

	pschinapetmodewild: {
		name: 'PS China Pet Mode Wild',
		timer: {
			starting: 300,
			addPerTurn: 0,
			maxPerTurn: 30,
			maxFirstTurn: 30,
			grace: 0,
			timeoutAutoChoose: true,
			dcTimer: false,
			dcTimerBank: false,
		},
		onBegin() {
			this.p1.emitRequest = (update: AnyObject) => {
				this.send('sideupdate', `${this.p1.id}\n|request|${JSON.stringify(update)}`);
				this.p1.activeRequest = update;
				// @ts-ignore
				setTimeout(() => {
					for (let i = 0; i < 20 && !this.p1.isChoiceDone(); i++)
						this.p1.chooseMove(this.sample(this.p1.active[0].moves));
					if (!this.p1.isChoiceDone()) this.p1.autoChoose();
					if (this.allChoicesDone()) this.commitDecisions();
					this.sendUpdates();
				}, 10);
			}
			this.add('html', `<div class="broadcast-green"><strong>野生的${this.p1.team[0].name}出现了!</strong></div>`);
		},
		onBattleStart() {
			this.add('html', `<button class="button" name="send" value="/pet lawn ball">捕捉!</button>`);
			const userid = Dex.toID(this.p2.name);
			writeCatchRate(userid, this.p1.pokemon[0].species.id, 1, 1, '');
		},
		onBeforeTurn(pokemon) {
			if (pokemon.side === this.p1) {
				this.add('html', `<button class="button" name="send" value="/pet lawn ball">捕捉!</button>`);
				const userid = Dex.toID(this.p2.name);
				writeCatchRate(userid, pokemon.species.id, pokemon.hp, pokemon.maxhp, pokemon.status);
			}
		},
		onFaint(pokemon) {
			if (pokemon.side === this.p1) {
				this.add('html', `<div class="broadcast-green"><strong>野生的${pokemon.name}倒下了!</strong></div>`);
				let levelUp = false;
				levelUp = levelUp || addExperience(Dex.toID(this.p2.name), pokemon.species.name, pokemon.level);
				if (levelUp) {
					this.add('html', `<div class="broadcast-green"><strong>您的宝可梦升级了! 快去盒子查看吧!</strong></div>`);
				}
			} else {
				this.add('html', `<div class="broadcast-red"><strong>${pokemon.name}倒下了!</strong></div>`);
			}
		},
	},

	pschinapetmodegym: {
		name: 'PS China Pet Mode Gym',
		ruleset: ['Sleep Clause Mod'],
		timer: {
			starting: 600,
			addPerTurn: 30,
			maxPerTurn: 60,
			maxFirstTurn: 60,
			grace: 0,
			timeoutAutoChoose: true,
			dcTimer: false,
			dcTimerBank: false,
		},
		onBegin() {
			const userName = this.p2.name;
			const gymName = registerUser(Dex.toID(userName));
			if (!gymName) return;
			const gymSettings = gymConfig[gymName];
			this.p1.emitRequest = (update: AnyObject) => {
				this.send('sideupdate', `${this.p1.id}\n|request|${JSON.stringify(update)}`);
				this.p1.activeRequest = update;
				setTimeout(() => {
					const activePoke = this.p1.active[0];
					const foeActivePoke = this.p2.active[0];
					const checkImmune = (moveid: string): boolean => {
						const move = Dex.moves.get(moveid);
						if (foeActivePoke.types.find(type => Dex.types.get(type).damageTaken[move.type] === 3)) return false;
						switch (Dex.toID(activePoke.ability)) {
						case 'moldbreaker':
						case 'turboblaze':
						case 'teravolt':
							return true;
						}
						switch (move.id) {
						case 'sunsteelstrike':
						case 'searingsunrazesmash':
						case 'moongeistbeam':
						case 'menacingmoonrazemaelstrom':
						case 'photongeyser':
						case 'lightthatburnsthesky':
						case 'gmaxdrumsolo':
						case 'gmaxfireball':
						case 'gmaxhydrosnipe':
							return true;
						}
						if (move.flags['powder'] && foeActivePoke.hasType('Grass')) return false;
						if (move.flags['bullet'] && foeActivePoke.hasAbility('Bulletproof')) return false;
						if (move.flags['sound'] && foeActivePoke.hasAbility('Soundproof')) return false;
						if (move.target !== 'self') {
							switch (move.type) {
							case 'Grass':
								return !foeActivePoke.hasAbility(['sapsipper']);
							case 'Fire':
								return !foeActivePoke.hasAbility(['flashfire']);
							case 'Water':
								return !foeActivePoke.hasAbility(['stormdrain', 'waterabsorb', 'dryskin']);
							case 'Electric':
								return !foeActivePoke.hasAbility(['voltabsorb', 'motordrive', 'lightningrod']);
							}
						}
						return true;
					}
					const isHealMove = (moveid: string) => {
						const move = Dex.moves.get(moveid);
						return move.flags['heal'] && !move.damage;
					}
					const mega = activePoke.canMegaEvo ? 'mega' : '';
					const boostSwicth = eval(Object.values(activePoke.boosts).join('+')) <= -4;
					const abilitySwitch = activePoke.hasAbility(['truant', 'normalize']);
					const itemSwitch = activePoke.hasItem(['choicescarf', 'choiceband', 'choicespecs']) &&
						activePoke.lastMove && !checkImmune(activePoke.lastMove.id);
					// Switch
					if (update.forceSwitch || boostSwicth || abilitySwitch || itemSwitch) {
						const alive = this.p1.pokemon.filter(
							x => !x.isActive && !x.fainted && x.species.name !== gymSettings['ace']
						).map(x => x.name);
						if (alive.length > 0) {
							this.p1.chooseSwitch(this.prng.sample(alive));
						} else if (this.p1.pokemon[0].name !== gymSettings['ace']) {
							this.p1.chooseSwitch(gymSettings['ace']);
							this.add('message', gymSettings['msg']['ace']);
						}
					}
					// Spectral Thief
					if (!this.p1.isChoiceDone()) {
						const foeBoost = eval(Object.values(foeActivePoke.boosts).filter(x => x > 0).join('+'));
						if (!foeActivePoke.hasType('Normal') && foeBoost >= 2) {
							if (activePoke.hasMove('spectralthief')) {
								this.p1.chooseMove('spectralthief', 0, mega);
							} else {
								const thief = this.p1.pokemon.find(x => {
									return !x.fainted && x.hasMove('spectralthief');
								});
								if (thief) this.p1.chooseSwitch(thief.name);
							}
						}
					}
					// Heal
					if (!this.p1.isChoiceDone()) {
						const hpRate = activePoke.hp / activePoke.maxhp;
						const healPress = activePoke.speed > foeActivePoke.speed ? 1 : 2;
						const healRate = Math.pow(1 - hpRate, 3) + 3 * Math.pow(1 - hpRate, 2) * hpRate * healPress;
						if (this.prng.randomChance(healRate * 1000, 1000)) {
							const healingMove = activePoke.moves.find(isHealMove);
							if (healingMove) this.p1.chooseMove(healingMove, 0, mega);
						}
					}
					// Other Moves
					if (!this.p1.isChoiceDone()) {
						const movesHasPP = activePoke.getMoves().filter(movedata => !!movedata.pp).map(movedata => movedata.move);
						const movesNotHeal = movesHasPP.filter(move => !isHealMove(move));
						const movesNotImmune = movesNotHeal.filter(move => checkImmune(move));
						if (movesNotImmune.length > 0) {
							this.p1.chooseMove(this.sample(movesNotImmune), 0, mega);
						} else if (movesNotHeal.length) {
							this.p1.chooseMove(this.sample(movesNotHeal), 0, mega);
						} else if (movesHasPP.length > 0) {
							this.p1.chooseMove(this.sample(movesHasPP), 0, mega);
						}
					}
					if (!this.p1.isChoiceDone()) this.p1.autoChoose();
					if (this.allChoicesDone()) this.commitDecisions();
					this.sendUpdates();
				}, 10);
			};
			this.add('html', `<div class="broadcast-green"><strong>训练家${userName}开始挑战${gymName}道馆!</strong></div>`);
		},
		onBattleStart() {
			const gymName = userToGym[Dex.toID(this.p2.name)];
			if (gymName) this.add('message', gymConfig[gymName]['msg']['start']);
		},
		onBeforeTurn() {
			const gymName = userToGym[Dex.toID(this.p2.name)];
			if (!gymName) return;
			const gymSettings = gymConfig[gymName];
			if (gymSettings['weather']) this.field.setWeather(gymSettings['weather']);
			if (gymSettings['terrain']) this.field.setTerrain(gymSettings['terrain']);
			if (gymSettings['pseudoweather']) this.field.addPseudoWeather(gymSettings['pseudoweather']);
		},
		onFaint(pokemon) {
			const userId = Dex.toID(this.p2.name);
			const gymName = userToGym[userId];
			const gymSettings = gymConfig[gymName];
			if (!gymName) return;
			switch (checkWin(pokemon, this.sides)) {
			case this.p2:
				if (addBadge(userId, gymName)) {
					this.add('html', `<div class="broadcast-green"><strong>恭喜您获得了 ${gymName}徽章 !</strong></div>`);
					switch (gymSettings['bonus']) {
					case 'box':
						addBox(userId);
						this.add('html', `<div class="broadcast-green"><strong>您获得了一个新的盒子! 快去查看吧!</strong></div>`);
						break;
					}
				}
				this.add('message', gymSettings['msg']['win']);
				delete userToGym[userId];
				break;
			case this.p1:
				this.add('message', gymSettings['msg']['lose']);
				delete userToGym[userId];
				break;
			}
		}
	},

	pschinagymauramode: {
		name: 'PS China Gym Aura Mode',
		ruleset: ['[Gen 8] National Dex'],
		banlist: ['Assault Vest'],
		onBeforeTurn() {
			const allTypes: string[] = [];
			this.p1.pokemon.concat(this.p2.pokemon).forEach(pokemon => {
				if (['multitype', 'rkssystem'].includes(pokemon.ability)) return;
				pokemon.types.forEach(type => allTypes.push(type));
			});
			Dex.types.names().filter(type => allTypes.filter(t => t === type).length > 3).forEach(type => {
				switch (type) {
					case 'Poison': this.field.setWeather("Acid Rain"); break;
					case 'Steel': this.field.setTerrain("Steel Terrain"); break;
					case 'Grass': this.field.addPseudoWeather("Mercy Aura"); break;
					case 'Electric': this.field.addPseudoWeather("Ball Aura"); break;
					case 'Dragon': this.field.addPseudoWeather("Dragon's Majesty"); break;
				}
			});
		},
	}
};
