import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api, opportunityImageUrl } from '../api/client.js';
import OpportunityForm, { gigToForm, toDateInput } from '../components/OpportunityForm.jsx';
import { Alert, Icon, Loading, PageHeader } from '../components/ui.jsx';

export default function EditOpportunity() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [initialImageUrl, setInitialImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getOpportunity(id)
      .then(({ opportunity: o }) => {
        setInitialImageUrl(o.hasImage ? opportunityImageUrl(o._id) : '');
        setInitialValues({
          title: o.title,
          description: o.description,
          category: o.category,
          location: o.location,
          venue: o.venue || '',
          date: toDateInput(o.date),
          startTime: o.startTime || '',
          endTime: o.endTime || '',
          requiredVolunteers: o.requiredVolunteers,
          ...gigToForm(o.gig),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (payload, photo) => {
    await api.updateOpportunity(id, payload);

    // The photograph lives behind its own endpoint, so it is saved separately.
    if (photo?.dataUrl) await api.putOpportunityImage(id, photo.dataUrl);
    else if (photo?.remove) await api.deleteOpportunityImage(id);

    navigate('/dashboard', { replace: true });
  };

  if (loading) return <Loading label="Fetching the listing…" />;

  if (!initialValues) {
    return (
      <div className="shell-narrow space-y-6 py-24 text-center">
        <Alert type="error">{error || 'We couldn’t find that opportunity.'}</Alert>
        <Link to="/dashboard" className="btn-outline">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to your desk
        </Link>
      </div>
    );
  }

  return (
    <div className="shell-narrow py-12 sm:py-16">
      <PageHeader
        eyebrow="Editing"
        title={initialValues.title}
        description="Anything you change here is visible to volunteers as soon as you save."
      />

      <div className="mt-12">
        <OpportunityForm
          initialValues={initialValues}
          initialImageUrl={initialImageUrl}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dashboard')}
        />
      </div>
    </div>
  );
}
