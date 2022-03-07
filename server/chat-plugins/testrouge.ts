import { PetUtils } from "./ps-china-pet-mode";
import { Pokemonpool } from "../../config/rouge/pokemonpool";
import { Championteams } from "../../config/rouge/Championteams";
import { Enemies } from "../../config/rouge/Enemies";
import { Battle, PRNG } from "../../sim";
import { load,  addwave, getnextwave, save, changelead } from "../../data/mods/rouge/rulesets"
import { Users } from "../users";
import { sample, unpack } from "../../data/mods/rouge/moves";
//import { auser, abot } from "../../config/user"

export class testrouge {

	static prng: PRNG = new PRNG();
	static createBattle(
		user: User, bot: User, userTeam: string, botTeam: string, format: string, hidden: boolean | undefined,
		delayedStart: boolean | 'multi' | undefined = false
	): GameRoom | undefined {
		//A.getInstance().aa = Users;
		return Rooms.createBattle({
			format: format,
			p1: {
				user: bot,
				team: botTeam,
				rating: 0,
				hidden: hidden,
				inviteOnly: false,
			},
			p2: {
				user: user,
				team: userTeam,
				rating: 0,
				hidden: hidden,
				inviteOnly: false,
			},
			p3: undefined,
			p4: undefined,
			rated: 0,
			challengeType: 'unrated',
			delayedStart: delayedStart,
		});
	}

}

//export function unpack(set:any){
//	let buf = '';
//	// name
//	buf += (set.name || set.species);

//	// species
//	const id = (set.species || set.name);
//	buf += '|' + (set.name || set.species) === id ? '' : id;

//	// item
//	buf += '|' + (Array.isArray(set.item) ? testrouge.prng.sample(set.item) : set.item);

//	// ability
//	buf += '|' + (Array.isArray(set.ability) ? testrouge.prng.sample(set.ability) : set.ability);

//	// moves
//	buf += '|' + sample(set.moves, 4, testrouge.prng).join(',');

//	// nature
//	buf += '|' + testrouge.prng.sample(natures) ;

//	// evs
//	if (set.evs === ',,,,,') {
//		buf += '|';
//	} else {
//		buf += '|'+set.evs;
//	}

//	// gender
//	if (set.gender) {
//		buf += '|' + set.gender;
//	} else {
//		buf += '|';
//	}

//	// ivs
	
//	if (set.ivs === ',,,,,') {
//		buf += '|';
//	} else {
//		buf += '|'+set.ivs;
//	}

//	// shiny
//	if (set.shiny) {
//		buf += '|S';
//	} else {
//		buf += '|';
//	}

//	// level
//	if (set.level && set.level !== 100) {
//		buf += '|' + set.level;
//	} else {
//		buf += '|';
//	}

//	// happiness
//	if (set.happiness !== undefined && set.happiness !== 255) {
//		buf += '|' + set.happiness;
//	} else {
//		buf += '|';
//	}

//	if (set.pokeball || set.hpType || set.gigantamax) {
//		buf += ',' + (set.hpType || '');
//		buf += ',' + (set.pokeball || '');
//		buf += ',' + (set.gigantamax ? 'G' : '');
//	}
//	return buf;
//}






