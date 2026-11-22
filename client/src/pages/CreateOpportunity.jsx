import { useNavigate } from 'react-router-dom';

import { api } from '../api/client.js';
import OpportunityForm from '../components/OpportunityForm.jsx';
import { PageHeader } from '../components/ui.jsx';

export default function CreateOpportunity() {
  const navigate = useNavigate();

  // The photograph can only be attached once the opportunity has an id, so it
  // is a second request. If it fails the listing still exists — say so rather
  // than pretending nothing happened.
  const handleSubmit = async (payload, photo) => {
    const { opportunity } = await api.createOpportunity(payload);

    if (photo?.dataUrl) {
      try {
        await api.putOpportunityImage(opportunity._id, photo.dataUrl);
      } catch (err) {
        throw new Error(
          `Your opportunity was published, but the photograph didn’t save: ${err.message} ` +
            'You can add it again by editing the listing.'
        );
      }
    }

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
