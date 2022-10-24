export class TimeOutError extends Error {
	public constructor() {
		super('Time out');
		this.name = this.constructor.name;
	}
}
