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
    <div className="shell-narrow py-12 sm:py-16">
      <PageHeader
        eyebrow="Something new"
        title="Tell people what you need"
        description="Three short sections. It goes up the moment you publish — there is no review queue and nothing to wait for."
      />

      <div className="mt-12">
        <OpportunityForm
          submitLabel="Publish it"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/dashboard')}
        />
      </div>
    </div>
  );
}
