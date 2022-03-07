import { FS } from "../../../lib";
import { Teams, Pokemon, Battle, } from "../../../sim";

import { PetModeGymConfig } from "../../../config/pet-mode/gym-config";
import { Pokemonpool } from "../../../config/rouge/pokemonpool";
import { sample } from "./moves";
//import { RoomBattleOptions } from "../../../server/room-battle";
//import { RoomSettings } from "../../../server/rooms";
//import { Rooms } from "../../../server/rooms";
//import { getUser } from "../../../config/pet-mode/user";
//import { testrouge } from "../../../server/chat-plugins/testrouge"
const SAVEPATH = 'config/rouge/test.json';
//设置cookie
export function save(team: string, user: ID) {
	
	let userProperty = JSON.parse(FS(SAVEPATH).readIfExistsSync());
	if (team) {
		let lastteam = userProperty[user];
		if (!lastteam)
			userProperty[user] = team.concat('&1&1&&commonroom');
		else {
			lastteam = lastteam.split("&");
			lastteam[1] = String(Number(lastteam[1]) +1);
			lastteam[0] = team
			userProperty[user] = lastteam.join("&");
		}

	}
	else
		userProperty[user] = '';
	FS(SAVEPATH).writeSync(JSON.stringify(userProperty));
}
export function addwave(user: ID) {
	let userProperty = FS(SAVEPATH).readIfExistsSync();
	if (!userProperty) return false;
	userProperty = JSON.parse(userProperty);
	if (userProperty[user]) {
		let userteam: string[] = userProperty[user].split("&");
		userteam[2] = String(Number(userteam[2]) + 1);

		userProperty[user] = userteam.join('&')
		FS(SAVEPATH).writeSync(JSON.stringify(userProperty));
		return true
	} else {
		return false
	}
}
export function getnextwave(user: ID) {
	let userProperty = FS(SAVEPATH).readIfExistsSync();
	if (!userProperty) return 1;
	userProperty = JSON.parse(userProperty);
	if (userProperty[user]) {
		return Math.floor(0.4+Number(userProperty[user].split("&")[2])*0.6);
	
	} else {
		return 1
	}
}
export function load(user: ID): string[] | string {
	let userProperty = FS(SAVEPATH).readIfExistsSync();
	if (!userProperty) return '';
	userProperty = JSON.parse(userProperty);
	if (userProperty[user]) {
		return userProperty[user].split("&");
	}
	return '';

}
export function addroom(user: ID,room:string) {
	let userProperty = FS(SAVEPATH).readIfExistsSync();
	if (!userProperty) return false;
	userProperty = JSON.parse(userProperty);
	if (userProperty[user]) {
		let userteam: string[] = userProperty[user].split("&");
		userteam[4] = room;

		userProperty[user] = userteam.join('&')
		FS(SAVEPATH).writeSync(JSON.stringify(userProperty));
		return true
	} 
}
export function getroom(user: ID) {
	let userProperty = FS(SAVEPATH).readIfExistsSync();
	if (!userProperty) return '';
	userProperty = JSON.parse(userProperty);
	if (userProperty[user]) {
		return userProperty[user].split("&")[4];

	} else {
		return '';
	}
}
export function getrelics(user: ID) {
	let userProperty = FS(SAVEPATH).readIfExistsSync();
	if (!userProperty) return [];
	userProperty = JSON.parse(userProperty);
	if (userProperty[user]) {
		let a = userProperty[user].split("&")[3];
		if (a) return a.split(',');
		else return [];

	} else {
		return [];
	}
}
export function addrelics(user: ID, relice: string) {
	let userProperty = FS(SAVEPATH).readIfExistsSync();
	if (!userProperty) return false;
	userProperty = JSON.parse(userProperty);
	if (userProperty[user]) {
		let userteam: string[] = userProperty[user].split("&");
		if (userteam[3])
			userteam[3] += ',' + relice;
		else
			userteam[3] = relice;
		userProperty[user] = userteam.join('&')
		FS(SAVEPATH).writeSync(JSON.stringify(userProperty));
		return true
	}
}
export function changelead(number: number, user: ID) {

	let userProperty = JSON.parse(FS(SAVEPATH).readIfExistsSync());
	if (!number)
		return false
	let lastteam = userProperty[user];
	if (!lastteam)
		return false;
	
	lastteam = lastteam.split("&");
	let team = lastteam[0].split(']');
	if (team[number]) {
		let t = team[0];
		team[0] = team[number];

		team[number] = t;
		lastteam[0] = team.join("]")
	} else {
		return false;
	}
	
	userProperty[user] = lastteam.join("&");
	FS(SAVEPATH).writeSync(JSON.stringify(userProperty));
	return true;
}
export const relicseffect = {
	'artirain': (battle: Battle) => {
		battle.field.setWeather('raindance', battle.p2.active[0]);
		battle.add('message','your Artirain makes it rain');
	},
	'artihail': (battle: Battle) => {
		battle.field.setWeather('hail', battle.p2.active[0]);
		battle.add('message', 'your Artihail makes it hail');
	},
	'artistorm': (battle: Battle) => {
		battle.field.setWeather('sandstorm', battle.p2.active[0]);
		battle.add('message', 'your Artistorm makes it sandstorm');
	},
	'artisunny': (battle: Battle) => {
		battle.field.setWeather('sunnyday', battle.p2.active[0]);
		battle.add('message', 'your Artisunny makes it sunny');
	},
	'confidentstart': (battle: Battle) => {
		let x = Math.min( getnextwave(battle.toID(battle.p2.name)) / 5,3);
		for (let i = 0; i < x; i++)
			battle.boost(battle.sample([{ atk: 1 }, { def: 1 }, { spa: 1 }, { spd: 1 }, { spe: 1 }]), battle.p2.active[0]);
	},
	'artireflect': (battle: Battle) => {
		battle.p2.addSideCondition('reflect');
		battle.add('message', 'your Artireflect makes reflect start on your side for 5 turn');
	},
	'artilightscreen': (battle: Battle) => {
		battle.p2.addSideCondition('lightscreen');
		battle.add('message', 'your Artilightscreen makes lightscreen start on your side for 5 turn');
	},
	'focusdevice': (battle: Battle) => {
		battle.field.addPseudoWeather('Focus Room');
		battle.add('message', 'your Focus Device makes Focus Room start');
	},
	'angelhalo': (battle: Battle) => {
		battle.sample(battle.p2.pokemon).m.innate = 'elite';
	},
	'industrialplant': (battle: Battle) => {
		battle.field.setTerrain('Steel Terrain');
		battle.add('message', 'your Industrial Plant makes Steel Terrain start');
	},
	'eggofcompassion': (battle: Battle) => {
		battle.field.addPseudoWeather('Mercy Aura');
		battle.add('message', 'your Egg Of Compassion makes Mercy Aura start');
	},
	'dancingfloor': (battle: Battle) => {
		battle.field.addPseudoWeather('Ball Aura');
		battle.add('message', 'your Dancing Floor makes Mercy Aura start');
	},
	'dragonthrones': (battle: Battle) => {
		battle.field.addPseudoWeather("Dragon's Majesty");
		battle.add('message', 'your Dragon Thrones makes Mercy Aura start');
	},
};


