import { IncidentGroup } from "../../hooks";
import React from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";


export const IncidentGroupEmail = ({
  escalationGroup,
}: {
  escalationGroup: IncidentGroup;
}) => {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          GROUP OWNER
        </Typography>
        <Typography variant="body1">
          {escalationGroup.details.managerName}
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          GROUP EMAIL
        </Typography>
        <Typography variant="body1" color="primary">
          {escalationGroup.details.email}
        </Typography>
      </Box>
    </Stack>
  );
};