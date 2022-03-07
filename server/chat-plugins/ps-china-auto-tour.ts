import { FS, Utils } from '../../lib';
import { PetUtils } from './ps-china-pet-mode';
import { AdminUtils } from './ps-china-admin';

type TourRules = {
	bonus?: boolean,
	playercap?: number,
	autostart?: number,
	forcetimer?: boolean,
	allowscouting?: boolean,
	autodq?: number,
};

type TourTiming = {
	minutes: number,
	hours?: number,
	day?: number,
};

type TourSettings = {
	format: string,
	rules: TourRules,
	timing: TourTiming
};

type TourStatus = {
	settings: TourSettings,
	nexttime: Date
};

const SHORT_WATCHER_ADVANCE = 5000;
const SHORT_WATCHER_CYCLE = 1000;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SCORE_BONUS = [0, 5, 10, 20, 30, 50, 70];
const AUTO_TOUR_CONFIG_FILE = 'config/tours.json';
const TOUR_LOG_DIR = 'logs/tour';

if (!FS(TOUR_LOG_DIR).existsSync()) FS(TOUR_LOG_DIR).mkdir();

class BroadcastContext {
	private room: ChatRoom;
	private info: string;

	constructor(room: ChatRoom, info: string) {
		this.room = room;
		this.info = info;
	}
	sendReply(data: string): void {
		this.room.add(`|html|<strong class="message">[${this.info}] ${data.replace(/\n/ig, '<br />')}</strong>`).update();
	}
	errorReply(data: string): void {
		this.room.add(`|html|<strong class="message-error">[${this.info}] ${data.replace(/\n/ig, '<br />')}</strong>`).update();
	}
	modlog(
		action: string,
		user: string | User | null = null,
		note: string | null = null,
		options: Partial<{noalts: any, noip: any}> = {}
	) {
		this.room.modlog({ action: action, isGlobal: false });
	}
}

class ScoreTourUtils {
	static getScoreTourClass() {
		return class ScoreTournament extends Tournaments.Tournament {
			onTournamentEnd() {
				super.onTournamentEnd();
				const bracketData = this.getBracketData();
				const logDir = `${TOUR_LOG_DIR}/${PetUtils.getDate()}`;
				if (!FS(logDir).existsSync()) FS(logDir).mkdirSync();
				const tourLog = ScoreTourUtils.parseTourLog(bracketData);
				FS(`${logDir}/${toID(this.name)}.json`).safeWriteSync(PetUtils.formatJSON(tourLog));
				AdminUtils.updateUserAlts();
				ScoreTourUtils.addTourScore(this.name, tourLog);
				const winnerId = toID(bracketData?.rootNode?.team);
				const mainId = AdminUtils.addEggToMain(winnerId);
				if (mainId) {
					const winnerNote = mainId === winnerId ? '' : `的宠物系统账号 ${mainId} `;
					AdminUtils.adminPM(winnerId, `恭喜夺冠! 您${winnerNote}获得了一个蛋!`);
					Rooms.get('staff')?.add(`|c|&|/log 自动奖品发放: ${winnerId} ${winnerNote}获得了一个蛋`).update();
				} else {
					Rooms.get('staff')?.add(`|c|&|/log 自动奖品发放: 未找到冠军 ${winnerId} 的宠物系统账号`).update();
				}
			}
		}
	}
	static parseTourLog(bracket: AnyObject | null): AnyObject {
		try {
			const playerWins = ScoreTourUtils.searchTourTree(bracket!.rootNode);
			const sortedPlayerWins: { [playerid: string]: string[] } = {};
			const players = Object.keys(playerWins);
			players.sort((p1, p2) => playerWins[p1].length > playerWins[p2].length ? 1 : -1);
			players.forEach(player => sortedPlayerWins[player] = playerWins[player]);
			return sortedPlayerWins;
		} catch (err) {
			return bracket || {};
		}
	}
	static searchTourTree(node: AnyObject): { [playerid: string]: string[] } {
		const result: { [playerid: string]: string[] } = {};
		const playerId = toID(node.team);
		if (node.children) {
			node.children.forEach((child: AnyObject) => {
				const childResult = ScoreTourUtils.searchTourTree(child);
				Object.assign(result, childResult);
			});
			const foeId = node.children.map((child: AnyObject) => toID(child.team)).find((childId: string) => childId !== playerId);
			result[playerId].push(foeId);
		} else {
			result[playerId] = [];
		}
		return result;
	}
	static addTourScore(tourname: string, tourLog: AnyObject) {
		try {
			Object.keys(tourLog).forEach((userId, i) => {
				const wins = tourLog[userId].length;
				let score = SCORE_BONUS[wins] || 0;
				if (score > 0) {
					setTimeout(() => {
						AdminUtils.addScoreToMain(userId, score, `{}在 ${tourname} 淘汰赛中连胜 ${wins} 轮`);
					}, 100 * i);
				}
			})
		} catch (err) {
			Rooms.get('staff')?.add(`|c|&|/log ${tourname} 淘汰赛自动加分失败`).update();
		}
	}
}

