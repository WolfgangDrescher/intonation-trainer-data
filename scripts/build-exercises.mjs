import slug from 'slug';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dirName = `${__dirname}/../exercises`;

slug.charmap['_'] = '-';

const [dir] = process.argv.slice(2);

if (!fs.existsSync(dir) || !fs.lstatSync(dir).isDirectory()) {
    throw new Error(`${dir} is not a directory. Pass path to directory as argv.`);
}

function timecodesToSeconds(matches) {
    if (!matches) return null;
    let s = 0;
    if (typeof matches[1] === 'undefined' && typeof matches[2] === 'undefined') {
        // Std:Min:Sek
        s += parseInt(matches[3] ?? 0, 10) * 60 * 60;
        s += parseInt(matches[4] ?? 0, 10) * 60;
        s += parseInt(matches[5] ?? 0, 10);
    } else {
        // Std:Min:Sek:Frames
        s += parseInt(matches[2] ?? 0, 10) * 60 * 60;
        s += parseInt(matches[3] ?? 0, 10) * 60;
        s += parseInt(matches[4] ?? 0, 10);
        s += parseInt(matches[5] ?? 0, 10) / 25;
    }
    return s;
}

globSync(`${dir}/**/*.txt`).forEach(file => {
    const fileName = file.split('/').pop();
    const name = fileName.replace(/\.[^/]+$/, '');
    const content = fs.readFileSync(file, 'utf8').toString();
    console.log(fileName);
    console.log(content);
    const lines = content.split('\n').map(l => l.trim());
    const variants = [];
    let variant = null;
    let startTime = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('E:')) {
            continue;
        }
        const matches = line.match(/(([\d]{2}):)?([\d]{2}):([\d]{2}):([\d]{2})/);
        const time = timecodesToSeconds(matches);
        if (time !== null && line.match(/[\W]fehler|falsch/i) || (i + 1 >= lines.length)) {
            if (variant) {
                variants.push(variant);
            }
            variant = {
                id: variants.length + 1,
                audioFilename: null,
                difficulty: 0,
                markers: [],
            };
            startTime = timecodesToSeconds(matches);
            continue;
        }
        if (time !== null && startTime !== null) {

            const markerTime = timecodesToSeconds(matches);
            let [, comment, measure] = line.replace(/\t{2,}/g, '\t').split('\t').map(l => l.trim());
            const matchMeasureNumber = comment.match(/^T\D?(\d+)/);
            let barNumber = measure?.replace(/[^0-9-]/g, '');
            if (matchMeasureNumber) {
                barNumber = matchMeasureNumber[1];
                comment = comment.replace(/^T\D?(\d+)/, '').trim();
            }
            const time = parseFloat((markerTime - startTime).toFixed(2));
            variant.markers.push({
                noteIds: [],
                measure: barNumber ? (barNumber.match(/^\d+$/) ? parseInt(barNumber, 10) : barNumber) : null,
                comment: comment ?? null,
                time,
            });
        }
    }
    const config = {
        scoreFilename: null,
        audioFilename: null,
        composer: null,
        title: null,
        instrumentation: null,
        performers: null,
        license: 'cc-by-sa-4.0',
        year: null,
        description: null,
        variants,
    };

    const normalizedName = name.replace(/(.?Schnitt)?.?marker$/i, '');
    const sluggedFilename = `${slug(normalizedName)}.yaml`;
    const newPath = `${dirName}/${sluggedFilename}`.replaceAll(' ', '\\ ');
    const yamlString = yaml.dump(config, {
        indent: 4,
        lineWidth: -1,
        sortKeys: true,
    });
    fs.writeFileSync(newPath, yamlString, { encoding: 'utf8' });
    // console.log(newPath)
    // console.log(yamlString)
});
