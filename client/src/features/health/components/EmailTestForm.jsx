import React, { useState } from 'react';
import { Send } from 'lucide-react';
import api from '../../../lib/api-client';
import { Card, CardDescription, CardTitle } from '../../../components/ui/card';
import Input from '../../../components/ui/input';
import Button from '../../../components/ui/button';

const EmailTestForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const { data } = await api.post('/api/email/test', { to: email });
      setStatus({ type: 'success', message: `Email queued successfully (id: ${data.messageId})` });
      setEmail('');
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const statusTone = status?.type === 'success' ? 'text-emerald-600' : 'text-destructive';

  return (
    <Card>
      <CardTitle>
        <Send className="h-5 w-5 text-primary" />
        Send Test Email
      </CardTitle>
      <CardDescription>Trigger a connectivity test email using the configured SMTP credentials.</CardDescription>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-muted-foreground" htmlFor="email-recipient">
            Recipient Email
          </label>
          <Input
            id="email-recipient"
            type="email"
            autoComplete="email"
            value={email}
            required
            placeholder="ops@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send Test Email'}
          </Button>
          {status && <span className={`text-sm ${statusTone}`}>{status.message}</span>}
        </div>
      </form>
    </Card>
  );
};

export default EmailTestForm;
