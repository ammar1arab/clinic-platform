const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const errors = [];
const names = new Set();
let skills = 0;
let rules = 0;

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}

for (const file of files(path.join(root, '.agents')).concat(files(path.join(root, '.cursor')))) {
  if (!/\.(md|mdc)$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  const fail = message => errors.push(`${relative}: ${message}`);
  if (path.basename(file) === 'SKILL.md') {
    skills++;
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) { fail('missing frontmatter'); continue; }
    const name = frontmatter[1].match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1];
    if (!name || name.length > 64 || name !== path.basename(path.dirname(file))) fail('invalid name or directory mismatch');
    if (name && names.has(name)) fail('duplicate skill name');
    if (name) names.add(name);
    if (!/^description:\s*\S/m.test(frontmatter[1])) fail('missing description');
    if (/\[TODO:|TODO: replace|TODO: fill/i.test(text)) fail('unfinished scaffold');
    if (text.includes('\uFFFD')) fail('invalid text encoding');
  }
  if (file.endsWith('.mdc')) {
    rules++;
    if (!/^---\r?\n[\s\S]*?\r?\n---/.test(text)) fail('missing rule frontmatter');
    if (!/^alwaysApply:\s*(true|false)\s*$/m.test(text)) fail('missing rule application flag');
  }
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1].split('#')[0];
    if (!link || /^[a-z]+:/i.test(link)) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(link));
    if (!fs.existsSync(target)) fail(`broken link: ${link}`);
  }
}

const tasks = JSON.parse(fs.readFileSync(path.join(root, '.vscode/tasks.json'), 'utf8'));
for (const task of tasks.tasks.filter(task => task.label.startsWith('Cureva:'))) {
  if (task.command !== 'rtk' || task.args[0] !== 'proxy') errors.push(`${task.label}: expected RTK wrapper`);
  if (!fs.existsSync(path.join(root, task.args[2]))) errors.push(`${task.label}: script does not exist`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${skills} skills, ${rules} rules, local documentation links, and Cureva editor task targets.`);
}
