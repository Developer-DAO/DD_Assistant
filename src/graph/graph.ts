import { GraphQLClient } from 'graphql-request';

import { TimeOutError } from '../utils/error';
import { awaitWrapWithTimeout } from '../utils/util';

const _client: GraphQLClient = new GraphQLClient('https://api.hashnode.com/');

// todo replace string with types of errors
export type GraphReturn<T> = {
	result: T;
	error: string;
};
type GraphParam<T> = {
	variable: T;
	request: any;
};

// todo correctly handle error from graphql
export async function myQuery<T, K>(params: GraphParam<T>): Promise<GraphReturn<K>> {
	const { result, error } = await awaitWrapWithTimeout(
		_client.request<K>(params.request, params.variable)
	);

	if (error instanceof TimeOutError) {
		return {
			result: null,
			error: error.message
		};
	}
	if (error?.response) {
		return {
			result: null,
			error: error.response.errors[0]?.message
		};
	}
	return {
		result: result,
		error: null
	};
}

// todo correctly handle error from graphql
export async function myMutation<T, K>(params: GraphParam<T>): Promise<GraphReturn<K>> {
	const { result, error } = await awaitWrapWithTimeout(
		_client.request<K>(params.request, params.variable)
	);

	if (error instanceof TimeOutError) {
		return {
			result: null,
			error: error.message
		};
	}
	if (error?.response) {
		return {
			result: null,
			error: error.response.errors[0]?.message
		};
	}
	return {
		result: result,
		error: null
	};
}
