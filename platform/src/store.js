// One revisioned record serves both narration modes and the vehicle geometry.
const response = await fetch('data/project.json');
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
export const state = {route: 'overview', sub: '', mode: new URLSearchParams(location.search).get('mode') === 'technical' ? 'technical' : 'simple'};
export const part = id => record.parts.find(p => p.id === id);
export function setMode(mode) {
  state.mode = mode === 'technical' ? 'technical' : 'simple';
  document.body.dataset.mode = state.mode;
  document.querySelectorAll('.narration-switch button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
  const url = new URL(location.href);
  if (state.mode === 'technical') url.searchParams.set('mode', 'technical'); else url.searchParams.delete('mode');
  history.replaceState(null, '', url);
  document.dispatchEvent(new CustomEvent('vaccino:mode', {detail: state.mode}));
}
