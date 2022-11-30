import { gql } from 'graphql-request';

import { myQuery } from './graph';
import { GraphQL_GetUserQuery, GraphQL_GetUserQueryVariables } from './result';

const request = gql`
	query GetUser($username: String!) {
		user(username: $username) {
			publicationDomain
		}
	}
`;

export async function getUser(variable: GraphQL_GetUserQueryVariables) {
	return myQuery<GraphQL_GetUserQueryVariables, GraphQL_GetUserQuery>({
		variable: variable,
		request: request
	});
}
