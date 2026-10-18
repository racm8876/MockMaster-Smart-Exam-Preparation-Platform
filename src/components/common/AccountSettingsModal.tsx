import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;
    setName(user.name);
    setEmail(user.email);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const credentialsChanged = email.trim().toLowerCase() !== user.email || Boolean(newPassword);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const response = await fetch('/api/auth/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to save account settings.');
      await refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(data.message || 'Account settings saved.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save account settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const passwordField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    isVisible: boolean,
    toggleVisibility: () => void,
    required = false,
  ) => (
    <div>
      <label className="block text-xs font-bold text-[#17241f] mb-1">{label}</label>
      <div className="relative">
        <Lock className="w-4 h-4 text-[#52635a] absolute left-3 top-3" />
        <input
          type={isVisible ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]"
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute right-2 top-1.5 p-1.5 rounded-md text-[#52635a] hover:bg-[#f6f5ee] hover:text-[#173f35]"
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Account settings">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#eceae1] overflow-hidden">
        <div className="bg-[#173f35] px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg tracking-tight font-display">Account settings</h3>
            <p className="text-xs text-[#b8e6ce] mt-0.5">Update your sign-in email or password securely.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-[#dff4e9] hover:bg-[#235447]" aria-label="Close account settings">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {success && <div className="p-3 rounded-xl bg-[#dff4e9] border border-[#b8e6ce] text-xs text-[#173f35] flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}

          <div>
            <label className="block text-xs font-bold text-[#17241f] mb-1">Name</label>
            <div className="relative"><User className="w-4 h-4 text-[#52635a] absolute left-3 top-3" /><input type="text" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]" /></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#17241f] mb-1">Email address</label>
            <div className="relative"><Mail className="w-4 h-4 text-[#52635a] absolute left-3 top-3" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#cfcbbe] focus:outline-none focus:ring-2 focus:ring-[#173f35]" /></div>
          </div>

          <p className="text-[11px] text-[#52635a]">To change your email or password, confirm your current password below.</p>
          {passwordField('Current password', currentPassword, setCurrentPassword, showCurrentPassword, () => setShowCurrentPassword((shown) => !shown), credentialsChanged)}
          {passwordField('New password', newPassword, setNewPassword, showNewPassword, () => setShowNewPassword((shown) => !shown))}
          {passwordField('Confirm new password', confirmPassword, setConfirmPassword, showNewPassword, () => setShowNewPassword((shown) => !shown), Boolean(newPassword))}
          <p className="text-[11px] text-[#52635a]">New passwords need 10+ characters, including uppercase, lowercase, and a number.</p>

          <button type="submit" disabled={isSaving} className="w-full py-2.5 px-4 bg-[#173f35] hover:bg-[#235447] disabled:opacity-60 text-[#c9ed71] font-bold text-sm rounded-xl shadow-md transition-all">
            {isSaving ? 'Saving...' : 'Save account settings'}
          </button>
        </form>
      </div>
    </div>
  );
};
