import { FS } from "../../lib";
import { PetUtils } from "./ps-china-pet-mode";

const MINSCORETODECAY = 1200;
const MINGAMESHALFDECAY = 1;
const MINGAMESNODECAY = 6;
const DECAYRATE = 0.015;

export const commands: Chat.ChatCommands = {
	laddertour: {
		prefix(target, room, user) {
			if (!room) return false;
			this.checkCan('addhtml', null, room);
			const prefix = toID(target);
			if (!prefix) return this.errorReply('Prefix error.');
			Config.forcedprefixes.privacy = [prefix];
			this.sendReply(`Set prefix: ${prefix}`);
		},
		open(target, room, user) {
			if (!room) return false;
			this.checkCan('addhtml', null, room);
			const format = Dex.formats.get(toID(target));
			if (!format.exists) return this.errorReply('Format name error.');
			//@ts-ignore
			format.rated = true;
			const msg = `[${PetUtils.getTime()}] ${format.name} 天梯已开启!`;
			room.add(`|html|<div class='broadcast-green' style="text-align: center;"><b>${msg}</b></div>`).update();
		},
		close(target, room, user) {
			if (!room) return false;
			this.checkCan('addhtml', null, room);
			const format = Dex.formats.get(toID(target))
			if (!format.exists) return this.errorReply('Format name error.');
			//@ts-ignore
			format.rated = false;
			const msg = `[${PetUtils.getTime()}] ${format.name} 天梯已关闭!`;
			room.add(`|html|<div class='broadcast-green' style="text-align: center;"><b>${msg}</b></div>`).update();
		},
		async decay(target, room, user) {
			if (!room) return false;
			this.checkCan('addhtml', null, room);
			const dateStr = PetUtils.getDate();
			const formatid = toID(target);
			if (!Dex.formats.get(formatid).exists) return this.errorReply('Format name error.');
			//@ts-ignore
			let ladder: (string | number)[][] = await Ladders(formatid).getLadder();
			let gameCount: {[userid: string]: {'score': number, 'games': number}} = {};
			for (let entry of ladder) {
				if (entry[1] > MINSCORETODECAY) {
					gameCount[toID(entry[2])] = {'score': +entry[1], 'games': 0};
				}
			}
			const logDir = `logs/${dateStr.slice(0, -3)}/${formatid}/${dateStr}`;
			for (let fileName of FS(logDir).readdirIfExistsSync()) {
				const gameLog = JSON.parse(FS(`${logDir}/${fileName}`).readIfExistsSync());
				if (Math.max(...gameLog['inputLog'].map((x: string) => x.includes(`\"rated\":\"Rated battle\"`)))) {
					const p1 = toID(gameLog['p1']);
					const p2 = toID(gameLog['p2']);
					if (gameCount[p1]) gameCount[p1]['games']++;
					if (gameCount[p2]) gameCount[p2]['games']++;
				}
			}
			for (let entry of ladder) {
				if (entry[1] > MINSCORETODECAY) {
					const userid = toID(entry[2]);
					let decay = 0;
					if (gameCount[userid]['games'] < MINGAMESNODECAY) {
						decay = (gameCount[userid]['score'] - 1000) * DECAYRATE;
						if (gameCount[userid]['games'] >= MINGAMESHALFDECAY) {
							decay /= 2;
						}
					}
					decay = Math.min(decay, gameCount[userid]['score'] - MINSCORETODECAY);
					entry[1] = +entry[1] - decay;
				}
			}
			ladder.sort((entry1, entry2) => +entry2[1] - +entry1[1]);
			//@ts-ignore
			await Ladders(formatid).save();
			this.globalModlog(`Ladder decayed: ${formatid}`);
			this.addModAction(`Ladder decayed: ${formatid}`);
		}
	}
};