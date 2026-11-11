// Recorre el flujo obligatorio en la UI con Playwright y guarda una captura por vista.
// Requiere backend en :8081 y `npx ng serve` en :4200. Uso: node scripts/capturas.mjs [carpeta]
import { chromium } from 'playwright';
const OUT = process.argv[2] || 'docs/evidencias/capturas/';
const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome' });
async function sesion(user) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, locale: 'es-MX', timezoneId: 'America/Mexico_City' });
  const p = await ctx.newPage();
  p.on('console', m => m.type()==='error' && console.log('CONSOLE', user, m.text()));
  await p.goto('http://localhost:4200/');
  await p.waitForURL('**/login');
  if (user === 'ana') await p.screenshot({ path: OUT + '01-login.png' });
  await p.getByRole('button', { name: new RegExp('^' + user) }).click();
  await p.getByRole('button', { name: 'Entrar' }).click();
  return p;
}
const desc = 'El proyector del aula no enciende; el foco de encendido parpadea en naranja.';
// ana
let p = await sesion('ana');
await p.waitForURL('**/mis-incidencias');
await p.selectOption('#ubicacion', { index: 1 });
await p.selectOption('#categoria', { label: 'Equipo de cómputo' });
await p.selectOption('#prioridad', { label: 'Alta' });
await p.fill('#descripcion', desc);
await p.getByRole('button', { name: 'Reportar incidencia' }).click();
await p.getByText('registrada').waitFor();
await p.screenshot({ path: OUT + '02-usuario-reporta.png' });
const id = (await p.getByText(/Incidencia #\d+ registrada/).innerText()).match(/#(\d+)/)[1];
console.log('id', id);
// Las filas y tarjetas se ubican por id, no por descripción: así el script se puede repetir sobre la misma base.
const porId = new RegExp('#' + id + '\\b');
const anaCtx = p;
// elena
p = await sesion('elena');
await p.waitForURL('**/coordinacion');
const fila = p.locator('tr', { hasText: porId });
await fila.waitFor();
await fila.locator('select').selectOption({ label: 'Carlos Méndez' });
await p.screenshot({ path: OUT + '03-coordinador-asigna.png' });
await fila.getByRole('button', { name: 'Asignar' }).click();
await p.getByText(/asignada a Carlos/).waitFor();
// carlos
p = await sesion('carlos');
await p.waitForURL('**/tecnico');
let card = p.locator('article', { hasText: porId });
await card.getByRole('textbox').fill('Reviso el proyector y el cable de corriente');
await card.getByRole('button', { name: 'Iniciar atención' }).click();
await p.getByText(/ahora está «En proceso»/).waitFor();
card = p.locator('article', { hasText: porId });
await card.getByRole('textbox').fill('Se reemplazó la lámpara del proyector; enciende y proyecta bien');
await p.screenshot({ path: OUT + '04-tecnico-avanza.png' });
await card.getByRole('button', { name: 'Marcar como resuelta' }).click();
await p.getByText(/ahora está «Resuelta»/).waitFor();
// ana detalle
await anaCtx.goto('http://localhost:4200/mis-incidencias');
await anaCtx.locator('article', { hasText: porId }).getByRole('link', { name: 'Ver seguimiento' }).click();
await anaCtx.locator('.linea li').first().waitFor();
await anaCtx.locator('.linea li').nth(3).waitFor();
const entradas = await anaCtx.locator('.linea li').allInnerTexts();
console.log('entradas historial', entradas.length);
const esperado = [['Ana López', 'Reportada'], ['Elena Salazar', 'Asignada'], ['Carlos Méndez', 'En proceso'], ['Carlos Méndez', 'Resuelta']];
if (entradas.length !== 4 || !esperado.every(([autor, estado], k) => entradas[k].includes(autor) && entradas[k].includes(estado))) {
  throw new Error('El seguimiento no tiene las 4 entradas esperadas: ' + JSON.stringify(entradas));
}
await anaCtx.screenshot({ path: OUT + '05-detalle-seguimiento.png' });
// extras: 401 manual, error de validación
await b.close();
