var spawn = require('child_process').spawn;

function runcmd(cmd, args) {
    return new Promise((resolve, reject) => {
        let s = spawn(cmd, args);

        s.stdout.on('data', (data) => {
            process.stdout.write(data);
        });

        s.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        s.on('close', (code) => {
            if (code==0) resolve(0);
            else reject(new Error("Exited with non-zero result"));
        });
    })
}

module.exports = {
    runcmd: runcmd,
}