export class TimeOutError extends Error {
	public constructor() {
		super('Time Out');
		this.name = this.constructor.name;
	}
}
