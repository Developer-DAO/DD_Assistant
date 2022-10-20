/* eslint-disable no-empty-function */
import { ClientEvents } from 'discord.js';

// Key's value has to be the attribute names of ClientEvents
// In other words, the event name
export class Event<Key extends keyof ClientEvents> {
	public constructor(public eventName: Key, public run: (...args: ClientEvents[Key]) => any) {}
}