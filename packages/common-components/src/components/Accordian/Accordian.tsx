import * as React from 'react';
import { styled, useTheme, alpha } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

const StyledAccordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': { borderBottom: 0 },
  '&::before': { display: 'none' },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(() => ({
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': { marginLeft: 8 },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export interface AccordionItem {
  /**
   * Unique panel id.
   * If omitted, defaults to `panel${index}` (e.g. `panel0`, `panel1`, …).
   */
  id?: string;
  header: string;
  body: string;
}

interface Props {
  items: AccordionItem[];
  /** Only one panel open at once if true */
  exclusive?: boolean;
  /** Which panel(s) to open by default */
  defaultExpandedId?: string | string[];
}

export default function Accordion({
  items,
  exclusive = false,
  defaultExpandedId,
}: Props) {
  const theme = useTheme();
  type ExpandedState = string | string[] | false;

  const initialExpanded: ExpandedState = React.useMemo(() => {
    if (defaultExpandedId !== undefined) {
      // user supplied defaults
      if (exclusive) {
        if (typeof defaultExpandedId === 'string') return defaultExpandedId;
        if (Array.isArray(defaultExpandedId) && defaultExpandedId.length)
          return defaultExpandedId[0];
        return false;
      } 
        if (Array.isArray(defaultExpandedId)) return defaultExpandedId;
        if (typeof defaultExpandedId === 'string') return [defaultExpandedId];
        return [];
      
    }
    // no defaultExpandedId: start closed
    return exclusive ? false : [];
  }, [exclusive, defaultExpandedId]);

  const [expanded, setExpanded] = React.useState<ExpandedState>(initialExpanded);

  const handleChange =
    (panelId: string) =>
    (_: React.SyntheticEvent, isExpanded: boolean) => {
      if (exclusive) {
        setExpanded(isExpanded ? panelId : false);
      } else {
        setExpanded((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return isExpanded
            ? [...list, panelId]
            : list.filter((id) => id !== panelId);
        });
      }
    };

  return (
    <div>
      {items.map((item, idx) => {
        const panelId = item.id ?? `panel${idx}`;
        const isOpen = exclusive
          ? expanded === panelId
          : Array.isArray(expanded) && expanded.includes(panelId);
        const bg =
          idx % 2 === 0
            ? theme.palette.action.hover
            : alpha(theme.palette.action.hover, 0.6);

        return (
          <StyledAccordion
            key={panelId}
            expanded={isOpen}
            onChange={handleChange(panelId)}
          >
            <AccordionSummary sx={{ backgroundColor: bg }}>
              <Typography>{item.header}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{item.body}</Typography>
            </AccordionDetails>
          </StyledAccordion>
        );
      })}
    </div>
  );
}
