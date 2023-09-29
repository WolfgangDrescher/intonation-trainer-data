import slug from 'slug';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
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
    s += parseInt(matches[1], 10) * 60 * 60;
    s += parseInt(matches[2], 10) * 60;
    s += parseInt(matches[3], 10);
    s += parseInt(matches[4], 10) / 25;
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
    let startTime = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(/([\d]{2}):([\d]{2}):([\d]{2}):([\d]{2})/);
        const time = timecodesToSeconds(matches);
        if (time && line.match(/[\W]fehler|falsch/i) || (i + 1 >= lines.length)) {
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
        if (time && startTime) {
            const markerTime = timecodesToSeconds(matches);
            const [, comment, measure] = line.replace(/\t{2,}/g, '\t').split('\t').map(l => l.trim());
            const barNumber = measure?.replace(/[^0-9-]/g, '');
            const time = parseFloat((markerTime - startTime).toFixed(2));
            variant.markers.push({
                noteIds: [],
                measure: measure ? (barNumber.match(/^\d+$/) ? parseInt(barNumber, 10) : barNumber) : null,
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
        year: 1920,
        description: null,
        variants,
    };

    const sluggedFilename = `${slug(name.replace(/.?Schnitt.?marker$/, ''))}.yaml`;
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
