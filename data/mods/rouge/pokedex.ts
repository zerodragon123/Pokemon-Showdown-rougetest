import { Abilities } from "../../abilities";

export const Pokedex: {[k: string]: ModdedSpeciesData} = {
	/*
	// Example
	id: {
		inherit: true, // Always use this, makes the pokemon inherit its default values from the parent mod (gen7)
		baseStats: {hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100}, // the base stats for the pokemon
	},
	*/
	// ACakeWearingAHat
	shop: {
		num:1000,
		name: "Shop",
		types: ["Normal"],
		abilities: {	0: "Illuminate" },
		baseStats: { hp: 1, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 },
		heightm: 0.3,
		weightkg: 2,
		eggGroups: ["Undiscovered"],
	},

	
};
