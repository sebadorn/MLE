const globals = require( 'globals' );
const js = require( '@eslint/js' );


module.exports = [
	js.configs.recommended,
	{
		files: [
			'*.js',
			'**/*.js',
		],
		languageOptions: {
			ecmaVersion: 2022,
			globals: {
				...globals.browser,
				BG_TASK: true,
				browser: false,
				chrome: false,
			},
			sourceType: 'script',
		},
		ignores: [
			'/_ignore/',
			'/build/',
			'/node_modules/',
		],
		rules: {
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				}
			],
			'no-var': ['warn'],
			'quotes': [
				'warn',
				'single',
				{
					avoidEscape: true,
				}
			],
		},
	},
	{
		files: ['server/*.js'],
		languageOptions: {
			globals: {
				InstallTrigger: true,
			},
		},
	},
];