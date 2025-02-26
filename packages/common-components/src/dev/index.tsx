
/*
<ai_context>
Development environment setup using @backstage/dev-utils to render examples of MissingAnnotationsCard.
Created to demonstrate all variations of the card as per user instructions.
</ai_context>
*/

import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Content, Header, Page } from '@backstage/core-components';
import { MissingAnnotationsCard } from '../components/MissingAnnotationsCard/MissingAnnotationsCard';

const demoPage = () => {
  return (
    <Page themeId="tool">
      <Header title="Missing Annotations Card Demo" />
      <Content>
        <Box sx={{ padding: 2 }}>
          <Typography variant="h6" gutterBottom>
            Single Annotation
          </Typography>
          <MissingAnnotationsCard
            title="Single Annotation Example"
            annotation="my/annotation"
          />

          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6" gutterBottom>
              Multiple Annotations
            </Typography>
            <MissingAnnotationsCard
              title="Multiple Annotations Example"
              annotation={['ann1', 'ann2']}
            />
          </Box>
        </Box>
      </Content>
    </Page>
  );
};

export default createDevApp()
.addPage({
  title: 'Missing Annotations',
  element: demoPage(),
})
  .render();
      