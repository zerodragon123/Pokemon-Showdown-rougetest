/**
 * Neural net chat'filters'.
 * These are in a separate file so that they don't crash the other filters.
 * (issues with globals, etc)
 * We use Google's Perspective API to classify messages.
 * @see https://perspectiveapi.com/
 * by Mia.
 * @author mia-pi-git
 */
import * as Artemis from '../artemis';
import {FS, Utils} from '../../lib';
import {Config} from '../config-loader';
import {toID} from '../../sim/dex-data';

const WHITELIST = ["mia"];
const PUNISHMENTS = ['WARN', 'MUTE', 'LOCK', 'WEEKLOCK'];
const NOJOIN_COMMAND_WHITELIST: {[k: string]: string} = {
	'lock': '/lock',
	'weeklock': '/weeklock',
	'warn': '/warn',
	'forcerename': '/fr',
	'namelock': '/nl',
	'weeknamelock': '/wnl',
};
const REPORT_NAMECOLORS: {[k: string]: string} = {
	p1: 'DodgerBlue',
	p2: 'Crimson',
	p3: '#FBa92C',
	p4: '#228B22',
	other: '', // black - empty since handled by dark mode
};

export let migrated = global.Chat?.oldPlugins['abuse-monitor']?.migrated || false;

export const cache: {
	[roomid: string]: {
		users: Record<string, number>,
		// can be a string and not string[] if it was added to the object before this patch was done.
		// todo: move this to just ID[]
		staffNotified?: ID | ID[],
		claimed?: ID,
		recommended?: Record<string, {type: string, reason: string}>,
	},
} = (() => {
	const plugin = global.Chat?.oldPlugins['abuse-monitor'];
	if (!plugin?.cache) return {};
	if (plugin.migrated) return plugin.cache;
	for (const k in plugin.cache) {
		const cur = plugin.cache[k];
		if (typeof cur.recommended?.type === 'string') { // would be object if it was the new entry
			// we cannot feasibly determine who it was (but it __is__ logged in <<abuselog>>, so staff can)
			delete cur.recommended;
		}
	}
	migrated = true;
	return plugin.cache;
})();

const defaults: FilterSettings = {
	threshold: 4,
	thresholdIncrement: null,
	minScore: 0.65,
	specials: {
		THREAT: {0.96: 'MAXIMUM'},
		IDENTITY_ATTACK: {0.8: 2},
		SEVERE_TOXICITY: {0.8: 2},
	},
	punishments: [
		{certainty: 0.93, type: 'IDENTITY_ATTACK', punishment: 'WARN', count: 2},
	],
};

export const settings: FilterSettings = (() => {
	try {
		// accounting for data changes -
		// make sure we do have the default data in case it's not in the stored data
		return {...defaults, ...JSON.parse(FS('config/chat-plugins/nf.json').readSync())};
	} catch (e: any) {
		if (e.code !== "ENOENT") throw e;
		return defaults;
	}
})();

interface PunishmentSettings {
	count?: number;
	certainty?: number;
	type?: string;
	punishment: typeof PUNISHMENTS[number];
}

interface FilterSettings {
	disabled?: boolean;
	thresholdIncrement: {turns: number, amount: number, minTurns?: number} | null;
	threshold: number;
	minScore: number;
	specials: {[k: string]: {[k: number]: number | "MAXIMUM"}};
	punishments: PunishmentSettings[];
}


interface BattleInfo {
	players: Record<SideID, ID>;
	log: string[];
}

// stolen from chatlog. necessary here, but importing chatlog sucks.
function nextMonth(month: string) {
	const next = new Date(new Date(`${month}-15`).getTime() + 30 * 24 * 60 * 60 * 1000);
	return next.toISOString().slice(0, 7);
}

function isFlaggedUserid(name: string, room: RoomID) {
	const id = toID(name);
	const entry = cache[room]?.staffNotified;
	if (!entry) return false;
	return typeof entry === 'string' ? entry === id : entry.includes(id);
}

// Mostly stolen from my code in helptickets.
// Necessary because we can't require this in without also requiring in a LOT of other
// modules, most of which crash the child process. Lot messier to fix that than it is to do this.
export function getBattleLog(battle: string) {
	const battleRoom = Rooms.get(battle);
	if (battleRoom && battleRoom.type !== 'chat') {
		const playerTable: Partial<BattleInfo['players']> = {};
		// i kinda hate this, but this will always be accurate to the battle players.
		// consulting room.battle.playerTable might be invalid (if battle is over), etc.
		const playerLines = battleRoom.log.log.filter(line => line.startsWith('|player|'));
		for (const line of playerLines) {
			const [, , playerSlot, name] = line.split('|');
			playerTable[playerSlot as SideID] = toID(name);
		}
		return {
			log: battleRoom.log.log.filter(k => k.startsWith('|c|')),
			players: playerTable as BattleInfo['players'],
		};
	}
	return null;
}
// see above comment.
function colorName(id: ID, info: BattleInfo) {
	for (const k in info.players) {
		const player = info.players[k as SideID];
		if (player === id) {
			return ` style="color: ${REPORT_NAMECOLORS[k]}"`;
		}
	}
	return REPORT_NAMECOLORS.other;
}

export const classifier = new Artemis.RemoteClassifier();

async function recommend(user: User, room: GameRoom, response: Record<string, number>) {
	const keys = Utils.sortBy(Object.keys(response), k => -response[k]);
	const recommended: [string, string][] = [];
	const prevRecommend = cache[room.roomid]?.recommended?.[user.id];
	for (const punishment of settings.punishments) {
		if (prevRecommend?.type) { // avoid making extra db queries by frontloading this check
			if (PUNISHMENTS.indexOf(punishment.punishment) <= PUNISHMENTS.indexOf(prevRecommend?.type)) continue;
		}
		for (const type of keys) {
			const num = response[type];
			if (punishment.type && punishment.type !== type) continue;
			if (punishment.certainty && punishment.certainty > num) continue;
			if (punishment.count) {
				const hits = await Chat.database.all(
					`SELECT * FROM perspective_flags WHERE userid = ? AND type = ? AND certainty >= ?`,
					[user.id, type, num]
				);
				if (hits.length < punishment.count) continue;
				recommended.push([punishment.punishment, type]);
			}
		}
	}
	if (recommended.length) {
		Utils.sortBy(recommended, ([punishment]) => -PUNISHMENTS.indexOf(punishment));
		// go by most severe
		const [punishment, reason] = recommended[0];
		if (cache[room.roomid]) {
			if (!cache[room.roomid].recommended) cache[room.roomid].recommended = {};
			cache[room.roomid].recommended![user.id] = {type: punishment, reason: reason.replace(/_/g, ' ').toLowerCase()};
		}
		Rooms.get('abuselog')?.add(
			`|c|&|/log [Abuse-Monitor] ` +
			`<<${room.roomid}>> - punishment ${punishment} recommended for ${user.id} ` +
			`(${reason.replace(/_/g, ' ').toLowerCase()})`
		).update();
	}
}