class TourQueue {
	private roomid: string;
	private schedule: TourStatus[];
	private timeout: NodeJS.Timeout | undefined;

	constructor(roomid: string, config: TourSettings[] = []) {
		this.roomid = roomid;
		this.schedule = config.map((tourSettings) => {
			return {
				settings: tourSettings,
				nexttime: TourQueue.calcNextTime(tourSettings.timing)
			};
		});
		this.schedule.sort((t1, t2) => +t1.nexttime - +t2.nexttime);
		this.longWatcher();
	}

	stop() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	longWatcher() {
		const waiting = +this.schedule[0].nexttime - Date.now() - SHORT_WATCHER_ADVANCE;
		if (waiting > 0) {
			this.timeout = setTimeout(() => {
				this.shortWatcher();
			}, waiting);
		} else {
			this.shortWatcher();
		}
	}

	shortWatcher() {
		if (Date.now() < +this.schedule[0].nexttime || Rooms.get(this.roomid)?.game) {
			this.timeout = setTimeout(() => {
				this.shortWatcher();
			}, SHORT_WATCHER_CYCLE);
		} else {
			this.createTour();
			this.schedule[0].nexttime = TourQueue.calcNextTime(this.schedule[0].settings.timing);
			this.schedule.sort((t1, t2) => +t1.nexttime - +t2.nexttime);
			this.longWatcher();
		}
	}

	createTour() {
		const room = Rooms.get(this.roomid);
		if (room?.type !== 'chat') return;
		const tourStatus = this.schedule[0];
		const format = Dex.formats.get(tourStatus.settings.format);
		const broadcastContext = new BroadcastContext(room, 'Auto Tour');
		if (!format.exists) {
			broadcastContext.errorReply(`Config error: the format ${tourStatus.settings.format} does not exist.`);
			return;
		}
		broadcastContext.sendReply(`Creating ${format.name} tournament...`);
		if (!room.settings.tournaments) room.settings.tournaments = {};
		room.settings.tournaments.forceTimer = tourStatus.settings.rules.forcetimer;
		room.settings.tournaments.allowScouting = tourStatus.settings.rules.allowscouting;
		if (tourStatus.settings.rules.autostart) {
			room.settings.tournaments.autostart = tourStatus.settings.rules.autostart * 60 * 1000;
		}
		if (tourStatus.settings.rules.autodq) {
			room.settings.tournaments.autodq = tourStatus.settings.rules.autodq * 60 * 1000;
		}
		const tour = Tournaments.createTournament(
			room,
			format.id,
			'elimination',
			tourStatus.settings.rules.playercap?.toString(),
			false,
			undefined,
			undefined,
			//@ts-ignore
			broadcastContext
		)
		if (tour) {
			if (tourStatus.settings.rules.bonus) {
				tour.onTournamentEnd = ScoreTourUtils.getScoreTourClass().prototype.onTournamentEnd;
				let msg = `<b>${room}房间 ${format.name} 淘汰赛`;
				if (tourStatus.settings.rules.autostart) {
					msg += `将于${tourStatus.settings.rules.autostart}分钟后开始!</b>`;
				} else {
					msg += '即将开始!</b>';
				}
				msg += '<center><table>';
				const sfill = (x: string | number) => (' ' + x).slice(-2).replace(/\s+/g, '&ensp;');
				msg += '<tr><th>获胜轮数</th>' + SCORE_BONUS.map((v, i) => `<td>${sfill(i)}</td>`).join('') + '</tr>';
				msg += '<tr><th>奖励积分</th>' + SCORE_BONUS.map((v, i) => `<td>${sfill(v)}</td>`).join('') + '</tr>';
				msg += '</table></center>';
				msg += '<b>冠军还可以在宠物系统中获得一个神秘的蛋!</b>'
				for (const u of Users.users.values()) {
					if (u.connected) u.send(`|pm|&|${u.tempGroup}${u.name}|/raw <div class="broadcast-blue">${msg}</div>`);
				}
			}
			broadcastContext.sendReply(TourQueue.formatInfo(format));
		} else {
			broadcastContext.errorReply('Failed to create a tournament.');
		}
	}

