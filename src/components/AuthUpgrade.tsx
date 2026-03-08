/**
 * @fileoverview Authentication and account linking component.
 *
 * Allows anonymous users to create an account with email/password to
 * persist their progress, or sign in to an existing account.
 * Also handles sign-out for linked accounts.
 *
 * @module AuthUpgrade
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function AuthUpgrade() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const { t } = useTranslation();
  const me = useQuery(api.players.getMe);
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<'signUp' | 'signIn'>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) return null;

  const isLinked = !!me?.email;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (flow === 'signUp' && password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn('password', { email, password, flow });
      window.location.reload();
    } catch {
      setError(
        flow === 'signUp'
          ? t('auth.signUpError')
          : t('auth.signInError')
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }

  return (
    <>
      <button
        className={`auth-upgrade-btn ${isLinked ? 'linked' : ''}`}
        onClick={() => setOpen(true)}
        title={isLinked ? t('auth.accountTooltip', { email: me.email }) : t('auth.linkTooltip')}
      >
        {isLinked ? '👤' : '💾'}
      </button>

      {open && (
        <div className="auth-modal-overlay" onClick={handleClose}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={handleClose}>✕</button>

            {isLinked ? (
              <>
                <h2>{t('auth.linkedAccount')}</h2>
                <p className="auth-modal-desc">
                  {t('auth.autoSave', { email: me.email })}
                </p>
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      await signIn('anonymous');
                      window.location.reload();
                    } catch (err) {
                      console.error('Error during sign-out flow', err);
                      setError(t('auth.signOutError'));
                    }
                  }}
                  className="auth-btn secondary"
                >
                  {t('auth.signOut')}
                </button>
              </>
            ) : (
              <>
                <h2>{flow === 'signUp' ? t('auth.saveProgress') : t('auth.signIn')}</h2>
                <p className="auth-modal-desc">
                  {flow === 'signUp'
                    ? t('auth.signUpDesc')
                    : t('auth.signInDesc')}
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                  <input
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="auth-input"
                  />
                  <input
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="auth-input"
                  />
                  {flow === 'signUp' && (
                    <input
                      type="password"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="auth-input"
                    />
                  )}
                  <button type="submit" disabled={loading} className="auth-btn primary">
                    {loading
                      ? (flow === 'signUp' ? t('auth.creatingAccount') : t('auth.signingIn'))
                      : (flow === 'signUp' ? t('auth.createAccount') : t('auth.signIn'))}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => { setFlow(flow === 'signUp' ? 'signIn' : 'signUp'); setError(''); setConfirmPassword(''); }}
                  className="auth-btn secondary"
                  style={{ marginTop: 8 }}
                >
                  {flow === 'signUp' ? t('auth.haveAccount') : t('auth.noAccount')}
                </button>

                {error && <p className="auth-error">{error}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
