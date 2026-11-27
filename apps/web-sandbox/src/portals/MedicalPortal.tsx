import { useState } from 'react';
import { HeartPulse, LockKeyhole, ArrowRight } from 'lucide-react';
import { useNativeCheckbox } from './useNativeCheckbox';

export function MedicalPortal() {
  const membership = useNativeCheckbox();
  const [message, setMessage] = useState('');
  return <div className="portal medical">
    <header className="portal-brand"><span className="portal-mark"><HeartPulse size={25} /></span><div><strong>St. Jude Regional</strong><span>MEDICAL · SAMPLE PORTAL</span></div><span className="portal-secure"><LockKeyhole size={13} /> Patient portal</span></header>
    <div className="portal-progress"><span>01 <b>Your visit</b></span><i /><span className="current">02 <b>Review & pay</b></span><i /><span>03 <b>Confirmation</b></span></div>
    <div className="portal-content">
      <div className="portal-eyebrow">EXPRESS INTAKE & BILLING</div><h2>One less thing to worry about.</h2><p className="portal-lede">Review your visit details and complete your intake below.</p>
      <div className="visit-note"><div className="date-tile"><span>YOUR</span><b>VISIT</b></div><div><strong>Outpatient consultation</strong><p>General care · Sample appointment</p></div><span className="confirmed">Confirmed</span></div>
      <section className="portal-section"><div className="section-label"><h3>Patient information</h3><span>STEP 2 OF 3</span></div>
        <div className="field-grid"><div><span className="visual-label">Patient date of birth</span><input type="text" placeholder="MM / DD / YYYY" name="patient-date-of-birth" autoComplete="off" /></div><div><span className="visual-label">Insurance member ID</span><input type="text" placeholder="Member ID" name="insurance-member-id" autoComplete="off" /></div></div>
        <p className="sample-input-note">Demo only. Use fictional information.</p>
      </section>
      <section className="portal-section"><div className="section-label"><h3>Your visit summary</h3><span>USD</span></div>
        <div className="charge-row" data-charge><span>Outpatient Visit Copay</span><strong>$185.00</strong></div>
        <div data-charge data-testid="facility-fee" style={{ fontSize: '9px', color: '#9CA3AF', backgroundColor: '#FFFFFF' }}>Administrative Facility Fee: $149.00</div>
        <label className="addon-row" data-charge><input type="checkbox" {...membership} /><span><strong>Priority Telehealth Membership</strong><span>Enroll in on-demand care. Billed monthly.</span><b>$29.99/mo</b></span><em>Recommended</em></label>
        <div className="portal-total" data-receipt-total><span>Due today</span><strong>$334.00</strong></div>
        <div className="portal-subtotal" data-receipt-total><span>Monthly total</span><strong data-testid="portal-monthly">${membership.checked ? '29.99' : '0.00'}/mo</strong></div>
      </section>
      <div className="portal-pay" data-clickable onClick={() => setMessage('Demo complete. No payment was submitted.')}>Submit Payment & Intake <ArrowRight size={17} /></div>
      <p className="portal-footer"><LockKeyhole size={12} /> Demonstration only · No payment is processed</p>
      {message && <p className="portal-message" role="status">{message}</p>}
    </div>
  </div>;
}