	check() {
		return `Next tour: ${this.schedule[0].settings.format} at ${this.schedule[0].nexttime.toString()}`;
	}

	static calcNextTime(timing: TourTiming): Date {
		const now = new Date();
		const next = new Date(now.getTime());
		next.setMilliseconds(0);
		next.setSeconds(0);
		next.setMinutes(timing.minutes);
		if (timing.hours === undefined) {
			if (now.getTime() >= next.getTime()) {
				next.setHours(next.getHours() + 1);
			}
		} else {
			next.setHours(timing.hours);
			if (timing.day === undefined) {
				if (now.getTime() >= next.getTime()) {
					next.setDate(next.getDate() + 1);
				}
			} else {
				next.setDate(next.getDate() - next.getDay() + timing.day);
				if (now.getTime() >= next.getTime()) {
					next.setDate(next.getDate() + 7);
				}
			}
		}
		return next;
	}

	static formatInfo(format: Format): string {
		const rules: string[] = [];
		let rulesetHtml = '';
		if (['Format', 'Rule', 'ValidatorRule'].includes(format.effectType)) {
			if (format.ruleset?.length) {
				rules.push(`<b>Ruleset</b> - ${Utils.escapeHTML(format.ruleset.join(", "))}`);
			}
			if (format.banlist?.length) {
				rules.push(`<b>Bans</b> - ${Utils.escapeHTML(format.banlist.join(", "))}`);
			}
			if (format.unbanlist?.length) {
				rules.push(`<b>Unbans</b> - ${Utils.escapeHTML(format.unbanlist.join(", "))}`);
			}
			if (format.restricted?.length) {
				rules.push(`<b>Restricted</b> - ${Utils.escapeHTML(format.restricted.join(", "))}`);
			}
			if (rules.length) {
				rulesetHtml = `<details><summary>Banlist/Ruleset</summary>${rules.join("<br/>")}</details>`;
			} else {
				rulesetHtml = `No ruleset found for ${format.name}`;
			}
		}
		let formatType: string = (format.gameType || "singles");
		formatType = formatType.charAt(0).toUpperCase() + formatType.slice(1).toLowerCase();
		if (!format.desc && !format.threads) {
			if (format.effectType === 'Format') {
				return `No description found for this ${formatType} ${format.section} format.<br/>${rulesetHtml}`;
			} else {
				return `No description found for this rule.<br/>${rulesetHtml}`;
			}
		}
		const descHtml = [...(format.desc ? [format.desc] : []), ...(format.threads || [])];
		return `${format.name}<div>${descHtml.join("<br/>")}<br/>${rulesetHtml}</div>`;
	}
}

let tourConfig: {[roomid: string]: TourSettings[]} = {};
let tourQueues: {[roomid: string]: TourQueue} = {};

function loadTourConfig() {
	tourConfig = JSON.parse(FS(AUTO_TOUR_CONFIG_FILE).readSync());
}

function saveTourConfig() {
	FS(AUTO_TOUR_CONFIG_FILE).safeWriteSync(JSON.stringify(tourConfig));
}

function applyTourConfig() {
	Object.values(tourQueues).forEach((tourQueue) => tourQueue.stop());
	tourQueues = {};
	Object.entries(tourConfig).forEach(([roomid, roomTourConfig]) => {
		if (roomTourConfig.length) {
			tourQueues[roomid] = new TourQueue(roomid, roomTourConfig);
		}
	});
}

