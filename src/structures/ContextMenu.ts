import { MessageContextMenuType, UserContextMenuType } from '../types/ContextMenu';

export class MessageContextMenu {
	public constructor(public commandOptions: MessageContextMenuType) {
		Object.assign(this, commandOptions);
	}
}

export class UserContextMenu {
	public constructor(public commandOptions: UserContextMenuType) {
		Object.assign(this, commandOptions);
	}
}
