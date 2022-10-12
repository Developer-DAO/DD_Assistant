import { AutoType } from "../types/Auto";

export class Auto {
	public constructor(public autoHandler: AutoType) {
		Object.assign(this, autoHandler);
	}
}
