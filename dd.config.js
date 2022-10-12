const appName = 'dd-assistant';

module.exports = {
	apps: [
		{
			name: appName,
			autorestart: true,
			exec_mode: 'fork',
			watch: true,
			script: './dist/index.js',
			error_file: `~/.pm2/logs/${appName}-error.log`,
			out_file: `~/.pm2/logs/${appName}-out.log`,
			ignore_watch: ['node_modules', 'src']
		}
	]
};
