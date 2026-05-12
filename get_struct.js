const { createClient } = require("@supabase/supabase-js");
const supabase = createClient('https://vcwqhxuyngqcnpptirtb.supabase.co', 'sb_publishable_KC_PbsOU5-S20oOOMZW-SQ_OsAZeeNl');

async function main() {
  const { data, error } = await supabase.from('clientes').select('*').limit(1);
  console.log(JSON.stringify(data));
}
main();