export const commands: Chat.ChatCommands = {
	

	name(target, room, user) {
		let battleRoom: GameRoom | undefined;
		const bot = Users.get('pschinabot1');
		if (!bot) {
			return ;
		}
		let userTeam: string | string[] = load(user.id);
		let botTeam;
		if (!userTeam) {
			userTeam = 'Keldeo-Resolute||expertbelt|justified|secretsword,surf,psychic,airslash|Hasty|,4,,252,,252|||||';
			botTeam = unpack(testrouge.prng.sample(Enemies[0]), testrouge.prng);
		}
		else {
			if (userTeam[1] != userTeam[2]) return;
			
			
			botTeam = unpack(sample(Enemies[Number(userTeam[1])], Math.min(Math.floor((1 + Number(userTeam[1])) * 0.7)), testrouge.prng), testrouge.prng);
			userTeam = userTeam[0]
			
		}
		//const teams: keyof typeof PetModeGymConfig = testrouge.prng.sample(["仁义", "苍蓝", "湛蓝", "冰蓝", "坚毅", "权谋"])

		
		//const botTeam = PetModeGymConfig[teams].botteam;
		

		battleRoom = testrouge.createBattle(user, bot, userTeam, botTeam, 'gen8rougetest @@@pschinarougemode', false);
		addwave(user.id);
	},
	rouge(target, room, user) {
		if (!user.registered) return PetUtils.popup(user, "请先注册账号!");
		if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");

		let role = target ? Number(target) : 1
		if (!role) 
			return user.sendTo(room.roomid, `|uhtml|pet-init-show|<b>rouge 的格式：rouge number</b><br>`);
			
		
		let battleRoom: GameRoom | undefined;
		const bot = Users.get('pschinabot1');
		if (!bot) {
			return;
		}
		let userTeam: string | string[] = load(user.id);
		let botTeam;
		if (!userTeam) {
			switch (role) {
				case 0: userTeam = 'Keldeo-Resolute||expertbelt|justified|secretsword,surf,psychic,airslash|Hasty|,4,,252,,252|||||'; break;
				case 1: userTeam = unpack(Pokemonpool.Charmander, testrouge.prng); break;
				case 2: userTeam = unpack(Pokemonpool.Squirtle, testrouge.prng); break;
				case 3: userTeam = unpack(Pokemonpool.Bulbasaur, testrouge.prng); break;
				case 4: userTeam = testrouge.prng.next(2) === 1 ? unpack(Pokemonpool.Pikachu, testrouge.prng) : unpack(Pokemonpool["Pikachu-Original"], testrouge.prng); break;
				default: return user.sendTo(room.roomid, `|uhtml|pet-init-show|<b>该角色还没出</b><br>`);

			}
			botTeam = unpack(testrouge.prng.sample(Enemies[0]), testrouge.prng);
		}
		else {
			if (userTeam[1] != userTeam[2]) { user.popup(`|html|<div style="text-align: center">您不能再上一局对战未完成的情况下进行下一局对战</div>`); return; }
			let wave = 0.4 + Number(userTeam[1]) * 0.6;

			if (Math.floor(wave) % 13)
				botTeam = unpack(sample(Enemies[Math.floor(wave)], Math.min(Math.floor((1 + wave) * 0.6), 6), testrouge.prng), testrouge.prng);
			else
				botTeam = testrouge.prng.sample(Championteams[Math.floor(wave) / 13 - 1]);
			userTeam = userTeam[0]
		}
		//const teams: keyof typeof PetModeGymConfig = testrouge.prng.sample(["仁义", "苍蓝", "湛蓝", "冰蓝", "坚毅", "权谋"])


		//const botTeam = PetModeGymConfig[teams].botteam;

		addwave(user.id);
		battleRoom = testrouge.createBattle(user, bot, userTeam, botTeam, 'gen8rougetest @@@pschinarougemode', undefined);
		
	},
	clearcache(target, room, user) {
		if (!user.registered) return PetUtils.popup(user, "请先注册账号!");
		if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
		save('', user.id);
		return user.sendTo(room!.roomid, `|uhtml|pet-init-show|<b>您已删除你的队伍</b><br>`);
	},
	showteam(target, room, user) {
		if (!user.registered) return PetUtils.popup(user, "请先注册账号!");
		if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
		let userTeam: string = load(user.id)[0];
		if (userTeam)
			this.popupReply(Teams.export(Teams.unpack(userTeam)!));
		else
			return user.sendTo(room!.roomid, `|uhtml|pet-init-show|<b>您没有队伍</b><br>`);
	},
	chooselead(target, room, user) {
		if (!user.registered) return PetUtils.popup(user, "请先注册账号!");
		if (!room) return PetUtils.popup(user, "请在房间里使用宠物系统");
		let num = Number(target) - 1
		if (num && Number.isInteger(num) && num <= 5 && num >= 1) {
			let x = changelead(num, user.id);
			if (x)
				return user.sendTo(room!.roomid, `|uhtml|pet-init-show|<b>选择成功</b><br>`);
			else
				return user.sendTo(room!.roomid, `|uhtml|pet-init-show|<b>您在该位置没有精灵</b><br>`);
		} else
			return user.sendTo(room!.roomid, `|uhtml|pet-init-show|<b>请输入2-6的整数</b><br>`);
	}
}
