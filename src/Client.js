/*
Name: Mywa BOT
Versi: Beta
Made by: Amirul Dev
Contact: 085157489446
Github: amiruldev20
*/

/* import config & module external */
import config from "../config.js";
import qrcode from "qrcode-terminal";
import path from "path";
import Fs from "fs/promises";
import fs from 'fs'
import chalk from "chalk";
import chokidar from "chokidar";
import url from "url";
import { exec } from "child_process";
const { Client, LinkingMethod } = (await import("mywajs")).default

/* module internal */
import func from "./lib/function.js";
global.commands = new (
    await import(`./lib/collection.js?v=${Date.now()}`)
).default();
global.ctx = {};

/* reload system */
// start function
const Funcc = path.join(process.cwd(), "sys/lib/function.js");
let Fun = func.createFilename(Funcc);
let funn = (await import(Fun)).default;

fs.watchFile(Funcc, async () => {
    console.log(chalk.yellow(`Update: ${Funcc}`));
    Fun = `${Fun.split("?")[0]}?v=${Date.now()}`;
    funn = (await import(Fun)).default;
});
global.Func = funn;

// start serialize
const Waa = path.join(process.cwd(), "sys/lib/serialize.js");
let Wa = Func.createFilename(Waa);
let wa = await import(Wa);

fs.watchFile(Waa, async () => {
    console.log(chalk.yellow(`Update: ${Wa}`));
    Wa = `${Wa.split("?")[0]}?v=${Date.now()}`;
    wa = await import(Wa);
});
// end serialize

// start handler
const Hll = path.join(process.cwd(), "sys/event/message.js");
let Hl = Func.createFilename(Hll);
let mes = await import(Hl);

fs.watchFile(Hll, async () => {
    console.log(chalk.yellow(`Update: ${Hll}`));
    Hl = `${Hl.split("?")[0]}?v=${Date.now()}`;
    mes = await import(Hl);
});
// end handler

// start jadibot
const Jbb = path.join(process.cwd(), "sys/lib/jadibot.js");
let Jb = Func.createFilename(Jbb);
let other = await import(Jb);

fs.watchFile(Jbb, async () => {
    console.log(chalk.yellow(`Update: ${Jbb}`));
    Jb = `${Jb.split("?")[0]}?v=${Date.now()}`;
    other = await import(Jb);
});
// end jadibot

// start localdb
import Localdb from "./database/localdb.js";
const myDb = new Localdb(config.database);
// end localdb

