import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const MinioUploadForm = ({ onUpload, status }) => {
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (status.state === 'success') {
      setFile(null);
    }
  }, [status.state]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (file) {
      onUpload(file);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">MinIO Upload Test</h2>
        <p className="text-sm text-slate-400">
          Upload an image to verify connectivity with the external MinIO bucket. The uploaded file will be available via a
          presigned URL.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="file" className="block text-sm font-medium text-slate-200">
            Choose Image
          </label>
          <input
            id="file"
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-slate-100 hover:file:bg-slate-700"
            required
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-blue-950 shadow hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status.state === 'loading'}
        >
          {status.state === 'loading' ? 'Uploading…' : 'Upload Image'}
        </button>
      </form>
      {status.state === 'success' ? (
        <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p>File uploaded successfully.</p>
          <p className="break-all text-xs text-emerald-200">URL: {status.data?.url}</p>
          {status.data?.url ? (
            <img
              src={status.data.url}
              alt="Uploaded object preview"
              className="max-h-64 w-full rounded-lg border border-slate-800 object-contain"
            />
          ) : null}
        </div>
      ) : null}
      {status.state === 'error' ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          Failed to upload image: {status.error?.message ?? 'Unknown error'}
        </div>
      ) : null}
    </section>
  );
};

MinioUploadForm.propTypes = {
  onUpload: PropTypes.func.isRequired,
  status: PropTypes.shape({
    state: PropTypes.string.isRequired,
    data: PropTypes.object,
    error: PropTypes.shape({ message: PropTypes.string }),
  }).isRequired,
};

export default MinioUploadForm;
