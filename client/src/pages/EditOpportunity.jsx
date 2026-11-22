import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../api/client.js';
import OpportunityForm, { gigToForm, toDateInput } from '../components/OpportunityForm.jsx';
import { Alert, Icon, Loading, PageHeader } from '../components/ui.jsx';

export default function EditOpportunity() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getOpportunity(id)
      .then(({ opportunity: o }) =>
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
        })
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (payload) => {
    await api.updateOpportunity(id, payload);
    navigate('/dashboard', { replace: true });
  };

  if (loading) return <Loading label="Loading opportunity…" />;

  if (!initialValues) {
    return (
      <div className="shell-narrow space-y-4 py-20 text-center">
        <Alert type="error">{error || 'Opportunity not found.'}</Alert>
        <Link to="/dashboard" className="btn-outline">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="shell-narrow py-10 sm:py-12">
      <PageHeader
        eyebrow="Edit"
        title="Edit opportunity"
        description="Changes are visible to volunteers as soon as you save."
      />

      <OpportunityForm
        initialValues={initialValues}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/dashboard')}
      />
    </div>
  );
}
