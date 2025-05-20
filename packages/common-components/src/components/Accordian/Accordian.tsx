import * as React from 'react';
import { styled } from '@mui/material/styles';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

export interface AccordionItem {
  id: string | number;
  header: string;
  body: string;
}
export interface AccordionProps {
  items: AccordionItem[];
  /** If true → only one panel may stay open at a time */
  exclusive?: boolean;
}

/* ─────────────────────────  Row wrapper with zebra striping  ───────────────────────── */
const RowAccordion = styled(
  MuiAccordion,
  { shouldForwardProp: (prop) => prop !== 'rowindex' },
)<{ rowindex: number }>(({ theme, rowindex }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderBottom: 0,
  '&::before': { display: 'none' },
  backgroundColor:
    rowindex % 2
      ? theme.palette.action.hover        // odd rows
      : theme.palette.background.paper,   // even rows
}));

/* ───── Summary: chevron on left, rotates 90° down when expanded ───── */
const RowSummary = styled(MuiAccordionSummary)({
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper': {
    transform: 'rotate(0deg)',            // ▸ collapsed
    transition: 'transform .2s',
  },
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',           // ▾ expanded
  },
});

/* ───────────────  Details section (theme-aware padding & divider) ─────────────── */
const RowDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

/* ───────────────────────────────  Component  ─────────────────────────────── */
const Accordion: React.FC<AccordionProps> = ({ items, exclusive = false }) => {
  const [expanded, setExpanded] = React.useState<string | false>('');

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExp: boolean) =>
      setExpanded(isExp ? panel : false);

  return (
    <>
      {items.map(({ id, header, body }, idx) => (
        <RowAccordion
          key={id}
          rowindex={idx}
          disableGutters
          square
          elevation={0}
          expanded={exclusive ? expanded === id : undefined}
          onChange={exclusive ? handleChange(String(id)) : undefined}
        >
          <RowSummary expandIcon={<ChevronRightIcon sx={{ fontSize: '0.9rem' }} />}>
            <Typography fontWeight={600}>{header}</Typography>
          </RowSummary>

          <RowDetails>
            <Typography variant="body2" color="text.secondary">
              {body}
            </Typography>
          </RowDetails>
        </RowAccordion>
      ))}
    </>
  );
};

export default Accordion;
