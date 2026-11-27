import { useState } from 'react';
import { Zap, Leaf, ArrowRight } from 'lucide-react';
import { useNativeCheckbox } from './useNativeCheckbox';

export function UtilityPlanPortal() {
  const offset = useNativeCheckbox();
  const [message, setMessage] = useState('');
  return <div className="portal utility">
    <header className="portal-brand"><span className="portal-mark"><Zap size={25} /></span><div><strong>LoneStar Grid</strong><span>RESIDENTIAL ENERGY · SAMPLE PORTAL</span></div><span className="portal-secure">Enrollment</span></header>
    <div className="portal-content"><div className="portal-eyebrow">POWER FOR YOUR EVERYDAY</div><h2>A fresh start for your home.</h2><p className="portal-lede">Review your energy plan and enroll your service address.</p>
      <div className="plan-heading"><Zap size={30} /><div><strong>Everyday Flex</strong><p>Residential electricity · Variable usage plan</p></div></div>
      <section className="portal-section"><div className="section-label"><h3>Service details</h3><span>NEW SERVICE</span></div><div className="field-grid"><div><span className="visual-label">ESIID meter number</span><input name="esiid-meter-number" placeholder="Meter number" autoComplete="off" tabIndex={5} /></div><div><span className="visual-label">Social security number</span><input name="social-security-number" placeholder="XXX-XX-XXXX" type="password" autoComplete="off" maxLength={11} /></div></div><p className="sample-input-note">Demo only. Do not enter a real SSN or meter number.</p></section>
      <section className="portal-section"><div className="section-label"><h3>Plan details</h3><span>USD</span></div><p>Electricity charges depend on your usage. Review the rate disclosure.</p>
        <p data-charge className="surge-clause" style={{ color: '#A1A1AA', backgroundColor: '#F9FAFB' }}>$0.28/kWh peak demand surcharge during peak hours. Variable rate applies.</p>
        <label className="addon-row" data-charge><input type="checkbox" {...offset} /><span><strong>Green Grid Carbon Offset</strong><span>Support renewable energy initiatives. Monthly recurring add-on.</span><b>$19.50/mo</b></span><Leaf size={19} /></label>
        <div className="portal-total" data-receipt-total><span>Monthly total for add-ons</span><strong data-testid="portal-monthly">${offset.checked ? '19.50' : '0.00'}/mo</strong></div><p className="usage-note">Electricity usage is billed separately.</p>
      </section>
      <button className="portal-pay" onClick={() => setMessage('Demo complete. No energy enrollment was submitted.')}>Review enrollment <ArrowRight size={17} /></button><p className="portal-footer">Demonstration only · No service is enrolled</p>{message && <p className="portal-message" role="status">{message}</p>}
    </div>
  </div>;
}
