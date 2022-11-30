import { gql } from 'graphql-request';

import { myQuery } from './graph';
import { GraphQL_GetPostsQuery, GraphQL_GetPostsQueryVariables } from './result';

const request = gql`
	query GetPosts($username: String!) {
		user(username: $username) {
			name
			photo
			publicationDomain
			publication {
				posts(page: 0) {
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

export async function getPosts(variable: GraphQL_GetPostsQueryVariables) {
	return myQuery<GraphQL_GetPostsQueryVariables, GraphQL_GetPostsQuery>({
		variable: variable,
		request: request
	});
}
