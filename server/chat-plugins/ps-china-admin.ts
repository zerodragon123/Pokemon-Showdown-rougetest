import { FS } from '../../lib';
import { PetUtils, getUser } from './ps-china-pet-mode';

const REPLAYHEADPATH = 'config/ps-china/replay/replay-head.txt';
const REPLAYTAILPATH = 'config/ps-china/replay/replay-tail.txt';

const IPLOGDIR = 'logs/iplog';
const IPMAPPATH = 'logs/ipmap.json';
const SCORELOGDIR = 'logs/score';

if (!FS(IPLOGDIR).existsSync()) FS(IPLOGDIR).mkdir();
if (!FS(SCORELOGDIR).existsSync()) FS(SCORELOGDIR).mkdir();

let userAlts: { [userid: string]: string[] } = JSON.parse(FS(IPMAPPATH).readIfExistsSync() || '{}');
let addingScore: boolean = false;

export class AdminUtils {
	static adminPM(userid: string, msg: string) {
		const user = Users.get(userid);
		if (!user || !user.connected) return;
		user.send(`|pm|&|${user.tempGroup}${user.name}|/raw <div class="broadcast-green"><b>${msg}</b></div>`);
	}
	static updateUserAlts() {
		const ipCount: { [ip: string]: { [userid: string]: number } } = {};
		const idCount: { [userid: string]: number } = {};
		FS(IPLOGDIR).readdirIfExistsSync().slice(-16).forEach(fileName => {
			FS(`${IPLOGDIR}/${fileName}`).readIfExistsSync().split('\n').forEach(line => {
				const entry = line.split(',');
				if (entry.length !== 3) return;
				const userid = toID(entry[0]);
				const ip = entry[2];
				if (ip === '127.0.0.1' || ['shared', 'proxy'].includes(IPTools.getHostType('', ip))) return;
				if (!ipCount[ip]) ipCount[ip] = {};
				if (!ipCount[ip][userid]) ipCount[ip][userid] = 0;
				ipCount[ip][userid]++;
				if (!idCount[userid]) idCount[userid] = 0;
				idCount[userid]++;
			});
		});
		const idEdges: { [userid: string]: { [userid: string]: number } } = {};
		for (let ip in ipCount) {
			for (let id1 in ipCount[ip]) {
				for (let id2 in ipCount[ip]) {
					if (!idEdges[id1]) idEdges[id1] = {};
					if (!idEdges[id1][id2]) idEdges[id1][id2] = 0;
					idEdges[id1][id2] += ipCount[ip][id1] * ipCount[ip][id2];
				}
			}
		}
		userAlts = {};
		for (let userid in idEdges) {
			userAlts[userid] = Object.keys(idEdges[userid]).sort((id1, id2) => idEdges[userid][id1] < idEdges[userid][id2] ? 1 : -1);
		}
		FS(IPMAPPATH).safeWriteSync(PetUtils.formatJSON(userAlts));
	}
	static getAlts(userid: string): string[] | undefined {
		return userAlts[userid];
	}
	static async getMainId(userid: string): Promise<string> {
		for (let id of this.getAlts(userid) || [userid]) {
			if (!!(await this.getScore(id))) return id;
		}
		return '';
	}
	static addEggToMain(userid: string): string {
		return (this.getAlts(userid) || [userid]).find(id => {
			const petUser = getUser(id);
			if (petUser.addRandomEgg('3v')) {
				petUser.save();
				return true;
			}
		}) || '';
	}
	static async addScoreToMain(userid: string, score: number, msg: string = '') {
		const mainId = await this.getMainId(userid);
		const isMain = mainId === userid;
	
		msg += ', ';
		let noteMsg = msg.replace('{}', '???');
		let logMsg = '??????????????????: ' + msg.replace('{}', userid + ' ');
		if (mainId) {
			const scores = await this.addScore(mainId, score, msg.replace('{}', ''));
			if (!isMain) {
				noteMsg += `?????????????????? ${mainId} `;
				logMsg += `???????????? ${mainId} `;
			}
			noteMsg += `?????????????????? ${score} ???`;
			logMsg += `??????????????????: ${scores[0]} + ${score} = ${scores[1]}`;
		} else {
			noteMsg += `?????????????????????????????????, ?????????????????????????????????????????? ${score} ??????`;
			logMsg += `?????????????????????, ??????????????????????????????????????? ${score} ??????`
		}
	
		Rooms.global.modlog({ action: logMsg, isGlobal: true });
		Rooms.get('staff')?.add(`|c|&|/log ${logMsg}`).update();
		this.adminPM(userid, noteMsg);
	}
	static async getScore(userid: string): Promise<number> {
		// @ts-ignore
		let ladder = await Ladders("gen8ps").getLadder();
		for (let entry of ladder) {
			if (toID(userid) ? (toID(entry[2]) === toID(userid)) : (entry[2] === userid)) {
				return entry[1];
			}
		}
		return 0;
	}
	static async addScore(userid: string, score: number, reason: string = '', formatid: string = 'gen8ps'): Promise<number[]> {
		while (addingScore) await PetUtils.sleep(1);
		addingScore = true;
		// @ts-ignore
		let ladder: (string | number)[][] = await Ladders(formatid).getLadder();
		let userIndex = ladder.length;
		for (let [i, entry] of ladder.entries()) {
			if (toID(userid) ? (toID(entry[2]) === toID(userid)) : (entry[2] === userid)) {
				userIndex = i;
				break;
			}
		}
		if (userIndex === ladder.length) ladder.push([userid, 0, userid, 0, 0, 0, '']);
		let oldScore = +ladder[userIndex][1];
		if (score === 0) {
			addingScore = false;
			return [oldScore, oldScore];
		}
		let newScore = oldScore + score;
		if (newScore < 0) {
			addingScore = false;
			return [];
		}
		ladder[userIndex][1] = newScore;
	
		let newIndex = userIndex;
		while (newIndex > 0 && ladder[newIndex - 1][1] <= newScore) newIndex--;
		while (ladder[newIndex] && ladder[newIndex][1] >= newScore) newIndex++;
		if (newIndex !== userIndex && newIndex !== userIndex + 1) {
			let row = ladder.splice(userIndex, 1)[0];
			if (newIndex > userIndex) newIndex--;
			ladder.splice(newIndex, 0, row);
		}
	
		let lastIndex = ladder.length - 1;
		while (ladder[lastIndex][1] <= 0) lastIndex--;
		ladder.splice(lastIndex + 1, ladder.length);
	
		// @ts-ignore
		await Ladders(formatid).save();
		if (formatid === 'gen8ps') {
			const logMsg = `${PetUtils.getDate()},${oldScore}${score < 0 ? "-" : "+"}${Math.abs(score)}=${newScore},${reason}\n`;
			FS(`${SCORELOGDIR}/${toID(userid) || userid}.txt`).appendSync(logMsg);
		}
		addingScore = false;
		return [oldScore, newScore];
	}
}

