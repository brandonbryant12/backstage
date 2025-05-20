import * as React from 'react';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface AccordionItem {
  id: string | number;
  header: string; // ← strings, not ReactNode
  body: string;   // ← strings, not ReactNode
}

export interface AccordionProps {
  items: AccordionItem[];
  /** If true → only one panel may stay open at a time */
  exclusive?: boolean;
}

/**
 * Theme-aware accordion list with left-hand chevron ▸ / ▾ and striped rows.
 */
const Accordion: React.FC<AccordionProps> = ({ items, exclusive = false }) => {
  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExp: boolean) =>
      setExpanded(isExp ? panel : false);

  return (
    <>
      {items.map(({ id, header, body }, index) => (
        <MuiAccordion
          key={id}
          disableGutters
          elevation={0}
          expanded={exclusive ? expanded === id : undefined}
          onChange={exclusive ? handleChange(String(id)) : undefined}
          sx={(theme) => ({
            '&:before': { display: 'none' }, // remove default divider
            backgroundColor:
              index % 2
                ? theme.palette.action.hover        // odd rows
                : theme.palette.background.paper,   // even rows
          })}
        >
          <MuiAccordionSummary
            expandIcon={<ChevronRightIcon data-testid={`chevron-${id}`} />}
            sx={{
              flexDirection: 'row-reverse', // icon on the left
              '& .MuiAccordionSummary-expandIconWrapper': {
                transform: 'rotate(0deg)',
                transition: 'transform .2s',
              },
              // override default 180 ° rotation with 90 °
              '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                transform: 'rotate(90deg) !important', // ▸ → ▾
              },
            }}
          >
            <Typography fontWeight={600}>{header}</Typography>
          </MuiAccordionSummary>

          <MuiAccordionDetails sx={{ pt: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {body}
            </Typography>
          </MuiAccordionDetails>
        </MuiAccordion>
      ))}
    </>
  );
};

export default Accordion;