import { IncidentGroup } from "../../hooks";
import React from "react";
import { AboutField } from '@backstage/plugin-catalog';
import Stack from "@mui/material/Stack";

export const IncidentGroupEmail = ({
  escalationGroup,
}: {
  escalationGroup: IncidentGroup;
}) => {
  return (
    <Stack spacing={2}>
      <AboutField label="GROUP OWNER" value={escalationGroup.details.managerName} />
      <AboutField 
        label="GROUP EMAIL" 
        value={escalationGroup.details.email}
        gridSizes={{ xs: 12, sm: 12, md: 12 }} 
      />
    </Stack>
  );
};