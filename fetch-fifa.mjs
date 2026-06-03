async function run() {
    const res = await fetch("https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams");
    const text = await res.text();
    const fs = await import('fs');
    fs.writeFileSync('fifa.html', text);
    console.log("Written to fifa.html. Length:", text.length);
}
run();
