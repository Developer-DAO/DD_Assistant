import { ButtonType } from '../types/Button';

export class Button {
	public constructor(public buttonHandler: ButtonType) {
		Object.assign(this, buttonHandler);
	}
}
