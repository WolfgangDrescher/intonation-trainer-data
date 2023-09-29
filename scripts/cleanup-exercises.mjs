import { globSync } from 'glob';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dirName = `${__dirname}/../exercises`;


globSync(`${dirName}/**/*.yaml`).forEach(file => {
    const config = yaml.load(fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, yaml.dump(config, {
        indent: 4,
        lineWidth: -1,
        sortKeys: true,
    }), { encoding: 'utf8' });
});