if (!FS(AUTO_TOUR_CONFIG_FILE).existsSync()) saveTourConfig();
loadTourConfig();
applyTourConfig();

let tmpTourConfig: {[userid: string]: TourSettings[]} = {};

function button(command: string, desc: string) {
	return `<button class="button" name="send" value="${command}">${desc}</button>`;
}

function disabledButton(desc: string) {
	return `<button class="button disabled" style="font-weight:bold;color:#575757;background:#d3d3d3">${desc}</button>`;
}

function conditionalButton(condition: boolean, command: string, desc: string) {
	return condition ? disabledButton(desc) : button(command, desc);
}

export const commands: Chat.ChatCommands = {
	autotour: {
		'': 'check',
		check(target, room, user) {
			this.requireRoom();
			const roomid = room!.roomid;
			if (tourQueues[roomid]) {
				this.sendReply(tourQueues[roomid].check());
				this.sendReply(`|uhtml|auto-tour-config|${button('/autotour config', 'View all configured tours')}`);
			} else {
				if (Users.Auth.hasPermission(user, 'roommod', null, room)) {
					this.parse(`/autotour config`);
				} else {
					this.sendReply('There is no auto tour configured in this room.');
				}
			}
		},
		config: {
			'': 'show',
			show(target, room, user) {
				this.requireRoom();
				const roomid = room!.roomid;
				const canEdit = Users.Auth.hasPermission(user, 'roommod', null, room);
				let buf = '|uhtml|auto-tour-config|';
				const roomTourConfig = tmpTourConfig[user.id] || tourConfig[roomid] || [];
				if (roomTourConfig.length) {
					buf += '<table style="border-spacing: 5px;">';
					let header = ['Format', 'Time'];
					buf += '<tr>' + header.map(s => `<th style="text-align: center">${s}</th>`).join('') + '</tr>';
					roomTourConfig.forEach((tourSettings, index) => {
						const formatName = tourSettings.format;
						let timing = 'Every ';
						if (tourSettings.timing.day !== undefined) {
							timing += DAYS[tourSettings.timing.day] + ' ';
						} else {
							timing = 'Everyday ';
						}
						if (tourSettings.timing.hours !== undefined) {
							timing += ('0' + tourSettings.timing.hours).slice(-2);
						} else {
							timing += 'XX';
						}
						timing += ':' + ('0' + tourSettings.timing.minutes).slice(-2);
						let buttons = button(`/autotour config rules ${index}`, 'Rules');
						if (canEdit) {
							buttons += button(`/autotour config edit ${index}`, 'Edit');
							buttons += button(`/autotour config edit ${index},delete`, 'Delete');
						}
						let row = [formatName, timing, buttons];
						buf += '<tr>' + row.map(s => `<td style="text-align: center">${s}</td>`).join('') + '</tr>';
					});
					buf += '</table>';
				} else {
					buf += '<p>There is no auto tour configured in this room.</p>';
				}
				if (canEdit) {
					buf += '<p>';
					buf += button(`/autotour config edit ${roomTourConfig.length}`, 'Add');
					buf += button(`/autotour config save`, 'Confirm');
					buf += button(`/autotour config cancel`, 'Cancel');
					buf += '</p>';
				}
				this.sendReply(buf);
			},
			rules(target, room, user) {
				this.requireRoom();
				const roomid = room!.roomid;
				const roomTourConfig = tmpTourConfig[user.id] || tourConfig[roomid] || [];
				const index = parseInt(target);
				if (index >= 0 && index < roomTourConfig.length) {
					const tourRules = roomTourConfig[index].rules;
					const allowScouting = tourRules.allowscouting === undefined || tourRules.allowscouting;
					const forceTimer = !!tourRules.forcetimer;
					const bonus = !!tourRules.bonus;
					const lines = [];
					lines.push(`<b>Bonus: ${bonus ? 'ON' : 'OFF'}</b>`);
					if (bonus) {
						lines.push('PS-China scores will be awarded if you win battles in the tournament.');
					} else {
						lines.push('No scores awarded in the tournament.');
					}
					lines.push(`<b>Capacity: ${tourRules.playercap || 'Unset'}</b>`);
					if (tourRules.playercap) {
						lines.push(`A maximum of ${tourRules.playercap} players can take part in the tournament.`);
					} else {
						lines.push('There is no upper limit on the number of participants.');
					}
					lines.push(`<b>Scouting: ${allowScouting ? 'Allowed' : 'Banned'}</b>`);
					lines.push(`Players ${allowScouting ? 'can' : 'can\'t'} watch other tournament battles.`);
					lines.push(`<b>Force Timer: ${forceTimer ? 'ON' : 'OFF'}</b>`);
					if (forceTimer) {
						lines.push('All battles will be timed.');
					} else {
						lines.push('The timer is opt-in.');
					}
					lines.push(`<b>Auto-start: ${tourRules.autostart || 'Unset'}</b>`);
					if (tourRules.autostart) {
						lines.push(`The tournament will automatically start in ${tourRules.autostart} minute(s).`);
					} else {
						lines.push('The tournament will not automatically started.');
					}
					lines.push(`<b>Auto-disqualify: ${tourRules.autodq || 'Unset'}</b>`);
					if (tourRules.autodq) {
						lines.push(`Inactive players will be disqualified in ${tourRules.autodq} minute(s).`);
					} else {
						lines.push('Inactive players will not be automatically disqualified.');
					}
					lines.push(button('/autotour config', 'Back'));
					return this.sendReply(`|uhtml|auto-tour-config|${lines.join('<br/>')}`);
				}
			},
			save(target, room, user) {
				this.requireRoom();
				this.checkCan('roommod', null, room!);
				if (tmpTourConfig[user.id]) {
					if (tmpTourConfig[user.id].length) {
						tourConfig[room!.roomid] = tmpTourConfig[user.id];
					} else {
						delete tourConfig[room!.roomid];
					}
					saveTourConfig();
					applyTourConfig();
					delete tmpTourConfig[user.id];
				}
				this.sendReply('|uhtml|auto-tour-config|');
				this.sendReply('Auto tour config updated.');
			},
			cancel(target, room, user) {
				this.requireRoom();
				this.checkCan('roommod', null, room!);
				delete tmpTourConfig[user.id];
				this.sendReply('|uhtml|auto-tour-config|');
			},
			edit(target, room, user) {
				this.requireRoom();
				this.checkCan('roommod', null, room!);
				if (!tmpTourConfig[user.id]) {
					tmpTourConfig[user.id] = JSON.parse(JSON.stringify(tourConfig[room!.roomid] || []));
				}
				const [indexStr, command, args] = target.replace(/\s+/g, '').split(',');
				const index = parseInt(indexStr);
				const num = parseInt(args);
				if (index >= 0 && index < tmpTourConfig[user.id].length) {
					const tourSettings = tmpTourConfig[user.id][index];
					switch (command) {
						case 'delete':
							tmpTourConfig[user.id].splice(index, 1);
							return this.parse('/autotour config');
						case 'format':
							const format = Dex.formats.get(args);
							if (format.exists) {
								tourSettings.format = format.name;
							}
							return this.parse(`/autotour config edit ${index}`);
						case 'bonus':
						case 'forcetimer':
						case 'allowscouting':
							if (tourSettings.rules[command] === undefined) {
								tourSettings.rules[command] = command === 'allowscouting';
							}
							tourSettings.rules[command] = !tourSettings.rules[command];
							return this.parse(`/autotour config edit ${index}`);
						case 'playercap':
						case 'autostart':
						case 'autodq':
							if (Number.isInteger(num) && num >= (command === 'playercap' ? 2 : 0)) {
								tourSettings.rules[command] = num;
							} else {
								delete tourSettings.rules[command];
							}
							return this.parse(`/autotour config edit ${index}`);
						case 'minutes':
						case 'hours':
						case 'day':
							const cycle = { 'minutes': 60, 'hours': 24, 'day': 7 }[command];
							if (Number.isInteger(num) && num >= 0) {
								tourSettings.timing[command] = num % cycle;
							} else if (command !== 'minutes') {
								delete tourSettings.timing[command];
							}
							return this.parse(`/autotour config edit ${index}`);
						default:
							let buf = '|uhtml|auto-tour-config|';
							const cmdPrefix = `/msgroom ${room!.roomid}, /autotour config edit ${index}`;
							const allowScouting = tourSettings.rules.allowscouting === undefined || tourSettings.rules.allowscouting;
							const forceTimer = !!tourSettings.rules.forcetimer;
							const bonus = !!tourSettings.rules.bonus;
							buf += `<b>Format</b><br/>`;
							buf += `<form data-submitsend="${cmdPrefix},format,{autotour-format}">`;
							buf += `<input name="autotour-format" placeholder="${tourSettings.format}" style="width: 200px"/>`;
							buf += `<button class="button" type="submit">OK</button>`;
							buf += `</form>`;
							buf += `<b>Bonus</b><br/>`;
							buf += conditionalButton(bonus, `${cmdPrefix},bonus`, 'On');
							buf += conditionalButton(!bonus, `${cmdPrefix},bonus`, 'Off');
							buf += '<br/>';
							buf += `<b>Player Capacity</b><br/>`;
							buf += `<form data-submitsend="${cmdPrefix},playercap,{autotour-playercap}">`;
							buf += `<input name="autotour-playercap" placeholder="${tourSettings.rules.playercap}" style="width: 200px"/>`;
							buf += `<button class="button" type="submit">OK</button>`;
							buf += `</form>`;
							buf += `<b>Allow Scouting</b><br/>`;
							buf += conditionalButton(allowScouting, `${cmdPrefix},allowscouting`, 'On');
							buf += conditionalButton(!allowScouting, `${cmdPrefix},allowscouting`, 'Off');
							buf += '<br/>';
							buf += `<b>Force Timer</b><br/>`;
							buf += conditionalButton(forceTimer, `${cmdPrefix},forcetimer`, 'On');
							buf += conditionalButton(!forceTimer, `${cmdPrefix},forcetimer`, 'Off');
							buf += '<br/>';
							buf += `<b>Auto-start (in Minutes)</b><br/>`;
							buf += `<form data-submitsend="${cmdPrefix},autostart,{autotour-autostart}">`;
							buf += `<input name="autotour-autostart" placeholder="${tourSettings.rules.autostart}" style="width: 200px"/>`;
							buf += `<button class="button" type="submit">OK</button>`;
							buf += `</form>`;
							buf += `<b>Auto-disqualify (in Minutes)</b><br/>`;
							buf += `<form data-submitsend="${cmdPrefix},autodq,{autotour-autodq}">`;
							buf += `<input name="autotour-autodq" placeholder="${tourSettings.rules.autodq}" style="width: 200px"/>`;
							buf += `<button class="button" type="submit">OK</button>`;
							buf += `</form>`;
							buf += `<b>Timing: Day</b><br/>`;
							buf += conditionalButton(tourSettings.timing.day === undefined, `${cmdPrefix},day,undefined`, 'Everyday');
							buf += DAYS.map((day, i) => {
								return conditionalButton(tourSettings.timing.day === i, `${cmdPrefix},day,${i}`, day);
							}).join('');
							buf += '<br/>'
							buf += `<b>Timing: Hours</b><br/>`;
							buf += `<form data-submitsend="${cmdPrefix},hours,{autotour-hours}">`;
							buf += `<input name="autotour-hours" placeholder="${tourSettings.timing.hours}" style="width: 200px"/>`;
							buf += `<button class="button" type="submit">OK</button>`;
							buf += `</form>`;
							buf += `<b>Timing: Minutes</b><br/>`;
							buf += `<form data-submitsend="${cmdPrefix},minutes,{autotour-minutes}">`;
							buf += `<input name="autotour-minutes" placeholder="${tourSettings.timing.minutes}" style="width: 200px"/>`;
							buf += `<button class="button" type="submit">OK</button>`;
							buf += `</form>`;
							buf += button(`/autotour config`, 'Confirm & Back');
							this.sendReply(buf);
					}
				} else if (index === tmpTourConfig[user.id].length) {
					tmpTourConfig[user.id][index] = {
						format: '[Gen 8] OU',
						rules: tmpTourConfig[user.id][tmpTourConfig[user.id].length - 1]?.rules || {},
						timing: { 'minutes': 0, 'hours': 20 }
					}
					this.parse('/autotour config');
				} else {
					this.parse('/autotour config');
				}
			}
		}
	}
}
