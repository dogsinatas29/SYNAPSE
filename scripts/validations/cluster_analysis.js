const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'top100_semantic_precision.json'), 'utf8'));

let structural = [];
let flow = [];
let execution = [];
let others = [];

data.top100.forEach((item, index) => {
    const { fanIn, fanOut, blastRadius } = item.evidence;
    
    // Clustering logic (heuristics based on user's insight)
    if (fanIn > 15 && fanOut < 3 && blastRadius < 3) {
        structural.push(item);
    } else if (fanIn < 10 && fanOut > 10 && blastRadius > 15) {
        flow.push(item);
    } else if (fanIn >= 2 && fanOut >= 2 && blastRadius >= 2 && fanIn < 20 && fanOut < 15) {
        execution.push(item);
    } else {
        // Fallback for GraphModel (fanIn 57, fanOut 3, blastRadius 3) which is an outlier
        if (fanIn > 10 && fanOut >= 2 && blastRadius >= 2) {
            execution.push(item); // Actually user called GraphModel Structural or Execution? "GraphModel은 블랙홀도 화이트홀도 아닙니다. 라그랑주 쪽에 가깝습니다... system_core 3축: schema(구조), extension(흐름), GraphModel(모델)"
        } else {
            others.push(item);
        }
    }
});

function printTable(title, list) {
    console.log(`\n### ${title} (${list.length} items)`);
    console.log('| Rank (Orig) | Path | FanIn | FanOut | BlastRadius |');
    console.log('|---|---|---|---|---|');
    list.slice(0, 10).forEach(i => { // print top 10 per cluster for brevity
        const origRank = data.top100.findIndex(x => x.path === i.path) + 1;
        console.log(`| ${origRank} | \`${i.path.split('/').pop()}\` | ${i.evidence.fanIn} | ${i.evidence.fanOut} | ${i.evidence.blastRadius} |`);
    });
}

printTable("Structural Hub Pattern (블랙홀)", structural);
printTable("Flow Controller Pattern (화이트홀)", flow);
printTable("Execution Engine Pattern (라그랑주)", execution);
// printTable("Others / Unclassified", others);

