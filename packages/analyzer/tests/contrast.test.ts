import {beforeEach,describe,expect,it} from 'vitest';
import {auditContrast,composite,contrastRatio,effectiveOpacity,getContrastRatio,isLowVisibility,parseColor,relativeLuminance,resolveBackground} from '../src/contrast';
const rgb=(value:string)=>parseColor(value)!;
beforeEach(()=>{document.body.innerHTML='';document.body.removeAttribute('style');});
describe('WCAG sRGB contrast',()=>{
  it('matches black/white and reference luminance values',()=>{
    expect(contrastRatio(rgb('#000'),rgb('#fff'))).toBe(21);
    expect(relativeLuminance(rgb('#ff0000'))).toBeCloseTo(.2126,8);
    expect(relativeLuminance(rgb('rgb(10,10,10)'))).toBeCloseTo(10/255/12.92,8);
    expect(contrastRatio(rgb('#777'),rgb('#fff'))).toBeCloseTo(4.478,3);
  });
  it('parses specified formats and rejects unsupported colors',()=>{
    expect(rgb('#abc')).toEqual({r:170,g:187,b:204,a:1});
    expect(rgb('#123456')).toEqual({r:18,g:52,b:86,a:1});
    expect(rgb('rgba(12, 24, 36, 0.5)')).toEqual({r:12,g:24,b:36,a:.5});
    expect(rgb('rgb(100% 0% 0% / 50%)').r).toBeCloseTo(255);
    expect(rgb('#0000').a).toBe(0);
    expect(rgb('#ffffff80').a).toBeCloseTo(128/255);
    expect(rgb('transparent').a).toBe(0);
    expect(rgb('white').r).toBe(255);
    expect(rgb('black').r).toBe(0);
    expect(parseColor('hsl(0, 0%, 0%)')).toBeNull();
    expect(parseColor('rgb(bad,2,3)')).toBeNull();
    expect(parseColor('rgb(1,2)')).toBeNull();
  });
  it('composites multiple transparent ancestor backgrounds',()=>{
    document.body.innerHTML='<div style="background:#000"><div style="background:rgba(255,255,255,.5)"><p style="background:rgba(255,0,0,.5)">Text</p></div></div>';
    expect(resolveBackground(document.querySelector('p')!)).toEqual({r:191.25,g:63.75,b:63.75,a:1});
    expect(composite(rgb('transparent'),rgb('transparent')).a).toBe(0);
  });
  it('uses white root fallback and includes ancestor opacity',()=>{
    document.body.innerHTML='<div style="opacity:.5"><p style="color:black;opacity:.5">Text</p></div>';
    const p=document.querySelector('p')!;
    expect(effectiveOpacity(p)).toBe(.25);
    expect(resolveBackground(p).r).toBe(255);
    expect(getContrastRatio(p)).toBeLessThan(2);
    expect(isLowVisibility(p)).toBe(true);
  });
  it('applies normal and large-text thresholds without duplicate ancestor findings',()=>{
    document.body.innerHTML='<section><p style="color:#777;font-size:16px">normal</p><p style="color:#777;font-size:24px">large</p><p style="color:#777;font-size:19px;font-weight:bold">bold</p><p style="color:#999;font-size:24px">large failing</p><p hidden style="color:#eee">hidden</p></section>';
    expect(auditContrast(document).map(item=>item.evidenceText)).toEqual(['normal (4.48:1)','large failing (2.85:1)']);
  });
  it('does not pretend to measure image backgrounds and blend modes',()=>{
    document.body.innerHTML='<p style="background-image:linear-gradient(white,black)">Gradient</p><p style="filter:blur(1px)">Filter</p><p style="mix-blend-mode:multiply">Blend</p>';
    for(const p of document.querySelectorAll('p'))expect(getContrastRatio(p)).toBeNull();
    expect(auditContrast(document)).toHaveLength(0);
  });
});
