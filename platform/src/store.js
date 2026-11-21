// One revisioned record serves both narration modes and the vehicle geometry.
const response = await fetch('data/project.json?v=engineering-02', {cache:'no-store'});
if (!response.ok) throw new Error('Platform kaydı açılamadı. Yerel sunucuyu kontrol edin.');
const raw = await response.json();
const parameters = structuredClone(raw.parameters);
parameters.battery.cellCount = parameters.battery.series * parameters.battery.parallel;
parameters.battery.fullV = parameters.battery.series * parameters.battery.cellFullV;
parameters.battery.nominalWh = parameters.battery.nominalV * parameters.battery.capacityAh;
parameters.transmission.ratio = parameters.transmission.largeRadiusMm / parameters.transmission.smallRadiusMm;
const format = value => typeof value === 'number' ? value.toLocaleString('tr-TR', {maximumFractionDigits: 2}) : value;
const lookup = path => path.split('.').reduce((value, key) => value?.[key], parameters);
function resolve(value) {
  if (typeof value === 'string') return value.replace(/\{\{([\w.]+)\}\}/g, (match, path) => format(lookup(path)) ?? match);
  if (Array.isArray(value)) return value.map(resolve);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, resolve(v)]));
  return value;
}
export const record = resolve(raw);
export {parameters, format};
export const state = {route:'overview', sub:'', drivetrain:'central'};
export const part = id => record.parts.find(p => p.id === id);

export function activeDrivetrain() {
  if(state.route==='mechanical'&&state.sub==='transmission'&&!document.body.classList.contains('presentation-active')){
    return record.presentation.drivetrain.variants[state.drivetrain];
  }
}

export function inspectionSystem() {
  if(['mechanical','electrical'].includes(state.route)&&!document.body.classList.contains('presentation-active')){
    const entry=record.presentation.systems[state.route].find(entry=>entry.id===state.sub);
    const drivetrain=activeDrivetrain();
    return drivetrain?{...entry,parts:drivetrain.parts}:entry;
  }
}
