async function run() {
    const res = await fetch("https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=2026_FIFA_World_Cup&format=json");
    const json = await res.json();
    const pages = json.query.pages;
    const extract = Object.values(pages)[0].extract;
    const fs = await import('fs');
    fs.writeFileSync('wiki_text.txt', extract);
    console.log("Written, length:", extract.length);
}
run();