//export function createBattle1(
//	user: User, bot: User, userTeam: string, botTeam: string, format: string, hidden: boolean,
//	delayedStart: boolean | 'multi' | undefined = false
//): GameRoom | undefined {
	
//	const room = Rooms.createBattle({
//		format: format,
//		p1: {
//			user: bot,
//			team: botTeam,
//			rating: 0,
//			hidden: hidden,
//			inviteOnly: false,
//		},
//		p2: {
//			user: user,
//			team: userTeam,
//			rating: 0,
//			hidden: hidden,
//			inviteOnly: false,
//		},
//		p3: undefined,
//		p4: undefined,
//		rated: 0,
//		challengeType: 'unrated',
//		delayedStart: delayedStart,
//	});
	
//	return room;
//}

//function createBattle(options: RoomBattleOptions & Partial<RoomSettings>) {
//	const players: User[] = [options.p1, options.p2, options.p3, options.p4]
//		.filter(Boolean).map(player => player!.user);
//	const gameType = Dex.formats.get(options.format).gameType;
//	if(gameType !== 'multi' && gameType !== 'freeforall') {
//	if (players.length > 2) {
//		throw new Error(`Four players were provided, but the format is a two-player format.`);
//	}
//}
//if (new Set(players).size < players.length) {
//	throw new Error(`Players can't battle themselves`);
//}