function makeScore(roomid: RoomID, result: Record<string, number>) {
	let score = 0;
	let main = '';
	const flags = new Set<string>();
	for (const type in result) {
		const data = result[type];
		if (settings.minScore && data < settings.minScore) continue;
		const curScore = score;
		if (settings.specials[type]) {
			for (const k in settings.specials[type]) {
				if (data < Number(k)) continue;
				const num = settings.specials[type][k];
				if (num === 'MAXIMUM') {
					score = calcThreshold(roomid);
					main = type;
				} else {
					if (num > score) {
						score = num;
						main = type;
					}
				}
			}
		}
		if (settings.minScore) {
			// min score ensures that if a category is above that minimum score, they will get
			// at least a point.
			// we previously ensured that this was above minScore if set, so this is fine
			if (score < 1) {
				score = 1;
				main = type;
			}
		}
		if (score !== curScore) flags.add(type);
	}
	return {score, flags: [...flags], main};
}

export const chatfilter: Chat.ChatFilter = function (message, user, room) {
	// 2 lines to not hit max-len
	if (!room?.battle || !['rated', 'unrated'].includes(room.battle.challengeType)) return;
	if (settings.disabled) return;
	// startsWith('!') - broadcasting command, ignore it.
	if (!Config.perspectiveKey || message.startsWith('!')) return;

	const roomid = room.roomid;
	void (async () => {
		const response = await classifier.classify(message);
		const {score, flags, main} = makeScore(roomid, response || {});
		if (score) {
			if (!cache[roomid]) cache[roomid] = {users: {}};
			if (!cache[roomid].users[user.id]) cache[roomid].users[user.id] = 0;
			cache[roomid].users[user.id] += score;
			let hitThreshold = 0;
			if (cache[roomid].users[user.id] >= calcThreshold(roomid)) {
				let notified = cache[roomid].staffNotified;
				if (notified) {
					if (!Array.isArray(notified)) {
						cache[roomid].staffNotified = notified = [notified];
					}
					if (!notified.includes(user.id)) {
						notified.push(user.id);
					}
				} else {
					cache[roomid].staffNotified = [user.id];
				}
				notifyStaff();
				hitThreshold = 1;
				void room?.uploadReplay?.(user, this.connection, "forpunishment");
				await Chat.database.run(
					`INSERT INTO perspective_flags (userid, score, certainty, type, roomid, time) VALUES (?, ?, ?, ?, ?, ?)`,
					// response exists if we got this far
					[user.id, score, response![main], main, room.roomid, Date.now()]
				);
				void recommend(user, room, response || {});
			}
			await Chat.database.run(
				'INSERT INTO perspective_logs (userid, message, score, flags, roomid, time, hit_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)',
				[user.id, message, score, Utils.sortBy(flags).join(','), roomid, Date.now(), hitThreshold]
			);
		}
	})();
};
// to avoid conflicts with other filters
chatfilter.priority = -100;

function calcThreshold(roomid: RoomID) {
	const incr = settings.thresholdIncrement;
	let num = settings.threshold;
	const room = Rooms.get(roomid);
	if (!room || !room.battle || !incr) return num;
	if (!incr.minTurns || room.battle.turn >= incr.minTurns) {
		num += (Math.floor(room.battle.turn / incr.turns) * incr.amount);
	}
	return num;
}

export const handlers: Chat.Handlers = {
	onRoomDestroy(roomid) {
		const entry = cache[roomid];
		if (entry) {
			delete cache[roomid];
			if (entry.staffNotified) {
				notifyStaff();
				void Chat.database.run(
					`INSERT INTO perspective_stats (staff, roomid, result, timestamp) VALUES ($staff, $roomid, $result, $timestamp) ` +
					`ON CONFLICT (roomid) DO UPDATE SET result = $result, timestamp = $timestamp`,
					// 2 means dead
					{staff: '', roomid, result: 2, timestamp: Date.now()}
				);
			}
		}
	},
	onRoomClose(roomid, user) {
		if (!roomid.startsWith('view-abusemonitor-view')) return;
		const targetId = roomid.slice('view-abusemonitor-view-'.length);
		if (cache[targetId]?.claimed === user.id) {
			delete cache[targetId].claimed;
			notifyStaff();
		}
	},
	onRenameRoom(oldId, newId, room) {
		if (cache[oldId]) {
			cache[newId] = cache[oldId];
			delete cache[oldId];
			notifyStaff();
		}
	},
};

function getFlaggedRooms() {
	return Object.keys(cache).filter(roomid => cache[roomid].staffNotified);
}

function saveSettings(isBackup = false) {
	FS(`config/chat-plugins/nf${isBackup ? ".backup" : ""}.json`).writeUpdate(() => JSON.stringify(settings));
}

export function notifyStaff() {
	const staffRoom = Rooms.get('staff');
	if (staffRoom) {
		const flagged = getFlaggedRooms();
		let buf = '';
		if (flagged.length) {
			const unclaimed = flagged.filter(f => f in cache && !cache[f].claimed);
			// if none are unclaimed, remove the notifying property so it's regular grey
			buf = `<button class="button${!unclaimed.length ? '' : ' notifying'}" name="send" value="/am">`;
			buf += `${Chat.count(flagged.length, 'flagged battles')}`;
			// if some are unclaimed, tell staff how many
			if (unclaimed.length) {
				buf += ` (${unclaimed.length} unclaimed)`;
			}
			buf += `</button>`;
		} else {
			buf = 'No battles flagged.';
		}
		staffRoom.send(`|uhtml|abusemonitor|<div class="infobox">${buf}</div>`);
		Chat.refreshPageFor('abusemonitor-flagged', staffRoom);
	}
}

function checkAccess(context: Chat.CommandContext | Chat.PageContext) {
	if (!WHITELIST.includes(context.user.id)) context.checkCan('bypassall');
}

