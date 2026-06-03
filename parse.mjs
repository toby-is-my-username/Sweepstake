import fs from 'fs';

let html = fs.readFileSync('wiki.html', 'utf8');
const regex = /title="([^"]+national football team)"/gi;
let match;
let teams = new Set();
while ((match = regex.exec(html)) !== null) {
    let team = match[1].replace(' national football team', '').replace(' men\'s', '');
    teams.add(team);
}
console.log(Array.from(teams));
