import { gql } from 'graphql-request';

import { myQuery } from './graph';
import { GraphQL_UserQuery, GraphQL_UserQueryVariables } from './result';

const request = gql`
	query User($username: String!) {
		user(username: $username) {
			photo
			blogHandle
			publicationDomain
			publication {
				posts {
					dateAdded
					cuid
					title
					brief
					coverImage
					slug
				}
			}
		}
	}
`;

export async function getPosts(variable: GraphQL_UserQueryVariables) {
	return myQuery<GraphQL_UserQueryVariables, GraphQL_UserQuery>({
		variable: variable,
		request: request
	});
}
