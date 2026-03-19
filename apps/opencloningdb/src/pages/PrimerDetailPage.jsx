import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Typography, CircularProgress, Alert } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import ResourceDetailHeader from '../components/ResourceDetailHeader';
import SequenceTable from '../components/SequenceTable';
import DetailPageSection from '../components/DetailPageSection';
import PageContainer from '../components/PageContainer';
import TopButtonSection from '../components/TopButtonSection';
import AddToCloningButton from '../components/AddToCloningButton';

function PrimerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['primer', id],
    queryFn: async () => {
      const { data: primer } = await openCloningDBHttpClient.get(endpoints.primer(id));
      const { data: linkedSequences } = await openCloningDBHttpClient.get(endpoints.primerTemplateSequences(id));
      const {templates, products} = linkedSequences;
      return { primer, templates, products };
    },
  });
  const { primer, templates, products } = data ?? {};

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load primer'}</Alert>;

  return (
    <PageContainer>
      <ResourceDetailHeader
        title={`${primer.uid} - ${primer.name}`}
        tags={primer.tags}
        onBack={() => navigate('/primers')}
        backTitle="Back to Primers" />
      <TopButtonSection>
        <AddToCloningButton selectedEntities={[primer]} entityType="primer">
          Add to Design Tab
        </AddToCloningButton>
      </TopButtonSection>
      <DetailPageSection title="Sequence">
        <Typography sx={{ mt: 1, fontFamily: 'monospace' }}>{primer.sequence}</Typography>
      </DetailPageSection>
      <DetailPageSection title="Linked templates">
        <SequenceTable sequences={templates} />
      </DetailPageSection>
      <DetailPageSection title="Linked products">
        <SequenceTable sequences={products} />
      </DetailPageSection>
    </PageContainer>
  );
}

export default PrimerDetailPage;
