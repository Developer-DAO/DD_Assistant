import { ContextMenuType } from '../types/ContextMenu';

export class ContextMenu {
	public constructor(public commandOptions: ContextMenuType) {
		Object.assign(this, commandOptions);
	}
}