async function start() {
    mes.readCmd();
    process.on("uncaughtException", (err) => console.error(err));
    //process.on("unhandledRejection", (err) => console.log(err))

    const mywa = new Client({
        //authStrategy: new mywajs.LocalAuth (),
        linkingMethod: new LinkingMethod({
            phone: {
                number: config.login,
            },
        }),
        playwright: {
            headless: true,
            devtools: false,
            args: ["--no-sandbox"],
            //  executablePath: "/snap/bin/chromium"
        },
        markOnlineAvailable: false,
        authTimeoutMs: 60000,
        //  selector: 6
        //clearSessions: 5
        // otherClear: 0,
        // clearMsg: 0
    });

    mywa.initialize();

    mywa.on("code", (mcode) => {
        console.log(`Your Code: ${chalk.green(mcode)}`);
    });

    mywa.on("qr", (qr) => {
        qrcode.generate(qr, { small: true });
    });

    mywa.on("loading_screen", (percent, message) => {
        console.log("loading scren...");
    });

    mywa.on("auth_failure", console.error);

    mywa.on("ready", async (m) => {
        console.log(chalk.green("Session is connected. bots are ready to use!!"));
        await mywa.sendMessage(`${config.owner[0]}@c.us`, `Mywa BOT CONNECTED`);
        //func.loadMs(mywa);
        /* load database */
        global.db = {
            users: [],
            store: [],
            groups: [],
            statistic: {},
            sticker: {},
            setting: {},
            command: {},
            otherbot: {},
            ...((await myDb.fetch()) || {}),
        };
        myDb.save(global.db);

        /* load connect jadibot 
        if (db.otherbot.length > 0) {
          console.log(`List jadibot ${db.otherbot.length}`);
          db.otherbot.forEach(async (item) => {
            // if (item.premium === false) {
            //  return; // Lewati pemrosesan jadiBot() jika item.premium adalah false
            // }
            // other.jadiBot(mywa, item.jid);
          });
        } else {
          console.log(`Total jadibot ${db.otherbot.length}`);
          db.otherbot.forEach((item) => {
            // if (item.premium === false) {
            //  return; // Lewati pemrosesan jadiBot() jika item.premium adalah false
            // }
            // other.jadiBot(mywa, item.jid);
          });
        }
        */
    });

    mywa.on("disconnected", (m) => {
        if (m) start();
    });

    mywa.on("message_create", async (message) => {
        let m = await wa.serialize(mywa, message);
        //await fs.writeFileSync("tes.txt", m)
        await mes.handler(mywa, m);
    });

    mywa.on("poll_vote", async (tes) => {
        console.log("poll ", tes);
    });
    const folderPath = "./temp";

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        console.log('Folder "temp" telah berhasil dibuat.');
    } else {
    }

    setInterval(() => {
        const tmpFiles = fs.readdirSync("./temp");
        if (tmpFiles.length > 0) {
            tmpFiles
                .filter((v) => !v.endsWith(".file"))
                .map((v) => fs.unlinkSync("./temp/" + v));
        }
    }, 60 * 1000 * 3);

    /* save database every 15 seconds */
    setInterval(async () => {
        if (global.db) await myDb.save(global.db);
    }, 5000);
    setInterval(async () => {
        /*
        await exec('rm -rf .mywa_auth/Default/Cache')
        try {
            await Fs.rm('.mywa_auth/Default/Service Worker/CacheStorage', { recursive: true, force: true });
        } catch { }

        try {
            await Fs.rm('.mywa_auth/Default/Code Cache', { recursive: true, force: true });
        } catch { }

/*
        const sessionFolderPath = '.mywa_auth/Default/IndexedDB';

        setInterval(async () => {
            try {
                const folders = await fs.promises.readdir(sessionFolderPath);
                const currentTime = new Date();

                for (const folder of folders) {
                    const folderPath = path.join(sessionFolderPath, folder);
                    const stats = await fs.promises.stat(folderPath);
                    const lastModifiedTime = stats.mtime;

                    // Menghitung selisih waktu dalam milisecond
                    const timeDifference = currentTime - lastModifiedTime;

                    // Menghapus folder jika selisih waktu lebih dari atau sama dengan 5 menit (300000 ms)
                    if (timeDifference >= 300000) {
                        await fs.promises.rm(folderPath, { recursive: true });
                        console.log(`Folder ${folderPath} dihapus.`);
                    }
                }
            } catch (error) {
                console.error('Terjadi kesalahan:', error);
            } *
            await exec('rm -rf .mywa_auth/Default/DawnCache');

            await exec('rm -rf .mywa_auth/Default/Service Worker/ScriptCache');
            await exec('rm -rf .mywa_auth/Default/GPUCache')*/

        }, 5000)

        return mywa;
    }

let choki = chokidar.watch(
            [
                path.join(process.cwd(), config.pathCmd),
                path.join(process.cwd(), "config.js"),
            ],
            {
                ignored: /^\.|client.js/,
                persistent: true,
            }
        );
    choki
        .on("change", async (Path) => {
            //await import(Func.__filename(Path) + "?update=" + Date.now())
            const command = await import(Func.__filename(Path) + "?v=" + Date.now());
            commands.set(command ?.default ?.name, command);
        })
        .on("add", async function (Path) {
            const command = await import(Func.__filename(Path) + "?v=" + Date.now());
            commands.set(command ?.default ?.name, command);
        });

    start();