export const commands: Chat.ChatCommands = {
	am: 'abusemonitor',
	abusemonitor: {
		''() {
			return this.parse('/join view-abusemonitor-flagged');
		},
		async test(target, room, user) {
			checkAccess(this);
			const text = target.trim();
			if (!text) return this.parse(`/help abusemonitor`);
			this.runBroadcast();
			let response = await classifier.classify(text);
			if (!response) response = {};
			// intentionally hardcoded to staff to ensure threshold is never altered.
			const {score, flags} = makeScore('staff', response);
			let buf = `<strong>Score for "${text}":</strong> ${score}<br />`;
			buf += `<strong>Flags:</strong> ${flags.join(', ')}<br />`;
			buf += `<strong>Score breakdown:</strong><br />`;
			for (const k in response) {
				buf += `&bull; ${k}: ${response[k]}<br />`;
			}
			this.sendReplyBox(buf);
		},
		toggle(target) {
			checkAccess(this);
			if (this.meansYes(target)) {
				if (!settings.disabled) return this.errorReply(`The abuse monitor is already enabled.`);
				settings.disabled = false;
			} else if (this.meansNo(target)) {
				if (settings.disabled) return this.errorReply(`The abuse monitor is already disabled.`);
				settings.disabled = true;
			} else {
				return this.errorReply(`Invalid setting. Must be 'on' or 'off'.`);
			}
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(`${this.user.name} ${!settings.disabled ? 'enabled' : 'disabled'} the abuse monitor.`);
			this.globalModlog('ABUSEMONITOR', null, !settings.disabled ? 'enable' : 'disable');
		},
		threshold(target) {
			checkAccess(this);
			if (!target) {
				return this.sendReply(`The current abuse monitor threshold is ${settings.threshold}.`);
			}
			const num = parseInt(target);
			if (isNaN(num)) {
				this.errorReply(`Invalid number: ${target}`);
				return this.parse(`/help abusemonitor`);
			}
			if (settings.threshold === num) {
				return this.errorReply(`The abuse monitor threshold is already ${num}.`);
			}
			settings.threshold = num;
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(`${this.user.name} set the abuse monitor trigger threshold to ${num}.`);
			this.globalModlog('ABUSEMONITOR THRESHOLD', null, `${num}`);
			this.sendReply(
				`|html|Remember to use <code>/am respawn</code> to deploy the settings to the child process.`
			);
		},
		async resolve(target) {
			this.checkCan('lock');
			target = target.toLowerCase().trim().replace(/ +/g, '');
			let [roomid, rawResult] = Utils.splitFirst(target, ',').map(f => f.trim());
			const tarRoom = Rooms.get(roomid);
			if (!tarRoom || !cache[tarRoom.roomid] || !cache[tarRoom.roomid]?.staffNotified) {
				return this.popupReply(`That room has not been flagged by the abuse monitor.`);
			}
			if (roomid.includes('-') && roomid.endsWith('pw')) {
				// cut off passwords
				roomid = roomid.split('-').slice(0, -1).join('-');
			}
			let result = toID(rawResult) === 'success' ? 1 : toID(rawResult) === 'failure' ? 0 : null;
			if (result === null) return this.popupReply(`Invalid result - must be 'success' or 'failure'.`);
			const inserted = await Chat.database.get(`SELECT result FROM perspective_stats WHERE roomid = ?`, [roomid]);
			if (inserted?.result === 1) { // (hardcode on 1 because 2 is dead)
				// has already been logged as accurate - ensure if one success is logged it's still a success if it's hit again
				// (even if it's a failure now, it was a success before - that's what's relevant.)
				result = inserted.result;
			}
			// we delete the cache because if more stuff happens in it
			// post punishment, we want to know about it
			delete cache[tarRoom.roomid];
			notifyStaff();
			this.closePage(`abusemonitor-view-${tarRoom.roomid}`);
			// bring the listing page to the front - need to close and reopen
			this.closePage(`abusemonitor-flagged`);
			await Chat.database.run(
				`INSERT INTO perspective_stats (staff, roomid, result, timestamp) VALUES ($staff, $roomid, $result, $timestamp) ` +
				// on conflict in case it's re-triggered later.
				// (we want it to be updated to success if it is now a success where it was previously inaccurate)
				`ON CONFLICT (roomid) DO UPDATE SET result = $result, timestamp = $timestamp`,
				{staff: this.user.id, roomid, result, timestamp: Date.now()}
			);
			return this.parse(`/j view-abusemonitor-flagged`);
		},
		async nojoinpunish(target, room, user) {
			this.checkCan('lock');
			const [roomid, type, rest] = Utils.splitFirst(target, ',', 2).map(f => f.trim());
			const tarRoom = Rooms.get(roomid);
			if (!tarRoom) return this.popupReply(`The room "${roomid}" does not exist.`);
			const cmd = NOJOIN_COMMAND_WHITELIST[toID(type)];
			if (!cmd) {
				return this.errorReply(
					`Invalid punishment given. ` +
					`Must be one of ${Object.keys(NOJOIN_COMMAND_WHITELIST).join(', ')}.`
				);
			}
			this.room = tarRoom;
			this.room.reportJoin('j', user.getIdentityWithStatus(this.room), user);
			const result = await this.parse(`${cmd} ${rest}`, {bypassRoomCheck: true});
			if (result) { // command succeeded - send followup
				this.add(
					'|c|&|/raw If you have questions about this action, please contact staff ' +
					'by making a <a href="view-help-request" class="button">help ticket</a>'
				);
			}
			this.room.reportJoin('l', user.getIdentityWithStatus(this.room), user);
		},
		view(target, room, user) {
			target = target.toLowerCase().trim();
			if (!target) return this.parse(`/help am`);
			return this.parse(`/j view-abusemonitor-view-${target}`);
		},
		logs(target) {
			checkAccess(this);
			const [count, userid] = Utils.splitFirst(target, ',').map(toID);
			this.parse(`/join view-abusemonitor-logs-${count || '200'}${userid ? `-${userid}` : ""}`);
		},
		stats(target) {
			checkAccess(this);
			return this.parse(`/join view-abusemonitor-stats${target ? `-${target}` : ''}`);
		},
		async respawn(target, room, user) {
			checkAccess(this);
			this.sendReply(`Respawning...`);
			const unspawned = await classifier.respawn();
			this.sendReply(`DONE. ${Chat.count(unspawned, 'processes', 'process')} unspawned.`);
			this.addGlobalModAction(`${user.name} used /abusemonitor respawn`);
		},
		async userclear(target, room, user) {
			checkAccess(this);
			const {targetUsername, rest} = this.splitUser(target);
			const targetId = toID(targetUsername);
			if (!targetId) return this.parse(`/help abusemonitor`);
			if (user.lastCommand !== `am userclear ${targetId}`) {
				user.lastCommand = `am userclear ${targetId}`;
				this.errorReply(`Are you sure you want to clear abuse monitor database records for ${targetId}?`);
				this.errorReply(`Retype the command if you're sure.`);
				return;
			}
			user.lastCommand = '';
			const results = await Chat.database.run(
				'DELETE FROM perspective_logs WHERE userid = ?', [targetId]
			);
			if (!results.changes) {
				return this.errorReply(`No logs for ${targetUsername} found.`);
			}
			this.sendReply(`${results.changes} log(s) cleared for ${targetId}.`);
			this.privateGlobalModAction(`${user.name} cleared abuse monitor logs for ${targetUsername}${rest ? ` (${rest})` : ""}.`);
			this.globalModlog('ABUSEMONITOR CLEAR', targetId, rest);
		},
		async deletelog(target, room, user) {
			checkAccess(this);
			target = toID(target);
			if (!target) return this.parse(`/help abusemonitor`);
			const num = parseInt(target);
			if (isNaN(num)) {
				return this.errorReply(`Invalid log number: ${target}`);
			}
			const row = await Chat.database.get(
				'SELECT * FROM perspective_logs WHERE rowid = ?', [num]
			);
			if (!row) {
				return this.errorReply(`No log with ID ${num} found.`);
			}
			await Chat.database.run( // my kingdom for RETURNING * in sqlite :(
				'DELETE FROM perspective_logs WHERE rowid = ?', [num]
			);
			this.sendReply(`Log ${num} deleted.`);
			this.privateGlobalModAction(`${user.name} deleted an abuse monitor log for the user ${row.userid}.`);
			this.stafflog(
				`Message: "${row.message}", room: ${row.roomid}, time: ${Chat.toTimestamp(new Date(row.time))}`
			);
			this.globalModlog("ABUSEMONITOR DELETELOG", row.userid, `${num}`);
			Chat.refreshPageFor('abusemonitor-logs', 'staff', true);
		},
		es: 'editspecial',
		editspecial(target, room, user) {
			checkAccess(this);
			if (!toID(target)) return this.parse(`/help abusemonitor`);
			let [rawType, rawPercent, rawScore] = target.split(',');
			const type = rawType.toUpperCase().replace(/\s/g, '_');
			rawScore = toID(rawScore);
			const types = {...Artemis.RemoteClassifier.ATTRIBUTES, "ALL": {}};
			if (!(type in types)) {
				return this.errorReply(`Invalid type: ${type}. Valid types: ${Object.keys(types).join(', ')}.`);
			}
			const percent = parseFloat(rawPercent);
			if (isNaN(percent) || percent > 1 || percent < 0) {
				return this.errorReply(`Invalid percent: ${percent}. Must be between 0 and 1.`);
			}
			const score = parseInt(rawScore) || toID(rawScore).toUpperCase() as 'MAXIMUM';
			switch (typeof score) {
			case 'string':
				if (score !== 'MAXIMUM') {
					return this.errorReply(`Invalid score. Must be a number or "MAXIMUM".`);
				}
				break;
			case 'number':
				if (isNaN(score) || score < 0) {
					return this.errorReply(`Invalid score. Must be a number or "MAXIMUM".`);
				}
				break;
			}
			if (settings.specials[type]?.[percent] && !this.cmd.includes('f')) {
				return this.errorReply(`That special case already exists. Use /am forceeditspecial to change it.`);
			}
			if (!settings.specials[type]) settings.specials[type] = {};
			// checked above to ensure it's a valid number or MAXIMUM
			settings.specials[type][percent] = score;
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(`${user.name} set the abuse monitor special case for ${type} at ${percent}% to ${score}.`);
			this.globalModlog("ABUSEMONITOR SPECIAL", type, `${percent}% to ${score}`);
			this.sendReply(`|html|Remember to use <code>/am respawn</code> to deploy the settings to the child processes.`);
		},
		ds: 'deletespecial',
		deletespecial(target, room, user) {
			checkAccess(this);
			const [rawType, rawPercent] = target.split(',');
			const type = rawType.toUpperCase().replace(/\s/g, '_');
			const types = {...Artemis.RemoteClassifier.ATTRIBUTES, "ALL": {}};
			if (!(type in types)) {
				return this.errorReply(`Invalid type: ${type}. Valid types: ${Object.keys(types).join(', ')}.`);
			}
			const percent = parseFloat(rawPercent);
			if (isNaN(percent) || percent > 1 || percent < 0) {
				return this.errorReply(`Invalid percent: ${percent}. Must be between 0 and 1.`);
			}
			if (!settings.specials[type]?.[percent]) {
				return this.errorReply(`That special case does not exist.`);
			}
			delete settings.specials[type][percent];
			if (!Object.keys(settings.specials[type]).length) {
				delete settings.specials[type];
			}
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(`${user.name} deleted the abuse monitor special case for ${type} at ${percent}%.`);
			this.globalModlog("ABUSEMONITOR DELETESPECIAL", type, `${percent}%`);
			this.sendReply(`|html|Remember to use <code>/am respawn</code> to deploy the settings to the child processes.`);
		},
		em: 'editmin',
		editmin(target, room, user) {
			checkAccess(this);
			const num = parseFloat(target);
			if (isNaN(num) || num < 0 || num > 1) {
				return this.errorReply(`Invalid minimum score: ${num}. Must be a positive integer.`);
			}
			settings.minScore = num;
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(`${user.name} set the abuse monitor minimum score to ${num}.`);
			this.globalModlog("ABUSEMONITOR MIN", null, "" + num);
			this.sendReply(`|html|Remember to use <code>/am respawn</code> to deploy the settings to the child processes.`);
		},
		ap: 'addpunishment',
		addpunishment(target, room, user) {
			checkAccess(this);
			if (!toID(target)) return this.parse(`/help am`);
			const targets = target.split(',').map(f => f.trim());
			const punishment: Partial<PunishmentSettings> = {};
			for (const cur of targets) {
				let [key, value] = Utils.splitFirst(cur, '=').map(f => f.trim());
				key = toID(key);
				if (!key || !value) { // sent from the page, val wasn't sent.
					continue;
				}
				switch (key) {
				case 'punishment': case 'p':
					if (punishment.punishment) {
						return this.errorReply(`Duplicate punishment values.`);
					}
					value = toID(value).toUpperCase();
					if (!PUNISHMENTS.includes(value)) {
						return this.errorReply(`Invalid punishment: ${value}. Valid punishments: ${PUNISHMENTS.join(', ')}.`);
					}
					punishment.punishment = value;
					break;
				case 'count': case 'num': case 'c':
					if (punishment.count) {
						return this.errorReply(`Duplicate count values.`);
					}
					const num = parseInt(value);
					if (isNaN(num)) {
						return this.errorReply(`Invalid count '${value}'. Must be a number.`);
					}
					punishment.count = num;
					break;
				case 'type': case 't':
					if (punishment.type) {
						return this.errorReply(`Duplicate type values.`);
					}
					value = value.replace(/\s/g, '_').toUpperCase();
					if (!Artemis.RemoteClassifier.ATTRIBUTES[value as keyof typeof Artemis.RemoteClassifier.ATTRIBUTES]) {
						return this.errorReply(
							`Invalid attribute: ${value}. ` +
							`Valid attributes: ${Object.keys(Artemis.RemoteClassifier.ATTRIBUTES).join(', ')}.`
						);
					}
					punishment.type = value;
					break;
				case 'certainty': case 'ct':
					if (punishment.certainty) {
						return this.errorReply(`Duplicate certainty values.`);
					}
					const certainty = parseFloat(value);
					if (isNaN(certainty) || certainty > 1 || certainty < 0) {
						return this.errorReply(`Invalid certainty '${value}'. Must be a number above 0 and below 1.`);
					}
					punishment.certainty = certainty;
					break;
				default:
					this.errorReply(`Invalid key:  ${key}`);
					return this.parse(`/help am`);
				}
			}
			if (!punishment.punishment) {
				return this.errorReply(`A punishment type must be specified.`);
			}
			for (const [i, p] of settings.punishments.entries()) {
				let matches = 0;
				for (const k in p) {
					if (p[k as keyof PunishmentSettings] === punishment[k as keyof PunishmentSettings]) matches++;
				}
				if (matches === Object.keys(p).length) {
					return this.errorReply(`This punishment is already stored at ${i + 1}.`);
				}
			}
			settings.punishments.push(punishment as PunishmentSettings);
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(`${user.name} added a ${punishment.punishment} abuse-monitor punishment.`);
			const str = Object.keys(punishment).map(f => `${f}: ${punishment[f as keyof PunishmentSettings]}`).join(', ');
			this.stafflog(`Info: ${str}`);
			this.globalModlog(`ABUSEMONITOR ADDPUNISHMENT`, null, str);
		},
		dp: 'deletepunishment',
		deletepunishment(target, room, user) {
			checkAccess(this);
			const idx = parseInt(target) - 1;
			if (isNaN(idx)) return this.errorReply(`Invalid number.`);
			const punishment = settings.punishments[idx];
			if (!punishment) {
				return this.errorReply(`No punishments exist at index ${idx + 1}.`);
			}
			settings.punishments.splice(idx, 1);
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(`${user.name} removed the abuse-monitor punishment indexed at ${idx + 1}.`);
			this.stafflog(
				`Punishment: ` +
				`${Object.keys(punishment).map(f => `${f}: ${punishment[f as keyof PunishmentSettings]}`).join(', ')}`
			);
			this.globalModlog(`ABUSEMONITOR REMOVEPUNISHMENT`, null, `${idx + 1}`);
		},
		vs: 'viewsettings',
		settings: 'viewsettings',
		viewsettings() {
			checkAccess(this);
			return this.parse(`/join view-abusemonitor-settings`);
		},
		ti: 'thresholdincrement',
		thresholdincrement(target, room, user) {
			checkAccess(this);
			if (!toID(target)) {
				return this.parse(`/help am`);
			}
			const [rawTurns, rawIncrement, rawMin] = Utils.splitFirst(target, ',', 2).map(toID);
			const turns = parseInt(rawTurns);
			if (isNaN(turns) || turns < 0) {
				return this.errorReply(`Turns must be a number above 0.`);
			}
			const increment = parseInt(rawIncrement);
			if (isNaN(increment) || increment < 0) {
				return this.errorReply(`The increment must be a number above 0.`);
			}
			const min = parseInt(rawMin);
			if (rawMin && isNaN(min)) {
				return this.errorReply(`Invalid minimum (must be a number).`);
			}
			settings.thresholdIncrement = {amount: increment, turns};
			if (min) {
				settings.thresholdIncrement.minTurns = min;
			}
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(
				`${user.name} set the abuse-monitor threshold increment ${increment} every ${Chat.count(turns, 'turns')}` +
				`${min ? ` after ${Chat.count(min, 'turns')}` : ""}`
			);
			this.globalModlog(
				`ABUSEMONITOR INCREMENT`, null, `${increment} every ${turns} turn(s)${min ? ` after ${min} turn(s)` : ""}`
			);
		},
		di: 'deleteincrement',
		deleteincrement(target, room, user) {
			checkAccess(this);
			if (!settings.thresholdIncrement) return this.errorReply(`The threshold increment is already disabled.`);
			settings.thresholdIncrement = null;
			saveSettings();
			this.refreshPage('abusemonitor-settings');
			this.privateGlobalModAction(`${user.name} disabled the abuse-monitor threshold increment.`);
			this.globalModlog(`ABUSEMONITOR DISABLEINCREMENT`);
		},
		async failures(target) {
			checkAccess(this);
			if (!toID(target)) {
				target = Chat.toTimestamp(new Date()).split(' ')[0];
			}
			const timeNum = new Date(target).getTime();
			if (isNaN(timeNum)) {
				return this.errorReply(`Invalid date.`);
			}
			let logs = await Chat.database.all(
				'SELECT * FROM perspective_stats WHERE result = 0 AND timestamp > ? AND timestamp < ?',
				[timeNum, timeNum + 24 * 60 * 60 * 1000]
			);
			logs = logs.filter(log => ( // proofing against node's stupid date lib
				Chat.toTimestamp(new Date(log.timestamp)).split(' ')[0] === target
			));
			if (!logs.length) {
				return this.errorReply(`No logs found for that date.`);
			}
			this.sendReplyBox(
				`<strong>${Chat.count(logs, 'logs')}</strong> found on the date ${target}:<hr />` +
				logs.map(f => `<a href="/${f.roomid}">${f.roomid}</a>`).join('<br />')
			);
		},
		bs: 'backupsettings',
		backupsettings(target, room, user) {
			checkAccess(this);
			saveSettings(true);
			this.addGlobalModAction(`${user.name} used /abusemonitor backupsettings`);
			this.refreshPage('abusemonitor-settings');
		},
		lb: 'loadbackup',
		async loadbackup(target, room, user) {
			checkAccess(this);
			const backup = await FS('config/chat-plugins/nf.backup.json').readIfExists();
			if (!backup) return this.errorReply(`No backup settings saved.`);
			const backupSettings = JSON.parse(backup);
			Object.assign(settings, backupSettings);
			saveSettings();
			this.addGlobalModAction(`${user.name} used /abusemonitor loadbackup`);
			this.refreshPage('abusemonitor-settings');
		},
	},
	abusemonitorhelp: [
		`/am toggle - Toggle the abuse monitor on and off. Requires: whitelist &`,
		`/am threshold [number] - Set the abuse monitor trigger threshold. Requires: whitelist &`,
		`/am resolve [room] - Mark a abuse monitor flagged room as handled by staff. Requires: % @ &`,
		`/am respawn - Respawns abuse monitor processes. Requires: whitelist &`,
		`/am logs [count][, userid] - View logs of recent matches by the abuse monitor. `,
		`If a userid is given, searches only logs from that userid. Requires: whitelist &`,
		`/am userclear [user] - Clear all logged abuse monitor hits for a user. Requires: whitelist &`,
		`/am deletelog [number] - Deletes a abuse monitor log matching the row ID [number] given. Requires: whitelist &`,
		`/am editspecial [type], [percent], [score] - Sets a special case for the abuse monitor. Requires: whitelist &`,
		`[score] can be either a number or MAXIMUM, which will set it to the maximum score possible (that will trigger an action)`,
		`/am deletespecial [type], [percent] - Deletes a special case for the abuse monitor. Requires: whitelist &`,
		`/am editmin [number] - Sets the minimum percent needed to process for all flags. Requires: whitelist &`,
		`/am viewsettings - View the current settings for the abuse monitor. Requires: whitelist &`,
		`/am thresholdincrement [num], [amount][, min turns] - Sets the threshold increment for the abuse monitor to increase [amount] every [num] turns.`,
		`If [min turns] is provided, increments will start after that turn number. Requires: whitelist &`,
		`/am deleteincrement - clear abuse-monitor threshold increment. Requires: whitelist &`,
	],
};

