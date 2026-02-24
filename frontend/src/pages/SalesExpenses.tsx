import { useState, useEffect } from 'react';
import { DollarSign, Save, Loader2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Shift, FinancialRecord } from '../backend';
import { useGetFinancialRecordsByRange, useUpdateFinancialRecord } from '../hooks/useQueries';
import { dateToBigIntNs, formatDateInput, parseDateInput, formatDateDisplay, formatCurrency } from '../lib/dateUtils';
import ShiftBadge from '../components/ShiftBadge';

interface ShiftFormState {
  cashSales: string;
  onlineSales: string;
  expenses: string;
}

const emptyForm = (): ShiftFormState => ({ cashSales: '', onlineSales: '', expenses: '' });

function recordToForm(record: FinancialRecord): ShiftFormState {
  return {
    cashSales: Number(record.cashSales).toString(),
    onlineSales: Number(record.onlineSales).toString(),
    expenses: Number(record.expenses).toString(),
  };
}

export default function SalesExpenses() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [morningForm, setMorningForm] = useState<ShiftFormState>(emptyForm());
  const [eveningForm, setEveningForm] = useState<ShiftFormState>(emptyForm());

  const dateNs = dateToBigIntNs(selectedDate);
  const { data: financials = [], isLoading } = useGetFinancialRecordsByRange(dateNs, dateNs);
  const updateRecord = useUpdateFinancialRecord();

  // Populate forms when data loads
  useEffect(() => {
    const morning = financials.find((r) => r.shift === Shift.morning);
    const evening = financials.find((r) => r.shift === Shift.evening);
    setMorningForm(morning ? recordToForm(morning) : emptyForm());
    setEveningForm(evening ? recordToForm(evening) : emptyForm());
  }, [financials, dateNs]);

  const parseVal = (v: string): bigint => {
    const n = parseFloat(v);
    return BigInt(isNaN(n) || n < 0 ? 0 : Math.round(n));
  };

  const handleSave = async (shift: Shift) => {
    const form = shift === Shift.morning ? morningForm : eveningForm;
    try {
      await updateRecord.mutateAsync({
        date: dateNs,
        shift,
        cashSales: parseVal(form.cashSales),
        onlineSales: parseVal(form.onlineSales),
        expenses: parseVal(form.expenses),
      });
      toast.success(`${shift === Shift.morning ? 'Morning' : 'Evening'} shift saved!`);
    } catch {
      toast.error('Failed to save record');
    }
  };

  const calcTotal = (form: ShiftFormState) => {
    const cash = parseFloat(form.cashSales) || 0;
    const online = parseFloat(form.onlineSales) || 0;
    return cash + online;
  };

  const morningTotal = calcTotal(morningForm);
  const eveningTotal = calcTotal(eveningForm);

  const morningRecord = financials.find((r) => r.shift === Shift.morning);
  const eveningRecord = financials.find((r) => r.shift === Shift.evening);

  const totalCashSales =
    (parseFloat(morningForm.cashSales) || 0) + (parseFloat(eveningForm.cashSales) || 0);
  const totalOnlineSales =
    (parseFloat(morningForm.onlineSales) || 0) + (parseFloat(eveningForm.onlineSales) || 0);
  const totalRevenue = totalCashSales + totalOnlineSales;
  const totalExpenses =
    (parseFloat(morningForm.expenses) || 0) + (parseFloat(eveningForm.expenses) || 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Sales & Expenses</h2>
          <p className="text-charcoal-muted font-medium mt-1">{formatDateDisplay(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-charcoal-muted" />
          <Input
            type="date"
            value={formatDateInput(selectedDate)}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(parseDateInput(e.target.value));
            }}
            className="bg-card-surface border-charcoal-light text-foreground focus:border-amber w-auto"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-amber" size={36} />
        </div>
      ) : (
        <>
          {/* Shift Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ShiftPanel
              shift={Shift.morning}
              form={morningForm}
              setForm={setMorningForm}
              total={morningTotal}
              hasExisting={!!morningRecord}
              onSave={() => handleSave(Shift.morning)}
              isSaving={updateRecord.isPending}
            />
            <ShiftPanel
              shift={Shift.evening}
              form={eveningForm}
              setForm={setEveningForm}
              total={eveningTotal}
              hasExisting={!!eveningRecord}
              onSave={() => handleSave(Shift.evening)}
              isSaving={updateRecord.isPending}
            />
          </div>

          {/* Daily Summary */}
          <Card className="bg-card-surface border-charcoal-light">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gold font-black text-lg">
                <TrendingUp size={20} />
                Daily Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <SummaryItem label="Cash Sales" value={formatCurrency(totalCashSales)} color="amber" />
                <SummaryItem label="Online Sales" value={formatCurrency(totalOnlineSales)} color="amber" />
                <SummaryItem label="Total Revenue" value={formatCurrency(totalRevenue)} color="gold" highlight />
                <SummaryItem label="Total Expenses" value={formatCurrency(totalExpenses)} color="red" />
              </div>
              <Separator className="bg-charcoal-light my-4" />
              <div className="flex items-center justify-between">
                <span className="font-black text-foreground text-lg">Net Profit</span>
                <div className="flex items-center gap-2">
                  {netProfit >= 0 ? (
                    <TrendingUp size={18} className="text-amber" />
                  ) : (
                    <TrendingDown size={18} className="text-red-accent" />
                  )}
                  <span className={`text-2xl font-black ${netProfit >= 0 ? 'text-amber' : 'text-red-accent'}`}>
                    {formatCurrency(netProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ShiftPanel({
  shift,
  form,
  setForm,
  total,
  hasExisting,
  onSave,
  isSaving,
}: {
  shift: Shift;
  form: ShiftFormState;
  setForm: (f: ShiftFormState) => void;
  total: number;
  hasExisting: boolean;
  onSave: () => void;
  isSaving: boolean;
}) {
  const isMorning = shift === Shift.morning;
  const accentBorder = isMorning ? 'border-t-amber' : 'border-t-red-accent';

  return (
    <Card className={`bg-card-surface border-charcoal-light border-t-4 ${accentBorder}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShiftBadge shift={shift} />
            {hasExisting && (
              <span className="text-xs text-charcoal-muted font-semibold bg-charcoal-light px-2 py-0.5 rounded-full">
                Saved
              </span>
            )}
          </div>
          <span className={`text-xl font-black ${isMorning ? 'text-amber' : 'text-red-accent'}`}>
            {formatCurrency(total)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-foreground flex items-center gap-1">
            <DollarSign size={13} className="text-amber" /> Cash Sales
          </Label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={form.cashSales}
            onChange={(e) => setForm({ ...form, cashSales: e.target.value })}
            className="bg-charcoal border-charcoal-light text-foreground placeholder:text-charcoal-muted focus:border-amber"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-foreground flex items-center gap-1">
            <TrendingUp size={13} className="text-amber" /> Online Sales
          </Label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={form.onlineSales}
            onChange={(e) => setForm({ ...form, onlineSales: e.target.value })}
            className="bg-charcoal border-charcoal-light text-foreground placeholder:text-charcoal-muted focus:border-amber"
          />
        </div>

        {/* Total Cash Display */}
        <div className={`rounded-lg p-3 ${isMorning ? 'bg-amber/10 border border-amber/30' : 'bg-red-accent/10 border border-red-accent/30'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total Cash</span>
            <span className={`text-lg font-black ${isMorning ? 'text-amber' : 'text-red-accent'}`}>
              {formatCurrency(total)}
            </span>
          </div>
          <p className="text-xs text-charcoal-muted mt-0.5">Cash + Online Sales</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-foreground flex items-center gap-1">
            <TrendingDown size={13} className="text-red-accent" /> Expenses
          </Label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={form.expenses}
            onChange={(e) => setForm({ ...form, expenses: e.target.value })}
            className="bg-charcoal border-charcoal-light text-foreground placeholder:text-charcoal-muted focus:border-amber"
          />
        </div>

        <Button
          onClick={onSave}
          disabled={isSaving}
          className={`w-full font-black gap-2 ${
            isMorning
              ? 'bg-amber text-charcoal-dark hover:bg-amber-light'
              : 'bg-red-accent text-white hover:bg-red-accent/80'
          }`}
        >
          {isSaving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={16} /> {hasExisting ? 'Update' : 'Save'} Record</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color: 'amber' | 'red' | 'gold';
  highlight?: boolean;
}) {
  const colorClass = { amber: 'text-amber', red: 'text-red-accent', gold: 'text-gold' }[color];
  return (
    <div className={`rounded-lg p-3 bg-charcoal ${highlight ? 'ring-1 ring-gold' : ''}`}>
      <p className="text-xs text-charcoal-muted font-semibold uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-black mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}