//for (const user of players) {
//	Ladders.cancelSearches(user);
//}

//if (Rooms.global.lockdown === true) {
//	for (const user of players) {
//		user.popup("The server is restarting. Battles will be available again in a few minutes.");
//	}
//	return;
//}

//const p1Special = players.length ? players[0].battleSettings.special : undefined;
//let mismatch = `"${p1Special}"`;
//for (const user of players) {
//	if (user.battleSettings.special !== p1Special) {
//		mismatch += ` vs. "${user.battleSettings.special}"`;
//	}
//	user.battleSettings.special = undefined;
//}

//if (mismatch !== `"${p1Special}"`) {
//	for (const user of players) {
//		user.popup(`Your special battle settings don't match: ${mismatch}`);
//	}
//	return;
//} else if (p1Special) {
//	options.ratedMessage = p1Special;
//}

//const roomid = Rooms.global.prepBattleRoom(options.format);
//// options.rated is a number representing the lowest player rating, for searching purposes
//// options.rated < 0 or falsy means "unrated", and will be converted to 0 here
//// options.rated === true is converted to 1 (used in tests sometimes)
//options.rated = Math.max(+options.rated! || 0, 0);
//const p1 = players[0];
//const p2 = players[1];
//const p1name = p1 ? p1.name : "Player 1";
//const p2name = p2 ? p2.name : "Player 2";
//let roomTitle;
//if (gameType === 'multi') {
//	roomTitle = `Team ${p1name} vs. Team ${p2name}`;
//} else if (gameType === 'freeforall') {
//	// p1 vs. p2 vs. p3 vs. p4 is too long of a title
//	roomTitle = `${p1name} and friends`;
//} else {
//	roomTitle = `${p1name} vs. ${p2name}`;
//}
//options.isPersonal = true;
//const room = Rooms.createGameRoom(roomid, roomTitle, options);
//const battle = new Rooms.RoomBattle(room, options);
//room.game = battle;
//battle.checkPrivacySettings(options);

//for (const p of players) {
//	if (p) {
//		p.joinRoom(room);
//		Monitor.countBattle(p.latestIp, p.name);
//	}
//}

//return room;
//	}
//export module FileModule {
//	export var user: User;
//	export var bot: User;
//}

//function getUser1(name: string): User | undefined {
//	//const tr = new testrouge();
//	const aname = Dex.toID(name);
//	return getUser(aname);
//}
//const a = new A();

function checkWin(pokemonOnFaint: Pokemon, sides: Side[]): Side | undefined {
	const aliveSides = sides.filter(side => {
		return side.pokemon.filter(pokemon => !pokemon.fainted && pokemon.name != 'Reward' ).length > (pokemonOnFaint.side.id === side.id ? 1 : 0);
	});
	if (aliveSides.length === 1) return aliveSides[0];
}

