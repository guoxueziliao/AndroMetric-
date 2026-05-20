import React, { useEffect, useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from '../../shared/ui';
import { hashPin, randomSalt, verifyPin } from '../../shared/lib';

type Step = 'verify-old' | 'enter-new' | 'confirm-new' | 'done';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'enable' | 'change' | 'disable';
  currentPinHash?: string;
  currentPinSalt?: string;
  onComplete: (result: { pinHash: string; pinSalt: string } | null) => void;
}

const PIN_LENGTH = 4;

const PinSetupModal: React.FC<PinSetupModalProps> = ({ isOpen, onClose, mode, currentPinHash, currentPinSalt, onComplete }) => {
  const initialStep: Step = (mode === 'change' || mode === 'disable') && currentPinHash ? 'verify-old' : 'enter-new';
  const [step, setStep] = useState<Step>(initialStep);
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setPin('');
      setFirstPin('');
      setShake(false);
      setError(null);
    }
  }, [isOpen, initialStep]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    let cancelled = false;
    setBusy(true);
    const advance = async () => {
      try {
        if (step === 'verify-old') {
          if (!currentPinHash || !currentPinSalt) {
            setStep(mode === 'disable' ? 'done' : 'enter-new');
            setPin('');
            return;
          }
          const ok = await verifyPin(pin, currentPinSalt, currentPinHash);
          if (cancelled) return;
          if (ok) {
            if (mode === 'disable') {
              onComplete(null);
              onClose();
              return;
            }
            setStep('enter-new');
            setPin('');
            setError(null);
          } else {
            setShake(true);
            setError('PIN 不对,请重试');
            setTimeout(() => { if (!cancelled) { setPin(''); setShake(false); } }, 350);
          }
        } else if (step === 'enter-new') {
          setFirstPin(pin);
          setStep('confirm-new');
          setPin('');
          setError(null);
        } else if (step === 'confirm-new') {
          if (pin === firstPin) {
            const salt = randomSalt();
            const pinHash = await hashPin(pin, salt);
            if (cancelled) return;
            onComplete({ pinHash, pinSalt: salt });
            onClose();
          } else {
            setShake(true);
            setError('两次输入不一致,请重新设置');
            setTimeout(() => {
              if (!cancelled) { setPin(''); setFirstPin(''); setStep('enter-new'); setShake(false); }
            }, 400);
          }
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    void advance();
    return () => { cancelled = true; };
  }, [pin, step, currentPinHash, currentPinSalt, firstPin, mode, onComplete, onClose]);

  const press = (digit: string) => {
    if (busy || pin.length >= PIN_LENGTH) return;
    setPin(p => p + digit);
  };

  const backspace = () => {
    if (busy) return;
    setPin(p => p.slice(0, -1));
  };

  const title = mode === 'disable' ? '关闭应用锁' : mode === 'change' ? '修改 PIN' : '设置应用锁';
  const subtitle = step === 'verify-old'
    ? '请输入当前 PIN 以确认身份'
    : step === 'enter-new'
      ? '设置一个 4 位 PIN'
      : '再次输入以确认';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center py-2">
        <div className="mb-4 rounded-full bg-brand-accent/10 p-3">
          <Lock size={22} className="text-brand-accent" />
        </div>
        <p className="text-xs text-brand-muted dark:text-slate-400 mb-6">{subtitle}</p>

        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-3 flex gap-3"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <div
                key={i}
                className={`h-3 w-3 rounded-full transition-all ${filled ? 'bg-brand-accent scale-110' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            );
          })}
        </motion.div>
        <div className="h-4 text-[11px] font-bold text-red-500 mb-4">{error || ''}</div>

        <div className="grid grid-cols-3 gap-2 w-full max-w-[260px]">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              disabled={busy}
              className="aspect-square rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xl font-black text-brand-text dark:text-slate-100 active:scale-95 transition-all shadow-soft disabled:opacity-50"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => press('0')}
            disabled={busy}
            className="aspect-square rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xl font-black text-brand-text dark:text-slate-100 active:scale-95 transition-all shadow-soft disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            onClick={backspace}
            disabled={busy || pin.length === 0}
            className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-95 transition-all disabled:opacity-30"
            aria-label="删除"
          >
            <Delete size={18} />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PinSetupModal;
