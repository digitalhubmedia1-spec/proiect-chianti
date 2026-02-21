import fs from 'fs';
import path from 'path';
import os from 'os';

// Configurare
const DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads');
const TARGET_DIR = 'C:\\FiscalNet\\Bonuri';
const IGNORE_EXTENSIONS = ['.crdownload', '.part', '.tmp', '.download', '.ini', '.DS_Store'];

// Asigură-te că folderul destinație există
if (!fs.existsSync(TARGET_DIR)) {
    try {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
        console.log(`[INFO] Creat folder destinație: ${TARGET_DIR}`);
    } catch (err) {
        console.error(`[EROARE] Nu s-a putut crea folderul ${TARGET_DIR}:`, err.message);
        process.exit(1);
    }
}

console.log(`=============================================`);
console.log(` MONITORIZARE DESCĂRCĂRI ACTIVĂ`);
console.log(` Sursă: ${DOWNLOADS_DIR}`);
console.log(` Destinație: ${TARGET_DIR}`);
console.log(` Apasă Ctrl+C pentru a opri scriptul.`);
console.log(`=============================================`);

// Funcție pentru a muta fișierul cu retry
function moveFile(filename, attempts = 0) {
    const sourcePath = path.join(DOWNLOADS_DIR, filename);
    const targetPath = path.join(TARGET_DIR, filename);

    // Verifică dacă fișierul mai există (poate a fost mutat deja sau șters)
    if (!fs.existsSync(sourcePath)) return;

    // Ignoră fișierele temporare sau incomplete
    const ext = path.extname(filename).toLowerCase();
    if (IGNORE_EXTENSIONS.includes(ext)) return;

    // Verifică dacă fișierul este "gata" (nu este blocat)
    try {
        // Încercăm să redenumim (mutăm) fișierul
        fs.renameSync(sourcePath, targetPath);
        console.log(`[SUCCES] Mutat: ${filename} -> ${TARGET_DIR}`);
    } catch (err) {
        // EBUSY sau EPERM înseamnă că fișierul este încă folosit (ex: descărcarea nu e gata)
        if (err.code === 'EBUSY' || err.code === 'EPERM') {
            if (attempts < 10) {
                // Mai încercăm peste 1 secundă
                // console.log(`[INFO] Fișierul ${filename} este ocupat, reîncercare ${attempts + 1}/10...`);
                setTimeout(() => moveFile(filename, attempts + 1), 1000);
            } else {
                console.error(`[EROARE] Nu s-a putut muta ${filename} după mai multe încercări. (Probabil încă deschis)`);
            }
        } else {
            console.error(`[EROARE] Eroare la mutarea ${filename}:`, err.message);
        }
    }
}

// Monitorizează folderul Downloads
let fsWait = false;
fs.watch(DOWNLOADS_DIR, (eventType, filename) => {
    if (filename) {
        // fs.watch poate trimite evenimente duplicate rapid, folosim un mic debounce sau verificăm direct
        // Pentru simplitate și robustețe, încercăm să mutăm fișierul după o scurtă întârziere
        // pentru a permite sistemului de operare să finalizeze crearea handle-ului
        
        setTimeout(() => {
            moveFile(filename);
        }, 500);
    }
});
