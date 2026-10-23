const path = require('node:path');
const fs = require('node:fs');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');

const quote = (name) => '"' + name.replaceAll('"', '""') + '"';
const preserved = new Set(['Clinic', 'User', 'ClinicUser', 'EmailSettings', '_prisma_migrations']);

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('No database connection configured');
  const url = new URL(connectionString);
  const schema = url.searchParams.get('schema') || 'public';
  url.searchParams.delete('schema');
  const client = new Client({ connectionString: url.toString(), connectionTimeoutMillis: 10000 });
  await client.connect();
  await client.query("SET statement_timeout = '60s'");
  let transaction = false;
  try {
    const target = (await client.query('SELECT current_database() AS database, inet_server_addr()::text AS server')).rows[0];
    const tables = (await client.query('SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename', [schema])).rows.map((row) => row.tablename);
    const models = [...fs.readFileSync(path.join(__dirname, '../prisma/schema.prisma'), 'utf8').matchAll(/^model (\w+) \{/gm)].map((match) => match[1]);
    if (tables.some((name) => !models.includes(name) && name !== '_prisma_migrations') || models.some((name) => !tables.includes(name))) {
      throw new Error('Database tables differ from the reviewed Prisma models. Aborting.');
    }
    const table = (name) => quote(schema) + '.' + quote(name);
    const relations = (await client.query(`SELECT child.relname AS child, parent.relname AS parent,
      child_ns.nspname AS child_schema, parent_ns.nspname AS parent_schema
      FROM pg_constraint c JOIN pg_class child ON child.oid = c.conrelid
      JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
      JOIN pg_class parent ON parent.oid = c.confrelid
      JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
      WHERE c.contype = 'f' AND (child_ns.nspname = $1 OR parent_ns.nspname = $1)`, [schema])).rows;
    if (relations.some((r) => r.child_schema !== schema || r.parent_schema !== schema)) throw new Error('Cross-schema foreign keys found. Aborting.');
    const pending = new Set(tables.filter((name) => !preserved.has(name)));
    const order = [];
    while (pending.size) {
      const next = [...pending].find((name) => !relations.some((r) => r.parent === name && pending.has(r.child) && r.child !== name));
      if (!next) throw new Error('Deletion dependency cycle found. Aborting.');
      order.push(next);
      pending.delete(next);
    }
    const owners = (await client.query(`SELECT id, "userId", "clinicId" FROM ${table('ClinicUser')} WHERE role = 'owner' ORDER BY id`)).rows;
    const clinics = (await client.query(`SELECT id FROM ${table('Clinic')} ORDER BY id`)).rows;
    if (!owners.length || clinics.some((clinic) => !owners.some((owner) => owner.clinicId === clinic.id))) throw new Error('Each clinic must have an owner. Aborting.');
    const count = async (name) => Number((await client.query('SELECT count(*) AS count FROM ' + table(name))).rows[0].count);
    console.log({ host: url.hostname, port: url.port || '5432', database: target.database, schema, server: target.server });
    console.log('KEEP: all clinics and clinic email settings; owner memberships and their user accounts; migration history.');
    console.log('DELETE: all other application data, including practitioners, patients, visits, invoices, templates, notifications and email history.');
    const preview = [];
    for (const name of order) preview.push({ table: name, deleteRows: await count(name) });
    console.table(preview);
    console.log({ keepClinics: clinics.length, keepOwnerMemberships: owners.length, keepOwnerAccounts: new Set(owners.map((owner) => owner.userId)).size,
      deleteOtherMemberships: (await count('ClinicUser')) - owners.length,
      deleteOtherUsers: (await count('User')) - new Set(owners.map((owner) => owner.userId)).size });
    if (process.argv.includes('--preview')) return;
    if (!stdin.isTTY) throw new Error('Run interactively to confirm the displayed database target.');
    const confirmation = `DELETE ${url.hostname}/${target.database}/${schema}`;
    const prompt = readline.createInterface({ input: stdin, output: stdout });
    let answer;
    try { answer = await prompt.question('Irreversible. Type exactly: ' + confirmation + '\n> '); }
    finally { prompt.close(); }
    if (answer !== confirmation) throw new Error('Cancelled; no changes made.');
    await client.query('BEGIN');
    transaction = true;
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    await client.query('LOCK TABLE ' + tables.map(table).join(', ') + ' IN ACCESS EXCLUSIVE MODE');
    const currentOwners = (await client.query(`SELECT id, "userId", "clinicId" FROM ${table('ClinicUser')} WHERE role = 'owner' ORDER BY id`)).rows;
    const currentClinics = (await client.query(`SELECT id FROM ${table('Clinic')} ORDER BY id`)).rows;
    if (JSON.stringify(currentOwners) !== JSON.stringify(owners) || JSON.stringify(currentClinics) !== JSON.stringify(clinics)) throw new Error('Owners/clinics changed since preview. Aborting.');
    await client.query(`UPDATE ${table('Clinic')} SET "defaultNoteTemplateId" = NULL, "defaultDepartmentId" = NULL`);
    await client.query(`UPDATE ${table('ClinicUser')} SET "defaultNoteTemplateId" = NULL, "departmentId" = NULL, "defaultRoomId" = NULL WHERE role = 'owner'`);
    for (const name of order) await client.query('DELETE FROM ' + table(name));
    await client.query(`DELETE FROM ${table('ClinicUser')} WHERE role <> 'owner'`);
    await client.query(`DELETE FROM ${table('User')} WHERE id NOT IN (SELECT "userId" FROM ${table('ClinicUser')} WHERE role = 'owner')`);
    for (const name of order) if (await count(name)) throw new Error('Postcondition failed: ' + name);
    if (await count('ClinicUser') !== owners.length || await count('Clinic') !== clinics.length ||
        await count('User') !== new Set(owners.map((owner) => owner.userId)).size) throw new Error('Preserved counts do not match');
    await client.query('COMMIT');
    transaction = false;
    for (const name of order) if (await count(name)) throw new Error('Data appeared after commit: stop API/workers before retrying.');
    console.log('Verified: application data cleared; clinic settings and owner accounts preserved.');
  } finally {
    if (transaction) await client.query('ROLLBACK');
    await client.end();
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
