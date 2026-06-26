import { spawn } from 'child_process';
import chalk from 'chalk';

function run(label, file, color) {
    const proc = spawn(process.argv[0], [file], {
        stdio: ['inherit', 'pipe', 'pipe']
    });

    proc.stdout.on('data', d => process.stdout.write(color(`[${label}] `) + d));
    proc.stderr.on('data', d => process.stderr.write(color(`[${label}] `) + d));

    proc.on('exit', code => {
        if (code !== 0) {
            console.log(color(`[${label}] Crashed (code ${code}), restarting in 5s...`));
            setTimeout(() => run(label, file, color), 5000);
        }
    });

    return proc;
}

console.log(chalk.green('[MAIN] Starting WhatsApp Bot + Dashboard...'));
run('BOT', 'start.js', chalk.cyan);
run('WEB', 'web.js', chalk.magenta);
