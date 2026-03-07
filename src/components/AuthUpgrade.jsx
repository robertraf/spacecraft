import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function AuthUpgrade() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.players.getMe);
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState('signUp'); // 'signUp' | 'signIn'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) return null;

  const isLinked = !!me?.email;

  async function handleSubmit(e) {
    e.preventDefault();
    if (flow === 'signUp' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn('password', { email, password, flow });
      // Reload to pick up the new auth session — Convex Auth doesn't
      // reactively refresh in-memory query subscriptions after signIn.
      window.location.reload();
    } catch {
      setError(
        flow === 'signUp'
          ? 'No se pudo crear la cuenta. Intenta con otro email.'
          : 'Email o contraseña incorrectos.'
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
        title={isLinked ? `Cuenta: ${me.email}` : 'Vincular cuenta para guardar progreso'}
      >
        {isLinked ? '👤' : '💾'}
      </button>

      {open && (
        <div className="auth-modal-overlay" onClick={handleClose}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={handleClose}>✕</button>

            {isLinked ? (
              <>
                <h2>Cuenta vinculada</h2>
                <p className="auth-modal-desc">
                  Tu progreso se guarda automáticamente en <strong>{me.email}</strong>
                </p>
                <button
                  onClick={async () => { await signOut(); await signIn('anonymous'); window.location.reload(); }}
                  className="auth-btn secondary"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <h2>{flow === 'signUp' ? 'Guardar progreso' : 'Iniciar sesión'}</h2>
                <p className="auth-modal-desc">
                  {flow === 'signUp'
                    ? 'Crea una cuenta para guardar tu progreso en todos tus dispositivos.'
                    : 'Inicia sesión para restaurar tu progreso guardado.'}
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="auth-input"
                  />
                  <input
                    type="password"
                    placeholder="Contraseña (mín. 8 caracteres)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="auth-input"
                  />
                  {flow === 'signUp' && (
                    <input
                      type="password"
                      placeholder="Confirmar contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="auth-input"
                    />
                  )}
                  <button type="submit" disabled={loading} className="auth-btn primary">
                    {loading
                      ? (flow === 'signUp' ? 'Creando cuenta...' : 'Entrando...')
                      : (flow === 'signUp' ? 'Crear cuenta' : 'Iniciar sesión')}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => { setFlow(flow === 'signUp' ? 'signIn' : 'signUp'); setError(''); setConfirmPassword(''); }}
                  className="auth-btn secondary"
                  style={{ marginTop: 8 }}
                >
                  {flow === 'signUp' ? '¿Ya tienes cuenta? Inicia sesión' : '¿Sin cuenta? Regístrate'}
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
