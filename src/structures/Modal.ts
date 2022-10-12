import { ModalType } from '../types/Modal';

export class Modal {
	public constructor(public modalHandler: ModalType) {
		Object.assign(this, modalHandler);
	}
}
