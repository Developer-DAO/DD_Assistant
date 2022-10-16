// prettier.config.js or .prettierrc.js
module.exports = {
	printWidth: 100,
	tabWidth: 4,
	useTabs: true,
	semi: true,
	singleQuote: true,
	quoteProps: 'as-needed',
	jsxSingleQuote: false,
	trailingComma: 'none',
	bracketSpacing: true,
	jsxBracketSameLine: false,
	arrowParens: 'always',
	rangeStart: 0,
	rangeEnd: Infinity,
	requirePragma: false,
	insertPragma: false,
	proseWrap: 'preserve',
	htmlWhitespaceSensitivity: 'css',
	endOfLine: 'lf',
	plugins: ['prettier-plugin-prisma']
};
