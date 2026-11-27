import { useEffect, useState } from 'react';
import { Wifi, Clock3, ArrowRight, Shield } from 'lucide-react';
import { useNativeCheckbox } from './useNativeCheckbox';

export function SubscriptionCheckout() {
  const shield = useNativeCheckbox();
  const care = useNativeCheckbox();
  const [seconds, setSeconds] = useState(299);
  const [message, setMessage] = useState('');
  useEffect(() => { const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, []);
  const monthly = (55 + (shield.checked ? 19.99 : 0) + (care.checked ? 9.99 : 0)).toFixed(2);
  return <div className="portal telecom">
    <header className="portal-brand"><span className="portal-mark"><Wifi size={26} /></span><div><strong>SwiftNet<span className="wordmark-light"> fiber</span></strong><span>WITH STREAMPLUS · SAMPLE PORTAL</span></div><span className="portal-secure">Checkout</span></header>
    <div className="urgency-banner" data-countdown><Clock3 size={16} /><span>Your offer is reserved for <b>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</b></span></div>
    <div className="portal-content"><div className="portal-eyebrow">YOUR CONNECTED HOME</div><h2>More speed. More possibilities.</h2><p className="portal-lede">Finish building your home internet and streaming plan.</p>
      <div className="plan-heading"><Wifi size={30} /><div><strong>Fiber 500 + StreamPlus</strong><p>500 Mbps · Unlimited data · Entertainment included</p></div></div>
      <section className="portal-section"><div className="section-label"><h3>Your monthly plan</h3><span>USD</span></div>
        <div className="charge-row" data-charge><span>Fiber 500 base plan</span><strong>$55.00/mo</strong></div>
        <label className="addon-row" data-charge><input type="checkbox" {...shield} /><span><strong>Whole-Home Device Shield</strong><span>Protection for your connected devices. Billed monthly.</span><b>$19.99/mo</b></span><Shield size={19} /></label>
        <label className="addon-row" data-charge><input type="checkbox" {...care} /><span><strong>Priority Router Care</strong><span>Monthly add-on for priority equipment support.</span><b>$9.99/mo</b></span></label>
        <p className="renewal-disclosure" data-charge style={{ fontSize: '9px', opacity: 0.65 }}>Promotional rate auto-renews at $89.99/mo after 12 months.</p>
        <div className="portal-total" data-receipt-total><span>Monthly total</span><strong data-testid="portal-monthly">${monthly}/mo</strong></div>
      </section>
      <button className="shaming" onClick={() => setMessage('Demo preference saved. Review the selected add-ons above.')}>No thanks, I prefer paying full price for repairs.</button>
      <button className="portal-pay" onClick={() => setMessage('Demo complete. No subscription was created.')}>Confirm my plan <ArrowRight size={17} /></button>
      <p className="portal-footer">Demonstration only · No subscription is created</p>{message && <p className="portal-message" role="status">{message}</p>}
    </div>
  </div>;
}
