'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { api } from '@/lib/api';
import { X, Trash2, Plus, FileText, User, ShoppingBag } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
  onSuccess: () => void;
}

export function InvoiceModal({ isOpen, onClose, invoice, onSuccess }: InvoiceModalProps) {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    poNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'DRAFT',
    currency: user?.currency || 'INR',
    clientName: '',
    clientEmail: '',
    clientBusinessName: '',
    clientGstin: '',
    clientAddress: '',
    notes: '',
    terms: '',
  });

  const [items, setItems] = useState<any[]>([{ name: '', description: '', quantity: 1, rate: 0, discount: 0, gstRate: 0, gstIncluded: false }]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (invoice) {
        setFormData({
          invoiceNumber: invoice.invoiceNumber || '',
          poNumber: invoice.poNumber || '',
          issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
          status: invoice.status || 'DRAFT',
          currency: invoice.currency || user?.currency || 'INR',
          clientName: invoice.clientName || '',
          clientEmail: invoice.clientEmail || '',
          clientBusinessName: invoice.clientBusinessName || '',
          clientGstin: invoice.clientGstin || '',
          clientAddress: invoice.clientAddress || '',
          notes: invoice.notes || '',
          terms: invoice.terms || '',
        });
        setItems(invoice.items?.length > 0 ? invoice.items.map((i: any) => ({
          name: i.name || i.description || '',
          description: i.description && i.name ? i.description : '',
          quantity: i.quantity || 1,
          rate: i.rate || i.price || 0,
          discount: i.discount || 0,
          gstRate: i.gstRate || 0,
          gstIncluded: i.gstIncluded || false,
        })) : [{ name: '', description: '', quantity: 1, rate: 0, discount: 0, gstRate: 0, gstIncluded: false }]);
      } else {
        setFormData({
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          poNumber: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          status: 'DRAFT',
          currency: user?.currency || 'INR',
          clientName: '',
          clientEmail: '',
          clientBusinessName: '',
          clientGstin: '',
          clientAddress: '',
          notes: '',
          terms: '',
        });
        setItems([{ name: '', description: '', quantity: 1, rate: 0, discount: 0, gstRate: 0, gstIncluded: false }]);
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, invoice, user?.currency]);

  if (!isOpen) return null;

  // Calculations
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  
  items.forEach(it => {
    let baseRate = Number(it.rate) || 0;
    const qty = Number(it.quantity) || 0;
    const disc = Number(it.discount) || 0;
    const gstRate = Number(it.gstRate) || 0;
    
    if (it.gstIncluded && gstRate > 0) {
      baseRate = baseRate / (1 + gstRate / 100);
    }
    
    const lineGross = baseRate * qty;
    const lineDisc = lineGross * (disc / 100);
    const lineNet = lineGross - lineDisc;
    const lineTax = lineNet * (gstRate / 100);
    
    subtotal += lineGross;
    totalDiscount += lineDisc;
    totalTax += lineTax;
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        items,
        subtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        total: grandTotal,
      };

      if (invoice) {
        await api.patch(`/invoices/${invoice.id}`, payload);
      } else {
        await api.post('/invoices', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => setItems([...items, { name: '', description: '', quantity: 1, rate: 0, discount: 0, gstRate: 0, gstIncluded: false }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: any) => {
    const newItems = [...items];
    newItems[i] = { ...newItems[i], [field]: val };
    setItems(newItems);
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
      <Icon size={18} color="var(--accent-primary)" /> {title}
    </h3>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end',
      backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)'
    }}>
      <div 
        style={{
          width: '100%', maxWidth: '650px', backgroundColor: '#fff', height: '100%',
          display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
          animation: 'drawer-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {invoice ? 'Edit Invoice' : 'New Invoice'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: 0, marginTop: '2px' }}>
              {formData.invoiceNumber}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <form id="inv-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Invoice Details */}
            <div>
              <SectionTitle icon={FileText} title="Invoice Details" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Invoice Number</label>
                  <input required type="text" className="input-field" value={formData.invoiceNumber} onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">PO Number (Optional)</label>
                  <input type="text" className="input-field" value={formData.poNumber} onChange={e => setFormData({ ...formData, poNumber: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Issue Date</label>
                  <input required type="date" className="input-field" value={formData.issueDate} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Due Date</label>
                  <input required type="date" className="input-field" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Currency</label>
                  <select className="input-field" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                    {['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Status</label>
                  <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div>
              <SectionTitle icon={User} title="Bill To (Client)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Client Name</label>
                  <input required type="text" className="input-field" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} placeholder="Person or Company name" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Email Address (Optional)</label>
                  <input type="email" className="input-field" value={formData.clientEmail} onChange={e => setFormData({ ...formData, clientEmail: e.target.value })} placeholder="client@example.com" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Business Name (Optional)</label>
                  <input type="text" className="input-field" value={formData.clientBusinessName} onChange={e => setFormData({ ...formData, clientBusinessName: e.target.value })} placeholder="Legal business name" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">GSTIN / Tax ID (Optional)</label>
                  <input type="text" className="input-field" value={formData.clientGstin} onChange={e => setFormData({ ...formData, clientGstin: e.target.value })} placeholder="Tax Identification Number" />
                </div>
                <div className="input-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label className="input-label">Address (Optional)</label>
                  <textarea className="input-field" rows={2} style={{ resize: 'vertical' }} value={formData.clientAddress} onChange={e => setFormData({ ...formData, clientAddress: e.target.value })} placeholder="Client billing address" />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <SectionTitle icon={ShoppingBag} title="Line Items" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {items.map((it, i) => (
                  <div key={i} style={{ backgroundColor: 'var(--bg-hover)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Item {i + 1}</h4>
                      <button type="button" className="btn btn-ghost" style={{ padding: '0.25rem', color: 'var(--danger)', height: 'auto' }} onClick={() => removeItem(i)} disabled={items.length === 1}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <input required type="text" className="input-field" style={{ margin: 0 }} placeholder="Item name" value={it.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                      <input type="text" className="input-field" style={{ margin: 0 }} placeholder="Description (optional)" value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', alignItems: 'end' }}>
                      <div>
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                        <input required type="number" className="input-field" style={{ margin: 0 }} value={it.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} min="0.01" step="0.01" />
                      </div>
                      <div>
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Rate</label>
                        <input required type="number" className="input-field" style={{ margin: 0 }} value={it.rate} onChange={e => updateItem(i, 'rate', Number(e.target.value))} min="0" step="0.01" />
                      </div>
                      <div>
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Disc %</label>
                        <input type="number" className="input-field" style={{ margin: 0 }} value={it.discount} onChange={e => updateItem(i, 'discount', Number(e.target.value))} min="0" max="100" step="0.1" />
                      </div>
                      <div>
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>GST %</label>
                        <select className="input-field" style={{ margin: 0 }} value={it.gstRate} onChange={e => updateItem(i, 'gstRate', Number(e.target.value))}>
                          {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', height: '42px', paddingLeft: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={it.gstIncluded} onChange={e => updateItem(i, 'gstIncluded', e.target.checked)} />
                          Tax Incl.
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-secondary" onClick={addItem} style={{ alignSelf: 'flex-start' }}>
                  <Plus size={15} /> Add Another Item
                </button>
              </div>
            </div>

            {/* Totals & Notes */}
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Notes (Optional)</label>
                  <textarea className="input-field" rows={2} style={{ resize: 'vertical', margin: 0 }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Thank you for your business!" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Terms & Conditions (Optional)</label>
                  <textarea className="input-field" rows={2} style={{ resize: 'vertical', margin: 0 }} value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} placeholder="Payment is due within 15 days..." />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '200px', backgroundColor: 'var(--bg-elevated)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Subtotal</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{grandTotal > 0 ? subtotal.toFixed(2) : '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Discount</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--danger)' }}>-{totalDiscount > 0 ? totalDiscount.toFixed(2) : '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tax / GST</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{totalTax > 0 ? totalTax.toFixed(2) : '0.00'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent-primary)' }}>{formData.currency} {grandTotal > 0 ? grandTotal.toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', backgroundColor: '#fff', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="inv-form" className="btn btn-primary" disabled={loading} style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
            {loading ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>

        <style>{`
          @keyframes drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
      </div>
    </div>
  );
}
