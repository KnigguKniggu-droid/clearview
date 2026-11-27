import {beforeEach,describe,expect,it} from 'vitest';
import {auditDarkPatterns} from '../src/darkPatterns';
beforeEach(()=>{document.body.innerHTML='';});
describe('dark-pattern indicators',()=>{
  it('flags checked recurring options and never ordinary or unselected choices',()=>{
    document.body.innerHTML='<label><input type="checkbox" checked>Monthly membership</label><label><input type="checkbox">Device shield</label><label><input type="checkbox" checked>I accept terms</label><div><input type="checkbox" checked><span>Newsletter</span></div>';
    expect(auditDarkPatterns(document).filter(item=>item.ruleId==='DP-001')).toHaveLength(2);
  });
  it('finds ancestor context without borrowing unrelated labels',()=>{
    document.body.innerHTML='<div><label><input type="checkbox" checked>Accepted</label><label><input type="checkbox">Monthly insurance</label></div><div><section><input type="checkbox" checked></section><p>Recurring add-on</p></div>';
    expect(auditDarkPatterns(document).filter(item=>item.ruleId==='DP-001')).toHaveLength(1);
  });
  it('flags small, faint, or low-contrast financial terms',()=>{
    document.body.innerHTML='<p style="font-size:9px">Fee $149</p><p style="opacity:.65">$20/mo after trial</p><p style="color:#aaa">Cancellation fee</p><p style="font-size:9px">Ordinary fine print</p><p hidden>$99/mo</p>';
    expect(auditDarkPatterns(document).filter(item=>item.ruleId==='DP-002')).toHaveLength(3);
  });
  it('detects shaming and countdown claims without claiming intent was verified',()=>{
    document.body.innerHTML='<button>No thanks, I prefer paying full price for repairs.</button><div data-countdown>04:59</div><p>Offer ends today</p><button>No thanks</button>';
    const findings=auditDarkPatterns(document);
    expect(findings.filter(item=>item.ruleId==='DP-003')).toHaveLength(1);
    expect(findings.filter(item=>item.ruleId==='DP-004')).toHaveLength(2);
    expect(findings.find(item=>item.ruleId==='DP-004')!.plainLanguageExplanation).toContain('cannot verify');
  });
  it('ignores injected badges and opacity-zero ancestors',()=>{
    document.body.innerHTML='<span data-clearview-badge style="font-size:9px">$999/mo</span><div style="opacity:0"><p style="font-size:9px">$99/mo</p></div>';
    expect(auditDarkPatterns(document)).toHaveLength(0);
  });
});
