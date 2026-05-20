import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Lock, Delete } from 'lucide-react';
import { canUseWebAuthn, verifyPin, verifyWebAuthnCredential } from '../shared/lib';
import type { AppLockSettings } from '../domain';

interface LockScreenProps {
  appLock: AppLockSettings;
  onUnlock: () => void;
}

const PIN_LENGTH = 4;

const LockScreen: React.FC<LockScreenProps> = ({ appLock, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const canUseBiometric = !!appLock.webAuthnCredentialId && canUseWebAuthn();

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    let cancelled = false;
    setVerifying(true);
    const run = async () => {
      try {
        if (!appLock.pinHash || !appLock.pinSalt) {
          onUnlock();
          return;
        }
        const ok = await verifyPin(pin, appLock.pinSalt, appLock.pinHash);
        if (cancelled) return;
        if (ok) {
          onUnlock();
        } else {
          setShake(true);
          setAttempts(a => a + 1);
          setTimeout(() => {
            if (!cancelled) {
              setPin('');
              setShake(false);
            }
          }, 350);
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [pin, appLock.pinHash, appLock.pinSalt, onUnlock]);

  const press = (digit: string) => {
    if (verifying || pin.length >= PIN_LENGTH) return;
    setPin(p => p + digit);
  };

  const backspace = () => {
    if (verifying) return;
    setPin(p => p.slice(0, -1));
  };

  const unlockWithBiometric = async () => {
    if (!appLock.webAuthnCredentialId || biometricBusy) return;
    setBiometricBusy(true);
    try {
      const ok = await verifyWebAuthnCredential(appLock.webAuthnCredentialId);
      if (ok) onUnlock();
    } finally {
      setBiometricBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-brand-bg dark:bg-slate-950 px-6 safe-area-top safe-area-bottom">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="rounded-full bg-brand-accent/10 p-4">
          <Lock size={32} className="text-brand-accent" />
        </div>
        <h1 className="text-xl font-black text-brand-text dark:text-slate-100">输入 PIN</h1>
        <p className="text-xs text-brand-muted dark:text-slate-400">
          {attempts === 0 ? (canUseBiometric ? '使用生物识别或 4 位 PIN 解锁' : '请输入 4 位 PIN 解锁') : `已输错 ${attempts} 次,继续重试`}
        </p>
      </div>

      {canUseBiometric && (
        <button
          type="button"
          onClick={unlockWithBiometric}
          disabled={biometricBusy}
          className="mb-8 flex items-center gap-2 rounded-2xl bg-brand-accent px-5 py-3 text-sm font-black text-white shadow-soft active:scale-95 transition-all disabled:opacity-50"
        >
          <Fingerprint size={18} />
          {biometricBusy ? '验证中...' : '生物识别解锁'}
        </button>
      )}

      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-10 flex gap-3"
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

      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            disabled={verifying}
            className="aspect-square rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-2xl font-black text-brand-text dark:text-slate-100 active:scale-95 transition-all shadow-soft disabled:opacity-50"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => press('0')}
          disabled={verifying}
          className="aspect-square rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-2xl font-black text-brand-text dark:text-slate-100 active:scale-95 transition-all shadow-soft disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={backspace}
          disabled={verifying || pin.length === 0}
          className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-95 transition-all disabled:opacity-30"
          aria-label="删除"
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
};

export default LockScreen;
