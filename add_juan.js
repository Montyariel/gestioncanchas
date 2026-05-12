const { createClient } = require("@supabase/supabase-js");
const supabase = createClient('https://vcwqhxuyngqcnpptirtb.supabase.co', 'sb_publishable_KC_PbsOU5-S20oOOMZW-SQ_OsAZeeNl');

async function main() {
  const { data, error } = await supabase.from('clientes').insert([
    { nombre: 'Juan Pérez', fecha_nacimiento: '2026-05-20' }
  ]);
  if (error) {
    console.log("Error inserting: " + error.message);
  } else {
    console.log("Juan Pérez added successfully.");
  }
}
main();
