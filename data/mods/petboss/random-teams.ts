import {FS} from '../../../lib';
import {Teams} from '../../../sim/teams'
import {RandomTeams} from '../../random-teams';

const USERPATH = 'config/pet-mode/user-properties';

function getUserTeam(userid: string, maxLevel: number = 100): PokemonSet[] | null {
	try {
		const userPropertyString = FS(`${USERPATH}/${userid}.json`).readIfExistsSync();
		if (userPropertyString) {
			let parsedTeam: PokemonSet[] = [];
			JSON.parse(userPropertyString)['bag'].forEach((x: string) => {
				const team = Teams.unpack(x);
				if (!team) return;
				const set = team[0];
				if (!set || Dex.toID(set.species) === 'egg') return;
				set.level = Math.min(set.level || 100, maxLevel);
				if (!set.ability || set.ability === '!!!ERROR!!!') set.ability = Dex.species.get(set.species).abilities['0'];
				if (!Dex.items.get(set.item).exists) set.item = '';
				parsedTeam.push(set);
			});
			if (parsedTeam.length > 0) return parsedTeam;
		}
		throw Error();
	} catch (err) {
		return Teams.unpack('Magikarp|||SwiftSwim|Splash|Hardy||M|0,0,0,0,0,0||5|');
	}
}

export class RandomPSChinaPetModeBossTeams extends RandomTeams {

	randomPetModeBossBattleTeam(options: PlayerOptions) {
		return getUserTeam(Dex.toID(options.name), 50);
	}

}

export default RandomPSChinaPetModeBossTeams;