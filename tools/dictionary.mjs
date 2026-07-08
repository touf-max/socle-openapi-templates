// Chargeur du dictionnaire Estreem (.xlsx). Résout un x-dictionary-id vers la définition
// attendue (type, pattern, longueurs, enum, digits) en suivant la chaîne :
//   x-dictionary-id → DICO_Complet.Reference → Type → TypesSimples (simple) | Codeset (énum).
import xlsx from 'xlsx';

const trimKeys = (r) => { const o = {}; for (const k of Object.keys(r)) o[String(k).trim()] = r[k]; return o; };
const str = (v) => (v == null ? '' : String(v).trim());
const num = (v) => { const s = str(v); if (s === '') return null; const n = Number(s.replace(',', '.')); return Number.isFinite(n) ? n : null; };

export function loadDictionary(file) {
  const wb = xlsx.readFile(file);
  const sheet = (n) => (wb.Sheets[n] ? xlsx.utils.sheet_to_json(wb.Sheets[n], { defval: '' }).map(trimKeys) : []);

  const byId = new Map();
  for (const r of sheet('DICO_Complet')) { const id = str(r['Reference']); if (id) byId.set(id, r); }

  const simpleByName = new Map();
  for (const r of sheet('TypesSimples')) { const n = str(r['Libellés']); if (n) simpleByName.set(n, r); }

  const codesetByName = new Map();
  for (const r of sheet('Codeset')) {
    const n = str(r['Codeset']); if (!n) continue;
    if (!codesetByName.has(n)) codesetByName.set(n, { format: str(r['Format']), values: [] });
    const d = str(r['Data']); if (d) codesetByName.get(n).values.push(d);
  }

  const simpleDef = (name) => {
    const s = simpleByName.get(name); if (!s) return null;
    return {
      type: str(s['Type']) || null,
      pattern: str(s['Pattern']) || null,
      minLength: num(s['minLength /mininclusive']),
      maxLength: num(s['maxLength']),
      fractionDigits: num(s['FractionD']),
      totalDigits: num(s['TotalD']),
    };
  };

  return {
    version: file,
    // Renvoie { found, kind:'simple'|'codeset'|'unknown', type, pattern, minLength, maxLength,
    //           fractionDigits, totalDigits, enum, object, attribute, typeName }
    resolve(id) {
      const e = byId.get(str(id));
      if (!e) return { found: false };
      const typeName = str(e['Type']);
      const meta = { object: str(e['Object']), attribute: str(e['Attribute']), typeName };
      if (simpleByName.has(typeName)) return { found: true, kind: 'simple', ...simpleDef(typeName), ...meta };
      if (codesetByName.has(typeName)) {
        const cs = codesetByName.get(typeName);
        return { found: true, kind: 'codeset', ...(simpleDef(cs.format) || { type: 'string' }), enum: cs.values, ...meta };
      }
      return { found: true, kind: 'unknown', ...meta };
    },
  };
}
