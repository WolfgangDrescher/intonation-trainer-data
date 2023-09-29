import slug from 'slug';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { globSync } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dirName = `${__dirname}/../scores`;
execSync(`rm -rf ./${dirName}`);
execSync(`mkdir -p ${dirName}`);

slug.charmap['_'] = '-';

const [scoreDir] = process.argv.slice(2);

if (!fs.existsSync(scoreDir) || !fs.lstatSync(scoreDir).isDirectory()) {
    throw new Error(`${scoreDir} is not a directory. Pass path to scores directory as argv.`);
}

globSync(`${scoreDir}/**/*.musicxml`).forEach(file => {
    const fileName = file.split('/').pop();
    console.log(fileName)
    const name = fileName.replace(/\.[^/]+$/, '');
    const escapedFilePath = `${file}`.replaceAll(' ', '\\ ');
    const sluggedFilename = `${slug(name)}.mei`;
    const newPath = `${dirName}/${sluggedFilename}`.replaceAll(' ', '\\ ');
    execSync(`verovio -f xml -t mei -a -o ${newPath} --xml-id-checksum ${escapedFilePath}`);
    console.log('')
});