export const commands: Chat.ChatCommands = {
	async score(target, room, user) {
		let targetUser = target.replace('!', '') || user.id;
		const score = await AdminUtils.getScore(targetUser);
		let msg = score ? `${targetUser} ???PS??????????????????${score}` : `??????????????? ${targetUser} ???PS??????????????????`;
		return target.includes('!') ? PetUtils.popup(user, msg) : score ? this.sendReply(msg) : this.errorReply(msg);
	},

	async pschinascore(target, room, user) {
		this.checkCan('lock');
		if (!room || !room.settings.staffRoom) return this.errorReply("??? Staff ????????????PS????????????");

		const userid = target.split(',')[0]?.trim();
		const score = target.split(',')[1]?.trim();
		const reason = target.split(',')[2]?.trim();
		if (!userid || !score || !reason || isNaN(parseInt(score))) {
			return this.parse("/pschinascorehelp");
		}
		const parsedScore = parseInt(score);
		const changeScore = await AdminUtils.addScore(userid, parsedScore, reason);
		if (changeScore.length !== 2) return this.errorReply("???????????????????????????");

		AdminUtils.adminPM(userid, `????????? ${reason} ${parsedScore > 0 ? '??????': '??????'}??? ${Math.abs(parsedScore)} ????????????`);
		const message = `??????ID: ${userid}, PS????????????: ` +
			`${changeScore[0]} ${parsedScore < 0 ? "-" : "+"} ${Math.abs(parsedScore)} = ${changeScore[1]}, ` +
			`??????: ${reason}, ?????????: ${user.name}.`;
		this.globalModlog(message);
		this.addModAction(message);

		if (changeScore[0] === 0) {
			const alts = AdminUtils.getAlts(toID(userid));
			if (!alts) {
				room.add(`|html|<b>??????: ??????????????? ${userid} ???????????????</b>`);
				return;
			}
			const content: (string | number)[][] = alts.map(alt => [alt]);
			for (let [i, alt] of alts.entries()) {
				content[i].push('&ensp;??????:&ensp;');
				content[i].push(alt === toID(userid) ? 0 : await AdminUtils.getScore(alt));
			}
			room.add(`|html|<b>??????: ${userid} ????????????????????????, ????????????:</b><br>${PetUtils.table([], [], content, 'auto')}`);
		}
	},
	pschinascorehelp: [
		`Usage: /pschinascore user, score, reason - ???user???????????????????????????score???, ????????????. Requires: & ~`,
	],

	'scorelog': 'pschinascorelog',
	async pschinascorelog(target, room, user) {
		const targets = target.split(',');
		const userId = toID(targets[0]) || targets[0] || user.id;
		if (userId !== user.id) this.checkCan('lock');
		const limit = parseInt(targets[1]) || 20;
		const logs = FS(`${SCORELOGDIR}/${userId}.txt`).readIfExistsSync();
		if (!logs) return this.errorReply(`??????????????? ${userId} ???2021???9???1??????????????????????????????`);
		const lines = logs.trim().split('\n').slice(-limit).map(line => line.split(',').map(s => `&ensp;${s}&ensp;`));
		this.sendReply(`?????? ${userId} ?????????${lines.length}?????????????????????:`);
		this.sendReply(`|html|${PetUtils.table([], ['??????', '??????', '??????'], lines, 'auto')}`);
	},
	pschinascoreloghelp: [
		`Usage: /scorelog user, lines - ??????user??????(???????????????)?????????lines(?????????20)?????????????????????`
	],

	restorereplay(target, room, user) {
		this.checkCan('lockdown');
		let params = target.split(',');
		if (!params || params.length != 4) {
			return this.sendReply('Usage: /restorereplay player1, player2, format, year-month-date');
		}
		let p1 = params[0].toLowerCase().replace(/[^\w\d\s]/g, '').replace(/\s+/g, '');
		let p2 = params[1].toLowerCase().replace(/[^\w\d\s]/g, '').replace(/\s+/g, '');
		let format = params[2].toLowerCase().replace(/[^\w\d\s]/g, '').replace(/\s+/g, '');
		let date = params[3].replace(/\s+/g, '');

		this.globalModlog('REPLAYRESTORE', `${p1}, ${p2}, ${format}, ${date}`, `By ${user.name}.`);
		let dir = `logs/${date.substr(0, 7)}/${format}/${date}`;

		let files = [];
		try {
			files = FS(dir).readdirSync();
		} catch (err: any) {
			if (err.code === 'ENOENT') {
				return this.errorReply("Replay not found.");
			}
			throw err;
		}

		let foundReplay = false;
		const rep_head = FS(REPLAYHEADPATH).readIfExistsSync();
		const rep_tail = FS(REPLAYTAILPATH).readIfExistsSync();
		for (const file of files) {
			const json = FS(`${dir}/${file}`).readIfExistsSync();
			const data = JSON.parse(json);
			if ((toID(data.p1) === p1 && toID(data.p2) === p2) || (toID(data.p1) === p2 && toID(data.p2) === p1)) {
				foundReplay = true;
				const htmlname = file.replace(".log.json", ".html");
				FS(`config/avatars/static/${htmlname}`).safeWriteSync(rep_head + data.log.join('\n') + rep_tail);
				this.sendReply(`http://39.96.50.192:8000/avatars/static/${htmlname}`);
			}
		}
		if (!foundReplay) {
			return this.errorReply("Replay not found.");
		}
	},

	async updatealts() {
		this.checkCan('gdeclare');
		AdminUtils.updateUserAlts();
		this.sendReply('???????????????????????????');
	},

	async checkalts(target) {
		this.checkCan('gdeclare');
		const targetId = toID(target);
		if (!targetId) return this.sendReply('Usage: /checkalts user - ??????user?????????????????????');
		const alts = AdminUtils.getAlts(targetId);
		if (!alts) return this.sendReply(`??????????????? ${target} ???????????????`);
		this.sendReply(`?????? ${target} ???????????????: ${alts.join(', ')}`);
		this.sendReply(`?????? ${target} ???????????????: ${await AdminUtils.getMainId(targetId)}`);
	},
};