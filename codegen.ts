import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: 'https://api.hashnode.com/',
	documents: ['./src/graph/*.ts'],
	generates: {
		'./src/graph/result.ts': {
			plugins: ['typescript', 'typescript-operations'],
			config: {
				typesPrefix: 'GraphQL_'
			}
		}
	}
};

export default config;
