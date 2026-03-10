import React from 'react';
import { OpenCloning } from '@opencloning/ui';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import { DatabaseProvider } from '@opencloning/ui/providers/DatabaseContext';
import { OpenCloningDBInterface } from '@opencloning/opencloningdb';

const config = {
  backendUrl: 'http://localhost:8000',
  showAppBar: false,
  enableAssembler: false,
  enablePlannotate: false,
};

function CloningPage() {
  return (
    <ConfigProvider config={config}>
      <DatabaseProvider value={OpenCloningDBInterface}>
        <OpenCloning />
      </DatabaseProvider>
    </ConfigProvider>
  );
}

export default CloningPage;
