import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

// const ICON_SRC = path.resolve(
//   "C:/Users/IzikFr/Downloads/Amital Data (UX & UI By TZUR)/icons/menu"
// );
// const DEST = path.resolve(
//   "C:/Amital-Infra-Repo/infra-lib/projects/infra-lib/src/lib/toolkit/assets/icons/menu"
// );

const ICON_SRC = path.resolve('C:/Users/IzikFr/Downloads/Amital Data (UX & UI By TZUR)/icons/system');
const DEST = path.resolve('C:/Amital-Infra-Repo/infra-lib/projects/infra-lib/src/lib/toolkit/assets/icons/system');

function toKebab(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
function toPascal(name) {
  return name
    .split(/[\s\-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

fs.readdirSync(ICON_SRC)
  .filter((f) => f.endsWith('.svg'))
  .forEach((file) => {
    const baseName = file.replace(/\.svg$/, '');
    const kebab = toKebab(baseName);
    const pascal = toPascal(baseName);
    const cmpName = `AmitalIcon${pascal}Component`;
    const selector = `amital-icon-${kebab}`;
    const srcSvg = fs.readFileSync(path.join(ICON_SRC, file), 'utf8').trim();
    // const folder   = path.join(DEST, selector);

    // mkdirp.sync(folder);

    // write .ts
    fs.writeFileSync(
      path.join(DEST, `${selector}.component.ts`),
      `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseIconComponent } from '../base-icon.component';

@Component({
  selector: '${selector}',
  standalone: true,
  template: ${'`'}
  ${srcSvg}
${'`'},
  styleUrls: ['../icon.scss'],  
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${cmpName} extends BaseIconComponent {}
`
    );
  });

console.log('Icon components generated!');