export const pages: Chat.PageTable = {
	abusemonitor: {
		flagged(query, user) {
			this.checkCan('lock');
			const ids = getFlaggedRooms();
			this.title = '[Abuse Monitor] Flagged rooms';
			let buf = `<div class="pad">`;
			buf += `<h2>Flagged rooms</h2>`;
			if (!ids.length) {
				buf += `<p class="error">No rooms have been flagged recently.</p>`;
				return buf;
			}
			buf += `<p>Currently flagged rooms: ${ids.length}</p>`;
			buf += `<div class="ladder pad">`;
			buf += `<table><tr><th>Status</th><th>Room</th><th>Claimed by</th><th>Action</th></tr>`;
			for (const roomid of ids) {
				const entry = cache[roomid];
				buf += `<tr>`;
				if (entry.claimed) {
					buf += `<td><span style="color:green">`;
					buf += `<i class="fa fa-circle-o"></i> <strong>Claimed</strong></span></td>`;
				} else {
					buf += `<td><span style="color:orange">`;
					buf += `<i class="fa fa-circle-o"></i> <strong>Unclaimed</strong></span></td>`;
				}
				// should never happen, fallback just in case
				buf += Utils.html`<td>${Rooms.get(roomid)?.title || roomid}</td>`;
				buf += `<td>${entry.claimed ? entry.claimed : '-'}</td>`;
				buf += `<td><button class="button" name="send" value="/am view ${roomid}">`;
				buf += `${entry.claimed ? 'Show' : 'Claim'}</button></td>`;
				buf += `</tr>`;
			}
			buf += `</table></div>`;
			return buf;
		},
		view(query, user) {
			this.checkCan('lock');
			const roomid = query.join('-') as RoomID;
			if (!toID(roomid)) {
				return this.errorReply(`You must specify a roomid to view abuse monitor data for.`);
			}
			let buf = `<div class="pad">`;
			buf += `<button style="float:right;" class="button" name="send" value="/join ${this.pageid}">`;
			buf += `<i class="fa fa-refresh"></i> Refresh</button>`;
			buf += `<h2>Abuse Monitor`;
			const room = Rooms.get(roomid);
			if (!room) {
				if (cache[roomid]) {
					delete cache[roomid];
					notifyStaff();
				}
				buf += `</h2><hr /><p class="error">No such room.</p>`;
				return buf;
			}
			room.pokeExpireTimer(); // don't want it to expire while staff are reviewing
			if (!cache[roomid]) {
				buf += `</h2><hr /><p class="error">The abuse monitor has not flagged the given room.</p>`;
				return buf;
			}
			const titleParts = room.roomid.split('-');
			if (titleParts[titleParts.length - 1].endsWith('pw')) {
				titleParts.pop(); // remove password
			}
			buf += Utils.html` - ${room.title}</h2>`;
			this.title = `[Abuse Monitor] ${titleParts.join('-')}`;
			buf += `<p>${Chat.formatText(`<<${room.roomid}>>`)}</p>`;
			buf += `<hr />`;
			if (!cache[roomid].claimed) {
				cache[roomid].claimed = user.id;
				notifyStaff();
			} else {
				buf += `<p><strong>Claimed:</strong> ${cache[roomid].claimed}</p>`;
			}

			buf += `<details class="readmore"><summary><strong>Chat:</strong></summary><div class="infobox">`;
			// we parse users specifically from the log so we can see it after they leave the room
			const users = new Utils.Multiset<string>();
			const logData = getBattleLog(room.roomid);
			// should only extremely rarely happen - if the room expires while this is happening.
			if (!logData) return `<div class="pad"><p class="error">No such room.</p></div>`;
			// assume logs exist - why else would the filter activate?
			for (const line of logData.log) {
				const data = room.log.parseChatLine(line);
				if (!data) continue; // not chat
				if (['/log', '/raw'].some(prefix => data.message.startsWith(prefix))) {
					continue;
				}
				const id = toID(data.user);
				if (!id) continue;
				users.add(id);
				buf += `<div class="chat chatmessage">`;
				buf += `<strong${colorName(id, logData)}>`;
				buf += Utils.html`<span class="username">${data.user}:</span></strong> ${data.message}</div>`;
			}
			buf += `</div></details>`;
			const recs = cache[roomid].recommended || {};
			if (Object.keys(recs).length) {
				for (const id in recs) {
					const rec = recs[id];
					buf += `<p><strong>Recommended action for ${id}:</strong> ${rec.type} (${rec.reason})</p>`;
				}
			}
			buf += `<p><strong>Users:</strong><small> (click a name to punish)</small></p>`;
			const sortedUsers = Utils.sortBy([...users], ([id, num]) => (
				[isFlaggedUserid(id, roomid), -num, id]
			));
			for (const [id] of sortedUsers) {
				const curUser = Users.getExact(id);
				buf += Utils.html`<details class="readmore"><summary>${curUser?.name || id} `;
				buf += `<button class="button" name="send" value="/mlid ${id},room=global">Modlog</button>`;
				buf += `</summary><div class="infobox">`;
				const punishments = ['Warn', 'Lock', 'Weeklock', 'Forcerename', 'Namelock', 'Weeknamelock'];
				for (const name of punishments) {
					buf += `<form data-submitsend="/am nojoinpunish ${roomid},${toID(name)},${id},{reason}">`;
					buf += `<button class="button notifying" type="submit">${name}</button><br />`;
					buf += `Optional reason: <input name="reason" />`;
					buf += `</form><br />`;
				}
				buf += `</div></details><br />`;
			}
			buf += `<hr /><strong>Mark resolved:</strong><br />`;
			buf += `<button class="button" name="send" value="/msgroom staff, /am resolve ${room.roomid},success">As accurate flag</button> | `;
			buf += `<button class="button" name="send" value="/msgroom staff, /am resolve ${room.roomid},failure">As inaccurate flag</button>`;
			return buf;
		},
		async logs(query, user) {
			checkAccess(this);
			this.title = '[Abuse Monitor] Logs';
			let buf = `<div class="pad">`;
			buf += `<h2>Abuse Monitor Logs</h2><hr />`;
			const rawCount = query.shift() || "";
			let count = 200;
			if (rawCount) {
				count = parseInt(rawCount);
				if (isNaN(count)) {
					buf += `<p class="message-error">Invalid limit specified: ${rawCount}</p>`;
					return buf;
				}
			}
			const userid = toID(query.shift());
			let logQuery = `SELECT rowid, * FROM perspective_logs `;
			const args = [];
			if (userid) {
				logQuery += `WHERE userid = ? `;
				args.push(userid);
			}
			logQuery += `ORDER BY rowid DESC LIMIT ?`;
			args.push(count);

			const logs = await Chat.database.all(logQuery, args);
			if (!logs.length) {
				buf += `<p class="message-error">No logs found${userid ? ` for the user ${userid}` : ""}.</p>`;
				return buf;
			}
			Utils.sortBy(logs, log => [-log.time, log.roomid, log.userid]);
			buf += `<p>${logs.length} log(s) found.</p>`;
			buf += `<div class="ladder pad">`;
			buf += `<table><tr><th>Room</th>`;
			if (!userid) {
				buf += `<th>User</th>`;
			}
			buf += `<th>Message</th>`;
			buf += `<th>Time</th><th>Score / Flags</th><th>Other data</th><th>Manage</th></tr>`;
			const prettifyFlag = (flag: string) => flag.toLowerCase().replace(/_/g, ' ');
			for (const log of logs) {
				const {roomid} = log;
				buf += `<tr>`;
				buf += `<td><a href="https://${Config.routes.replays}/${roomid.slice(7)}">${roomid}</a></td>`;
				if (!userid) buf += `<td>${log.userid}</td>`;
				buf += Utils.html`<td>${log.message}</td>`;
				buf += `<td>${Chat.toTimestamp(new Date(log.time))}</td>`;
				buf += `<td>${log.score} (${log.flags.split(',').map(prettifyFlag).join(', ')})</td>`;
				buf += `<td>Hit threshold: ${log.hit_threshold ? 'Yes' : 'No'}</td><td>`;
				buf += `<button class="button" name="send" value="/msgroom staff,/abusemonitor deletelog ${log.rowid}">Delete</button>`;
				buf += `</td>`;
				buf += `</tr>`;
			}
			buf += `</table></div>`;
			// assume this probably means there are more.
			// if there's less than the count we requested, that's as far as it goes.
			if (count === logs.length) {
				buf += `<center>`;
				buf += `<button class="button" name="send" value="/msgroom staff, /am logs ${count + 100}">Show 100 more</button>`;
				buf += `</center>`;
			}
			return buf;
		},
		async stats(query, user) {
			checkAccess(this);
			const date = new Date(query.join('-') || Chat.toTimestamp(new Date()).split(' ')[0]);
			if (isNaN(date.getTime())) {
				return this.errorReply(`Invalid date: ${date}`);
			}
			const month = Chat.toTimestamp(date).split(' ')[0].slice(0, -3);
			let buf = `<div class="pad">`;
			buf += `<button style="float:right;" class="button" name="send" value="/join ${this.pageid}">`;
			buf += `<i class="fa fa-refresh"></i> Refresh</button>`;
			buf += `<h2>Abuse Monitor stats for ${month}</h2>`;
			const next = nextMonth(month);
			const prev = new Date(new Date(`${month}-15`).getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 7);
			buf += `<a class="button" target="replace" href="/view-abusemonitor-stats-${prev}-15">Previous month</a> | `;
			buf += `<a class="button" target="replace" href="/view-abusemonitor-stats-${next}-15">Next month</a>`;
			buf += `<hr />`;
			const logs = await Chat.database.all(
				`SELECT * FROM perspective_stats WHERE timestamp > ? AND timestamp < ?`,
				[new Date(month).getTime(), new Date(nextMonth(month)).getTime()]
			);
			this.title = '[Abuse Monitor] Stats';
			if (!logs.length) {
				buf += `<p class="message-error">No logs found for the month ${month}.</p>`;
				return buf;
			}
			this.title += ` ${month}`;
			buf += `<p>${Chat.count(logs.length, 'logs')} found.</p>`;
			let successes = 0;
			let failures = 0;
			let dead = 0;
			const staffStats: Record<string, number> = {};
			const dayStats: Record<string, {successes: number, failures: number, dead: number, total: number}> = {};
			for (const log of logs) {
				const cur = Chat.toTimestamp(new Date(log.timestamp)).split(' ')[0];
				if (!dayStats[cur]) dayStats[cur] = {successes: 0, failures: 0, dead: 0, total: 0};
				if (log.result === 2) {
					dead++;
					dayStats[cur].dead++;
					// don't increment total - we don't want dead to count in the percentages
					continue;
				} else if (log.result === 1) {
					successes++;
					dayStats[cur].successes++;
				} else {
					failures++;
					dayStats[cur].failures++;
				}
				if (!staffStats[log.staff]) staffStats[log.staff] = 0;
				staffStats[log.staff]++;
				dayStats[cur].total++;
			}
			const percent = (numerator: number, denom: number) => Math.floor((numerator / denom) * 100);
			buf += `<p><strong>Success rate:</strong> ${percent(successes, successes + failures)}% (${successes})</p>`;
			buf += `<p><strong>Failure rate:</strong> ${percent(failures, successes + failures)}% (${failures})</p>`;
			buf += `<p><details class="readmore"><summary><strong>Stats including dead flags</strong></summary>`;
			buf += `<p><strong>Total dead: ${dead}</strong></p>`;
			buf += `<p><strong>Success rate:</strong> ${percent(successes, logs.length)}% (${successes})</p>`;
			buf += `<p><strong>Failure rate:</strong> ${percent(failures, logs.length)}% (${failures})</p>`;
			buf += `</summary></details></p>`;
			buf += `<p><strong>Day stats:</strong></p>`;
			buf += `<div class="ladder pad"><table>`;
			let header = '';
			let data = '';
			const sortedDays = Utils.sortBy(Object.keys(dayStats), d => new Date(d).getTime());
			for (const [i, day] of sortedDays.entries()) {
				const cur = dayStats[day];
				if (!cur.total) continue;
				header += `<th>${day.split('-')[2]} (${cur.total})</th>`;
				data += `<td><small>${cur.successes} (${percent(cur.successes, cur.total)}%)`;
				if (cur.failures) {
					data += ` | ${cur.failures} (${percent(cur.failures, cur.total)}%)`;
				} else { // so one cannot confuse dead tickets & false hit tickets
					data += ' | 0 (0%)';
				}
				if (cur.dead) data += ` | ${cur.dead}`;
				data += '</small></td>';
				// i + 1 ensures it's above 0 always (0 % 5 === 0)
				if ((i + 1) % 5 === 0 && sortedDays[i + 1]) {
					buf += `<tr>${header}</tr><tr>${data}</tr>`;
					buf += `</div></table>`;
					buf += `<div class="ladder pad"><table>`;
					header = '';
					data = '';
				}
			}
			buf += `<tr>${header}</tr><tr>${data}</tr>`;
			buf += `</div></table>`;
			buf += `<p><strong>Staff stats:</strong></p>`;
			buf += `<div class="ladder pad"><table>`;
			buf += `<tr><th>User</th><th>Total</th><th>Percent total</th></tr>`;
			for (const id of Utils.sortBy(Object.keys(staffStats), k => -staffStats[k])) {
				buf += `<tr><td>${id}</td><td>${staffStats[id]}</td><td>${(staffStats[id] / logs.length) * 100}%</td></tr>`;
			}
			buf += `</table></div>`;
			return buf;
		},
		async settings() {
			checkAccess(this);
			this.title = `[Abuse Monitor] Settings`;
			let buf = `<div class="pad"><h2>Abuse Monitor Settings</h2>`;
			buf += `<button class="button" name="send" value="/am vs">Reload page</button>`;
			buf += `<button class="button" name="send" value="/msgroom staff,/am respawn">Reload processes</button>`;
			buf += `<button class="button" name="send" value="/msgroom staff,/am bs">Backup settings</button>`;
			if (await FS('config/chat-plugins/nf.backup.json').exists()) {
				buf += `<button class="button" name="send" value="/msgroom staff,/am lb">Load backup</button>`;
			}
			buf += `<div class="infobox"><h3>Miscellaneous settings</h3><hr />`;
			buf += `Minimum percent to process: <form data-submitsend="/msgroom staff,/am editmin {num}">`;
			buf += `<input name="num" value="${settings.minScore}"/>`;
			buf += `<button class="button notifying" type="submit">Change minimum</button></form>`;
			buf += `<br />Score threshold: <form data-submitsend="/msgroom staff,/am threshold {num}">`;
			buf += `<input name="num" value="${settings.threshold}"/>`;
			buf += `<button class="button notifying" type="submit">Change threshold</button></form>`;
			const incr = settings.thresholdIncrement;
			if (incr) {
				buf += `<br />Threshold increments: `;
				buf += `Increases ${incr.amount} every ${incr.turns} turns`;
				if (incr.minTurns) buf += ` after turn ${incr.minTurns}`;
				buf += `<br />`;
			}
			buf += `</div><div class="infobox"><h3>Punishment settings</h3><hr />`;
			if (settings.punishments.length) {
				for (const [i, p] of settings.punishments.entries()) {
					buf += `&bull; ${i + 1}: `;
					buf += Object.keys(p).map(f => `${f}: ${p[f as keyof PunishmentSettings]}`).join(', ');
					buf += ` (<button class="button" name="send" value="/msgroom staff,/am dp ${i + 1}">delete</button>)`;
					buf += `<br />`;
				}
				buf += `<br />`;
			}
			buf += `<details class="readmore"><summary>Add a punishment</summary>`;
			buf += `<form data-submitsend="/msgroom staff,/am ap p={punishment},t={type},ct={certainty},c={count}">`;
			buf += `Punishment: <input name="punishment" /> <small>(required)</small><br />`;
			buf += `Type: <input name="type" /> <small>(required)</small><br />`;
			buf += `Certainty: <input name="certainty" /> <small>(optional)</small><br />`;
			buf += `Count: <input name="count" /> <small>(optional)</small><br />`;
			buf += `<button class="button notifying" type="submit">Add punishment</button></details>`;
			buf += `</form><br />`;
			buf += `</div><div class="infobox"><h3>Scoring:</h3><hr />`;
			const keys = Utils.sortBy(
				Object.keys(Artemis.RemoteClassifier.ATTRIBUTES),
				k => [-Object.keys(settings.specials[k] || {}).length, k]
			);
			for (const k of keys) {
				buf += `<strong>${k}</strong>:<br />`;
				if (settings.specials[k]) {
					for (const percent in settings.specials[k]) {
						buf += `&bull; ${percent}%: ${settings.specials[k][percent]} `;
						buf += `(<button class="button" name="send" value="/msgroom staff,/am ds ${k},${percent}">Delete</button>)`;
						buf += `<br />`;
					}
				}
				buf += `<br />`;
				buf += `<details class="readmore"><summary>Add a special case</summary>`;
				buf += `<form data-submitsend="/msgroom staff,/am es ${k},{percent},{score}">`;
				buf += `Percent needed: <input type="text" name="percent" /><br />`;
				buf += `Score: <input type="text" name="score" /><br />`;
				buf += `<button class="button notifying" type="submit">Add</button>`;
				buf += `</form></details>`;
				buf += `<hr />`;
			}
			buf += `</div>`;
			return buf;
		},
	},
};