export const Rulesets: { [k: string]: FormatData } = {
	pschinarougemode: {
		effectType: 'Rule',
		name: 'PS China Rouge Mode',
		ruleset: ['Dynamax Clause'],
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
			//this.p1.pokemon = this.p1.pokemon.concat([new Pokemon(Teams.unpack('Shop|||shopman|Retransmission Moves Pool,getsuperband,getsuperspecs,getsuperscarf,Learn Extreme Speed,skip|Careful|252,4,,,252,|||||')![0], this.p2)]);
			let room: keyof typeof Pokemonpool.Shop = getroom(this.toID(this.p2.name));
			if (!room) room = 'pokemonroom';
			
			
			let reward = Pokemonpool.Shop[room] as string[]
			let reward2 = Pokemonpool.Shop[(room + '2') as keyof typeof Pokemonpool.Shop] as string[];
			if (room === 'eliteroom') {
				this.prng.sample(this.p1.pokemon).m.innate = 'elite';
				let relics = getrelics(this.toID(this.p2.name))
				for (let x of relics) {
					x = 'Gain ' + x.replace(/( |^)[a-z]/g, (L: string) => L.toUpperCase());
					let index = reward.indexOf(x);
					if (index > -1) {
						reward.splice(index, 1); continue;
					}
					let index2 = reward2.indexOf(x);
					if (index2 > -1) {
						reward2.splice(index2, 1); continue;
					}

				}
			}
			if (room === 'championroom')
				this.p1.pokemon = this.p1.pokemon.concat([new Pokemon(Teams.unpack('Reward|Shop||shopman|' + sample(reward, 3, this.prng, reward2).join(',') + '|Careful|252,4,,,252,|||||')![0], this.p2)]);
			else
				this.p1.pokemon = this.p1.pokemon.concat([new Pokemon(Teams.unpack('Reward|Shop||shopman|' + (this.prng.next(3) === 0 ? 'Evo A Pokemon,' : 'skip,') + sample(reward, 3, this.prng, reward2).join(',') + '|Careful|252,4,,,252,|||||')![0], this.p2)]);
			this.p1.pokemon = this.p1.pokemon.concat([new Pokemon(Teams.unpack('Shopowner|Magikarp||shopman|splash|Hardy||M|0,0,0,0,0,0||5|')![0], this.p1)]);
			
			
		
			this.p1.allySide = this.p2;
			const userName = this.p2.name;
			//const gymName = registerUser(Dex.toID(userName));
			//if (!gymName) return;
			//const gymSettings = gymConfig[gymName];
			this.p1.emitRequest = (update: AnyObject) => {
				this.send('sideupdate', `${this.p1.id}\n|request|${JSON.stringify(update)}`);
				this.p1.activeRequest = update;
				// @ts-ignore
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

					if (update.forceSwitch || abilitySwitch || itemSwitch || boostSwicth) {
						
						const alive = this.p1.pokemon.filter(
							x => !x.isActive && !x.fainted && x.name != 'Reward' && x.name !='Shopowner'
						).map(x => x.name);
						if (alive.length > 0) {
							this.p1.chooseSwitch(this.prng.sample(alive));
						} else if (activePoke.fainted){
							//店长出场
							const Shopowner =this.p1.pokemon.find(x => {
								return !x.fainted && x.name == 'Shopowner';
							})
							if (Shopowner && foeActivePoke.name != 'Reward')
								//this.p1.autoChoose();
								
								this.p1.chooseSwitch('Shopowner');
								
						}
						
						if (this.allChoicesDone()) {
							this.commitDecisions();
							this.sendUpdates();
						}
					}
					//换商店
					if (activePoke.name == 'Shopowner' && foeActivePoke.name != 'Reward') {
						this.p1.clearChoice();
						this.p1.chooseSwitch('Reward');

						if (this.allChoicesDone()) {
							this.commitDecisions();
							this.sendUpdates();
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
				}, 10);
			};
			//this.add('html', `<div class="broadcast-green"><strong>训练家${userName}开始挑战${gymName}道馆!</strong></div>`);
		},

	
		onBattleStart() {
			
		},
		
		onBeforeTurn(pokemon) {

			if (this.turn === 1 && pokemon.side === this.p1) {
				
				let relics = getrelics(this.toID(this.p2.name))
				if (relics) {
					for (let x of relics) {
						relicseffect[x as keyof typeof relicseffect](this);
					}
					return;
				}
				
			}

			
			
			//const gymName = userToGym[Dex.toID(this.p2.name)];
			//if (!gymName) return;
			//const gymSettings = gymConfig[gymName];
			//if (gymSettings['weather']) this.field.setWeather(gymSettings['weather']);
			//if (gymSettings['terrain']) this.field.setTerrain(gymSettings['terrain']);
			//if (gymSettings['pseudoweather']) this.field.addPseudoWeather(gymSettings['pseudoweather']);
			if (pokemon.side === this.p1 && this.prng.next(40) === 1 && !this.field.effectiveWeather()) this.field.setWeather(this.sample(['raindance', 'hail', 'sunnyday', 'sandstorm']));
			
		},
		onSwitchInPriority: 2,
		onSwitchIn(pokemon) {
			if (pokemon.m.innate === 'elite') {
				if (pokemon.side === this.p1)
					pokemon.addVolatile('elite');
				if (pokemon.side === this.p2)
					pokemon.addVolatile('halo');
			}
		},
		onAnyFaintPriority:100,
		onFaint(pokemon) {

			//const userId = Dex.toID(this.p2.name);
			//const gymName = userToGym[userId];
			//const gymSettings = gymConfig[gymName];
			//if (!gymName) return;
			if (pokemon.name == 'Shopowner') {
				if (this.p2.active[0].name != 'Reward')
					this.add('html', '<div class="broadcast-green">你把老板杀死了，老板生气了惩罚你跳过了奖励环节</div>');
				
				let nextwave = getnextwave(this.toID(this.p2.name))
				save(Teams.pack(this.p2.team.map(x => { x.level = Math.min((1 + nextwave) * 10, 100); if (x.evs.hp < 252) x.evs.hp += 4; if (x.evs.atk < 252) x.evs.atk += 4; if (x.evs.def < 252) x.evs.def += 4; if (x.evs.spa < 252) x.evs.spa += 4; if (x.evs.spd < 252) x.evs.spd += 4; if (x.evs.spe < 252) x.evs.spe += 4; return x; })), this.toID(this.p2.name));
				this.add('html', '<button class="button" name="send" value="/rouge">nextwave</button>');
				

				this.win(this.p2)
			} else {
				switch (checkWin(pokemon, this.sides)) {
					case this.p2:
						
						//if (getnextwave(this.toID(this.p2.name)) === 13)  {
						//	this.add('html', '<div class="broadcast-green">恭喜你！您已通关。Thank you for playing.</div>');
						//	save('', this.toID(this.p2.name));
						//	this.win(this.p2)
						//}
						
						//this.commitDecisions();
						//this.sendUpdates();
						//this.p1.chooseSwitch('Shopowner');
						//this.p1.chooseSwitch('Shop');
						//this.commitDecisions();
						//this.sendUpdates();
						//const teams: keyof typeof PetModeGymConfig = this.prng.sample(["仁义", "苍蓝", "湛蓝", "冰蓝", "坚毅", "权谋"])
						//const b=createBattle1(user, bot, Teams.pack(this.p2.team), PetModeGymConfig[teams].botteam, 'gen8rougetest @@@pschinarougemode', false);
						break;
					case this.p1:
						save('', this.toID(this.p2.name));

						break;
				}
			}
			//if (!this.p1.pokemonLeft) {
			//	this.p1.pokemon = [new Pokemon('Blissey||leftovers|naturalcure|aromatherapy,icebeam,softboiled,calmmind|Bold|,,252,,252,|F|,0,,,,|||', this.p1)];
			//	this.p1.pokemonLeft+=1
			//}
		},
	},

};
