import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import api from '../../../lib/api-client';
import { Card, CardDescription, CardTitle } from '../../../components/ui/card';
import Button from '../../../components/ui/button';

const MinioUploadForm = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Select an image before uploading.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/api/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setFile(null);
      event.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardTitle>
        <UploadCloud className="h-5 w-5 text-primary" />
        Upload Sample Image
      </CardTitle>
      <CardDescription>Send an image to MinIO and receive a presigned URL for verification.</CardDescription>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="minio-image"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 hover:border-primary"
          >
            <ImageIcon className="h-4 w-4" />
            {file ? file.name : 'Choose image'}
            <input id="minio-image" name="file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {result?.presignedUrl && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-slate-300">Presigned URL: <a href={result.presignedUrl} className="text-primary underline" target="_blank" rel="noreferrer">Open in new tab</a></p>
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
            <img src={result.presignedUrl} alt="Uploaded preview" className="h-48 w-full object-cover" />
          </div>
        </div>
      )}
    </Card>
  );
};

export default MinioUploadForm;
