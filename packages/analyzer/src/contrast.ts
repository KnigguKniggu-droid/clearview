import { elements, finding, isVisible, ownText, styleOf } from './dom';
import type { AuditFinding, AuditRoot } from './types';

export interface RGBA { r: number; g: number; b: number; a: number }
const white: RGBA = {r:255,g:255,b:255,a:1};
const transparent: RGBA = {r:0,g:0,b:0,a:0};
const clamp = (value: number, max = 255): number => Math.max(0, Math.min(max, value));
export function parseColor(value: string): RGBA | null {
  const color = value.trim().toLowerCase();
  if (color === 'transparent') return {...transparent};
  if (color === 'white') return {...white};
  if (color === 'black' || color === 'canvastext') return {r:0,g:0,b:0,a:1};
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(color);
  if (hex) {
    let digits = hex[1];
    if (digits.length < 5) digits = [...digits].map(digit => digit + digit).join('');
    return {r:parseInt(digits.slice(0,2),16),g:parseInt(digits.slice(2,4),16),b:parseInt(digits.slice(4,6),16),a:digits.length === 8 ? parseInt(digits.slice(6,8),16)/255 : 1};
  }
  const rgb = /^rgba?\((.+)\)$/.exec(color);
  if (!rgb) return null;
  const values = rgb[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
  if (values.length < 3 || values.length > 4) return null;
  const channels = values.slice(0,3).map(value => clamp(parseFloat(value) * (value.endsWith('%') ? 2.55 : 1)));
  const alpha = values[3] ? clamp(parseFloat(values[3]) / (values[3].endsWith('%') ? 100 : 1), 1) : 1;
  if ([...channels,alpha].some(value => !Number.isFinite(value))) return null;
  return {r:channels[0],g:channels[1],b:channels[2],a:alpha};
}
export function composite(foreground: RGBA, background: RGBA): RGBA {
  const a = foreground.a + background.a * (1-foreground.a);
  if (!a) return {...transparent};
  const channel = (front: number, back: number) => (front*foreground.a+back*background.a*(1-foreground.a))/a;
  return {r:channel(foreground.r,background.r),g:channel(foreground.g,background.g),b:channel(foreground.b,background.b),a};
}
export function relativeLuminance(color: RGBA): number {
  const linear = (value: number) => {const c = value / 255; return c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4;};
  return .2126*linear(color.r)+.7152*linear(color.g)+.0722*linear(color.b);
}
export function contrastRatio(first: RGBA, second: RGBA): number {
  const a=relativeLuminance(first),b=relativeLuminance(second);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
function pixel(element: Element, foreground?: RGBA): RGBA {
  let result = foreground ?? {...transparent};
  for (let current: Element | null = element; current; current=current.parentElement) {
    const style=styleOf(current);
    result=composite(result,parseColor(style.backgroundColor) ?? transparent);
    result={...result,a:result.a*Number(style.opacity || 1)};
  }
  return composite(result,white);
}
export function resolveBackground(element: Element): RGBA {return pixel(element);}
export function effectiveOpacity(element: Element): number {
  let opacity=1;
  for (let current: Element|null=element;current;current=current.parentElement) opacity*=Number(styleOf(current).opacity || 1);
  return opacity;
}
export function getContrastRatio(element: Element): number | null {
  for (let current: Element|null=element;current;current=current.parentElement) {
    const style=styleOf(current);
    if (style.backgroundImage && style.backgroundImage !== 'none' || style.filter && style.filter !== 'none' || style.mixBlendMode && style.mixBlendMode !== 'normal') return null;
  }
  const color=parseColor(styleOf(element).color || 'black');
  return color ? contrastRatio(pixel(element,color),resolveBackground(element)) : null;
}
export function isLowVisibility(element: Element): boolean {
  const ratio=getContrastRatio(element);
  return parseFloat(styleOf(element).fontSize || '16') < 11 || effectiveOpacity(element) < .75 || ratio !== null && ratio < 4.5;
}
export function auditContrast(root: AuditRoot): AuditFinding[] {
  return elements(root).flatMap(element => {
    if (!isVisible(element) || !ownText(element)) return [];
    const style=styleOf(element),size=parseFloat(style.fontSize || '16'),weight=style.fontWeight;
    const threshold=size>=24 || size>=18.66 && (Number(weight)>=700 || weight==='bold') ? 3 : 4.5;
    const ratio=getContrastRatio(element);
    if (ratio===null || ratio>=threshold) return [];
    return [finding(element,'WCAG-1.4.3','accessibility','warning','Text is difficult to read',`Measured contrast is ${ratio.toFixed(2)}:1; this text needs at least ${threshold}:1.`, 'Safe Mode adds readable, high-contrast styling.',true,`${ownText(element)} (${ratio.toFixed(2)}:1)`)];
  });
}
