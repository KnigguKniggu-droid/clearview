import { useState } from 'react';
import { Landmark, ArrowRight, Shield } from 'lucide-react';
import { useNativeCheckbox } from './useNativeCheckbox';

/** Fictional service checkout. It offers no tax advice or eligibility decision. */
export function SeniorTaxReliefPortal() {
  const support = useNativeCheckbox();
  const [message, setMessage] = useState('');
  return <div className="portal tax-relief">
    <header className="portal-brand"><span className="portal-mark"><Landmark size={25} /></span><div><strong>Senior Relief Services</strong><span>FICTIONAL SERVICE · SAMPLE PORTAL</span></div></header>
    <div className="portal-content"><div className="portal-eyebrow">DOCUMENT REVIEW SERVICE</div><h2>A little help with the paperwork.</h2><p className="portal-lede">Review this fictional service checkout. This sample does not determine tax benefits or eligibility.</p>
      <section className="portal-section"><div className="section-label"><h3>Your details</h3><span>SAMPLE ONLY</span></div><div className="field-grid"><div><span className="visual-label">Reference number</span><input placeholder="Sample reference" name="reference-number" autoComplete="off" tabIndex={4} /></div><div><span className="visual-label">ZIP code</span><input placeholder="00000" name="zip-code" autoComplete="off" maxLength={5} /></div></div><p className="sample-input-note">Use fictional information. No data is submitted.</p></section>
      <section className="portal-section"><div className="section-label"><h3>Review your service</h3><span>USD</span></div>
        <div className="charge-row" data-charge><span>Document review · One-time</span><strong>$39.00</strong></div>
        <p data-charge data-testid="tax-fee" style={{fontSize: '9px', color: '#9CA3AF'}}>Required processing fee: $49.00 due today.</p>
        <label className="addon-row" data-charge><input type="checkbox" {...support} /><span><strong>Priority Support Membership</strong><span>Optional recurring support subscription.</span><b>$14.99/mo</b></span><Shield size={19} /></label>
        <div className="portal-total" data-receipt-total><span>Due today</span><strong>$88.00</strong></div>
        <div className="portal-subtotal" data-receipt-total><span>Monthly support</span><strong data-testid="portal-monthly">{'$'}{support.checked ? '14.99' : '0.00'}/mo</strong></div>
      </section>
      <button className="shaming" onClick={() => setMessage('Demo preference noted. Review the selected membership above.')}>No thanks, I prefer paying full price for help.</button>
      <button className="portal-pay" onClick={() => setMessage('Demo complete. No application, payment, or tax filing was submitted.')}>Review sample request <ArrowRight size={17} /></button>
      <p className="portal-footer">Demonstration only · Not a government service</p>{message && <p className="portal-message" role="status">{message}</p>}
    </div>
  </div>;
}
