import fs from 'fs';

async function run() {
    try {
        const res = await fetch("https://en.wikipedia.org/wiki/2026_FIFA_World_Cup");
        const text = await res.text();
        fs.writeFileSync("wiki.html", text);
        console.log("Written to wiki.html. Length:", text.length);
    } catch(e) {
        console.error(e);
    }
}
run();
