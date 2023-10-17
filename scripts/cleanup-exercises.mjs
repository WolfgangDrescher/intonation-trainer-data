import { globSync } from 'glob';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dirName = `${__dirname}/../exercises`;


globSync(`${dirName}/**/*.yaml`).forEach(file => {
    const config = yaml.load(fs.readFileSync(file, 'utf8'));
    config.audioFilename ??= null;
    config.audioFilename ??= null;
    config.composer ??= null;
    config.description ??= null;
    config.instrumentation ??= null;
    config.license ??= 'cc-by-sa-4.0';
    config.performers ??= null;
    config.scoreFilename ??= null;
    config.title ??= null;
    config.year ??= null;
    config.variants ??= [];
    for (let i = 0; i < config.variants.length; i++) {
        config.variants[i].audioFilename ??= null;
        config.variants[i].difficulty ??= 0;
        config.variants[i].id ??= i + 1;
        config.variants[i].markers ??= [];
        config.variants[i].note ??= null;
    }
    fs.writeFileSync(file, yaml.dump(config, {
        indent: 4,
        lineWidth: -1,
        sortKeys: true,
    }), { encoding: 'utf8' });
});
