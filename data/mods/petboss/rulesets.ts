/*
	p1 = Bot Side
	p2, p3, p4 = User Sides
*/

import { FS } from "../../../lib";
import { Teams, Pokemon } from "../../../sim";
import { PetModeBossConfig } from "../../../config/pet-mode/boss-config";

const USERPATH = 'config/pet-mode/user-properties';
const DEPOSITPATH = 'config/pet-mode/deposit';

const bossConfig: { [bossname: string]: {
	'set': string, 'bonus': string
} } = PetModeBossConfig;

function getBossTeam(userid: string): PokemonSet[] {
	const bossName = FS(`${DEPOSITPATH}/${userid}.txt`).readIfExistsSync();
	return Teams.unpack(bossConfig[bossName]?.set || 'Magikarp|||SwiftSwim|Splash|Hardy||M|0,0,0,0,0,0||5|')!;
}

function giveBonus(userid: string, bossname: string) {
	let userProperty = JSON.parse(FS(`${USERPATH}/${userid}.json`).readIfExistsSync());
	if (userProperty['boss'].find((x: string) => x === bossname)) return;
	userProperty['boss'].push(bossname);
	userProperty['items'][bossConfig[bossname]['bonus']] = 1;
	FS(`${USERPATH}/${userid}.json`).safeWriteSync(JSON.stringify(userProperty));
}

export const Rulesets: {[k: string]: FormatData} = {

	pschinapetmodeboss: {
		name: 'PS China Pet Mode Boss',
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
		ruleset: ['Dynamax Clause'],
		onBegin() {
			if (Dex.toID(this.p1.name) !== 'pschinabot') {
				this.add('html', `<div class="broadcast-red"><strong>霸主宝可梦消失了!</strong></div>`);
				this.tie();
				return;
			}
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
			this.p1.team = getBossTeam(Dex.toID(this.p2.name));
			this.p1.pokemon = [new Pokemon(this.p1.team[0], this.p1)];
			this.add('html', `<div class="broadcast-green"><strong>野生的${this.p1.team[0].name}出现了!</strong></div>`);
		},
		onModifyMove(move, pokemon, target) {
			if (move.target === 'allAdjacentFoes' ) {
				if (pokemon.side === this.p1) {
					move.target = 'allAdjacent';
				}
				else {
					move.target = 'normal'; move.num = -1;
				}
			}
			if (move.target === 'randomNormal' && pokemon.side !== this.p1) {
				move.num = -1;
			}
			if (move.target === 'allySide' && move.name !== 'Gear Up' && move.name !=='Magnetic Flux') {
				move.target = 'all';
			}
			if (move.target === 'adjacentFoe' || move.target === 'adjacentAlly') {
				move.target = 'normal';
			}
			if (move.target === 'allies' && pokemon.side === this.p3) {
				move.target = 'self';
			}
		},
		onRedirectTargetPriority: 99,
		onRedirectTarget(target, source, source2, move) {
			if (source.side !== this.p1 && move.num === -1) {
				const t = this.p1.active[0];
				return t;
			}
			if (source.side !== this.p1 && move.num !== -1 && (move.target === 'normal' || move.target==='any')) {
				return target;
			}
		},
		onAnyAfterBoost(a, target, source, effect) {
			if (source.lastMove!.isMax && source.side === this.p1 && (target.side === this.p2 || target.side === this.p4)) {
				this.boost(a, this.p3!.active[0]);
			}
		},
		onBattleStart() {
			this.p1.allySide = null;
			this.p2.foe = this.p1;
			this.p4!.foe = this.p1;
			this.p2.allySide = this.p3!;
			this.p3!.allySide = this.p4!;
			this.p4!.allySide = this.p2;
			this.p3!.sideConditions = this.p2.sideConditions;
			this.p4!.sideConditions = this.p2.sideConditions;
			this.p2.pokemonLeft += this.p4!.pokemonLeft;
			this.p4!.pokemonLeft += this.p3!.pokemonLeft;
			this.p3!.pokemonLeft += this.p2.pokemonLeft;
		},
		onFaint(pokemon) {
			switch (pokemon.side) {
			case this.p2:
				this.p3!.pokemonLeft--;
				break;
			case this.p3!:
				this.p4!.pokemonLeft--;
				break;
			case this.p4!:
				this.p2.pokemonLeft--;
				break;
			}
			if (pokemon.side === this.p1 && bossConfig[pokemon.name] && this.sides.slice(1).some(side => side.pokemon.some(x => !x.fainted))) {
				this.sides.slice(1).forEach(side => giveBonus(Dex.toID(side.name), pokemon.name));
				this.add('html', `<div class="broadcast-green"><strong>${pokemon.name}逃走了!</strong></div>`);
				this.add('html', `<div class="broadcast-green"><strong>您获得了${pokemon.name}掉落的道具! 快去盒子查看吧!</strong></div>`);
				this.winner = this.sides.slice(1).map(side => side.name).join(' & ');
				this.add('')
				this.add('win', this.winner);
				this.ended = true;
				this.requestState = '';
				this.sides.filter(s => s).forEach(s => s.activeRequest = null);
			}
		},
		onBeforeTurn(pokemon) {
			if (pokemon.side === this.p1 && this.turn > 10) {
				this.win(this.p1);
				this.add('html', `<div class="broadcast-red"><strong>${pokemon.name}逃走了!</strong></div>`);
			}
		}
	}
};
