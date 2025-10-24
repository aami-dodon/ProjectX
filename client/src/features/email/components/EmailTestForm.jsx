import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const EmailTestForm = ({ onSubmit, status }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (status.state === 'success') {
      setValue('');
    }
  }, [status.state]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Email Connectivity Test</h2>
        <p className="text-sm text-slate-400">
          Provide a recipient address to trigger a verification email through the configured SMTP service.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-200">
            Recipient Email
          </label>
          <input
            id="email"
            type="email"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="admin@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status.state === 'loading'}
        >
          {status.state === 'loading' ? 'Sending…' : 'Send Test Email'}
        </button>
      </form>
      {status.state === 'success' ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Test email successfully queued for delivery to {status.data?.deliveredTo}
        </div>
      ) : null}
      {status.state === 'error' ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          Failed to send test email: {status.error?.message ?? 'Unknown error'}
        </div>
      ) : null}
    </section>
  );
};

EmailTestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  status: PropTypes.shape({
    state: PropTypes.string.isRequired,
    data: PropTypes.object,
    error: PropTypes.shape({ message: PropTypes.string }),
  }).isRequired,
};

export default EmailTestForm;
