import HealthStatus from '../components/HealthStatus.jsx';
import { useHealthStatus } from '../hooks/useHealthStatus.js';
import EmailTestForm from '../../email/components/EmailTestForm.jsx';
import { useEmailTest } from '../../email/hooks/useEmailTest.js';
import MinioUploadForm from '../../storage/components/MinioUploadForm.jsx';
import { useStorageUpload } from '../../storage/hooks/useStorageUpload.js';

const HealthDashboard = () => {
  const health = useHealthStatus();
  const email = useEmailTest();
  const storage = useStorageUpload();

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-widest text-slate-500">Project X</p>
          <h1 className="text-3xl font-semibold text-slate-100">Operational Readiness Dashboard</h1>
          <p className="max-w-3xl text-sm text-slate-400">
            Monitor platform health, verify email delivery, and confirm object storage connectivity. All checks run against the
            currently configured infrastructure endpoints.
          </p>
        </header>
        <HealthStatus data={health.data} loading={health.loading} error={health.error} onRefresh={health.refresh} />
        <div className="grid gap-6 md:grid-cols-2">
          <EmailTestForm onSubmit={email.sendTestEmail} status={email} />
          <MinioUploadForm onUpload={storage.upload} status={storage} />
        </div>
      </div>
    </div>
  );
};

export default HealthDashboard;
