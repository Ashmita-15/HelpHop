import { useNavigate } from 'react-router-dom';

import { api } from '../api/client.js';
import OpportunityForm from '../components/OpportunityForm.jsx';
import { PageHeader } from '../components/ui.jsx';

export default function CreateOpportunity() {
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    await api.createOpportunity(payload);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="shell-narrow py-10 sm:py-12">
      <PageHeader
        eyebrow="New opportunity"
        title="Post a volunteer opportunity"
        description="It goes live on the board as soon as you publish — no review queue."
      />

      <OpportunityForm
        submitLabel="Publish opportunity"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/dashboard')}
      />
    </div>
  );
}
