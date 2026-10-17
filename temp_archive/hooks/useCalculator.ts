import { useState, useCallback } from 'react';
import { RecordFormData, CalculationResult } from '@/types';
import { calculateAll } from '@/lib/calculations';

const DEFAULTS: Partial<RecordFormData> = {
  activity_factor: '1.2',
  macro_prot_pct: '15',
  macro_cho_pct: '55',
  macro_fat_pct: '30',
};

export function useCalculator(initialAge = 0, initialSex: 'M' | 'F' = 'F') {
  const [form, setForm] = useState<Partial<RecordFormData>>(DEFAULTS);
  const [age, setAge] = useState(initialAge);
  const [sex, setSex] = useState<'M' | 'F'>(initialSex);
  const [calc, setCalc] = useState<CalculationResult | null>(null);

  const updateField = useCallback((key: keyof RecordFormData, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [key]: value };
      const a = age || 0;
      if (a > 0) setCalc(calculateAll(updated, a, sex));
      return updated;
    });
  }, [age, sex]);

  const updateAge = useCallback((a: number) => {
    setAge(a);
    if (a > 0) setCalc(calculateAll(form, a, sex));
  }, [form, sex]);

  const updateSex = useCallback((s: 'M' | 'F') => {
    setSex(s);
    if (age > 0) setCalc(calculateAll(form, age, s));
  }, [form, age]);

  const reset = useCallback(() => {
    setForm(DEFAULTS);
    setCalc(null);
  }, []);

  const macroSum = (
    parseInt(form.macro_prot_pct || '0') +
    parseInt(form.macro_cho_pct || '0') +
    parseInt(form.macro_fat_pct || '0')
  );

  return { form, age, sex, calc, macroSum, updateField, updateAge, updateSex, reset };
}
