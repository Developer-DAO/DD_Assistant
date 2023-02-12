import _ from 'lodash';
import NodeCache from 'node-cache';

import { CacheType } from '../types/Cache';
import { CACHE_KEYS } from '../utils/const';

class MyCache extends NodeCache {
	public constructor(options = {}) {
		super(options);
	}
	public myGet<Key extends keyof CacheType>(key: Key): CacheType[Key] | undefined {
		return super.get(key);
	}

	public mySet<Key extends keyof CacheType>(
		key: Key,
		value: CacheType[Key],
		ttl?: number
	): boolean {
		if (typeof ttl === 'undefined') {
			return super.set(key, value);
		}
		return super.set(key, value, ttl);
	}

	public myHas<Key extends keyof CacheType>(key: Key) {
		return super.has(key);
	}

	public myHases<Key extends keyof CacheType>(keys: Array<Key>) {
		return keys.reduce((pre, cur) => {
			return pre && super.has(cur);
		}, true);
	}

	public myHasesExcept<Key extends keyof CacheType>(keys: Array<Key>) {
		return this.myHases(_.xor(Object.keys(CACHE_KEYS), keys));
	}

	public myHasAll() {
		return Object.keys(CACHE_KEYS).reduce((pre, cur) => {
			return pre && super.has(cur);
		}, true);
	}
}

export const myCache = new MyCache({ stdTTL: 30, checkperiod: 60, deleteOnExpire: false });
