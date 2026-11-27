import {beforeEach,describe,expect,it} from 'vitest';
import {auditAria} from '../src/ariaAudit';
import {scanDocument} from '../src/index';
beforeEach(()=>{document.body.innerHTML='';});
describe('DOM accessibility rules',()=>{
  it('never includes password or textarea values in report evidence',()=>{
    document.body.innerHTML='<input type="password" value="private-password-8291"><input value="private-account-7428"><textarea>private-notes-5389 $120</textarea><div contenteditable="true"><span>private-editor-3124 $250</span></div>';
    const report=scanDocument(document);
    expect(report.findings.filter(item=>item.ruleId==='WCAG-3.3.2')).toHaveLength(3);
    expect(JSON.stringify(report)).not.toContain('private-');
    expect(report.financialCommitments).toHaveLength(0);
    expect(report.findings[0].evidenceText).toBe('input (password)');
  });
  it('flags each unlabeled control and accepts valid label mechanisms',()=>{
    document.body.innerHTML='<input placeholder="DOB"><select></select><textarea></textarea><input type="hidden"><input type="submit"><input type="button"><label for="a">Label A</label><input id="a"><label>Nested<input></label><input aria-label="Explicit"><span id="name">Reference</span><input aria-labelledby="name"><input aria-labelledby="missing"><label></label>';
    expect(auditAria(document).filter(item=>item.ruleId==='WCAG-3.3.2')).toHaveLength(4);
  });
  it('flags empty buttons, links and role buttons but accepts accessible titles',()=>{
    document.body.innerHTML='<button></button><a href="#"></a><div role="button"></div><button title="Close"></button><button aria-label="Save"></button><button>Continue</button>';
    expect(auditAria(document).filter(item=>item.ruleId==='WCAG-4.1.2')).toHaveLength(3);
  });
  it('checks custom clickability, natural focus, image alternatives, and visibility',()=>{
    document.body.innerHTML='<div data-clickable>Custom</div><span style="cursor:pointer" role="button">Partial</span><a onclick="void 0">Action</a><div data-clickable role="button" tabindex="0">Valid</div><button tabindex="5">Ahead</button><img src="photo.png"><img alt=""><img role="presentation"><img aria-hidden="true"><input hidden><input style="display:none"><div aria-hidden="true"><input></div><div inert><input></div>';
    const rules=auditAria(document).map(item=>item.ruleId);
    expect(rules.filter(rule=>rule==='WCAG-2.1.1')).toHaveLength(3);
    expect(rules.filter(rule=>rule==='WCAG-2.4.3')).toHaveLength(1);
    expect(rules.filter(rule=>rule==='WCAG-1.1.1')).toHaveLength(1);
    expect(rules.filter(rule=>rule==='WCAG-3.3.2')).toHaveLength(0);
  });
  it('includes root elements and uses stable bounded evidence IDs',()=>{
    document.body.innerHTML='<div data-clickable>'+ 'Text '.repeat(80)+'</div>';
    const root=document.querySelector('div')!;
    const first=auditAria(root)[0],second=auditAria(root)[0];
    expect(first.id).toBe(second.id);expect(first.evidenceText.length).toBe(120);
  });
});
