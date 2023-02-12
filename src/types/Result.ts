/**
 * Custom error used by the indexer.
 */
export class Cerror {
	readonly message: string;

	constructor(message: string) {
		this.message = message;
	}

	static new(errMsg: string) {
		return new this(errMsg);
	}
}

export class Result<T, E extends Cerror> {
	readonly error: E | undefined;
	readonly ok: T | undefined;

	constructor(ok?: T, error?: E) {
		this.error = error;
		this.ok = ok;
	}

	/**
	 * Err creates an Result error object
	 * @param errMsg
	 * @param _ok
	 * @returns
	 */
	static Err<E extends Cerror, T>(errMsg: E, _ok?: T): Result<T, E> {
		return new Result(_ok, errMsg);
	}

	/**
	 * Ok creates an Result ok object
	 * @param ok
	 * @returns
	 */
	static Ok<T, E extends Cerror>(ok: T): Result<T, E> {
		return new Result(ok);
	}

	unwrap(): T {
		if (this.error) {
			throw new Error(this.error.message);
		}
		if (this.ok !== undefined) {
			return this.ok;
		}
		throw new Error(`could not unwrap value ${this.ok}`);
	}

	err(): E {
		if (this.error) return this.error;
		throw new Error(`could not transform Result to Error`);
	}

	is_err(): boolean {
		return this.error !== undefined;
	}

	is_ok(): boolean {
		return !!this.ok;
	}
}
