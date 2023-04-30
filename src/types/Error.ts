export class CustomError extends Error {
	protected constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class MongoDbError extends CustomError {
	public constructor() {
		super('Sorry, error occurred when executing actions in the database.');
	}
}

export class MentorshipNotFoundError extends CustomError {
	public constructor() {
		super('Sorry, you are not registered in the database.');
	}
}

export class TimeOutError extends CustomError {
	public constructor() {
		super('Timeout');
	}
}

export class FailSendDmError extends CustomError {
	public constructor(userName: string) {
		super(`Fail to send DM to ${userName}`);
	}
}
