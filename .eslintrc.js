module.exports = {
	extends: ['alloy', 'alloy/typescript'],
	env: {
		// Your environments (which contains several predefined global variables)
		//
		// browser: true,
		// node: true,
		// mocha: true,
		// jest: true,
		// jquery: true
	},
	globals: {
		// Your global variables (setting to false means it's not allowed to be reassigned)
		//
		// myGlobal: false
	},
	rules: {
		// Customize your rules
		// '@typescript-eslint/explicit-member-accessibility': 'off'
		// Disable para limit
		'max-params': 0,
		complexity: ['error', 50],
		'no-warning-comments': [1, { terms: ['todo', 'fixme', 'to-do'], location: 'anywhere' }],
		'max-depth': ['error', 8],
		'@typescript-eslint/consistent-type-definitions': 'off'
	}
};
