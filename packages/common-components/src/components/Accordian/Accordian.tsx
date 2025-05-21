
import * as React from 'react';
import { styled, useTheme, alpha } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
  AccordionSummaryProps,
  accordionSummaryClasses,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails, {
  accordionDetailsClasses,
} from '@mui/material/AccordionDetails';

export interface AccordionItem {
  id?: string;
  header: React.ReactNode;
  body: React.ReactNode;
}

interface Props {
  items: AccordionItem[];
  exclusive?: boolean;
  defaultExpandedId?: string | string[];
}

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
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
    transform: 'rotate(90deg)',
  },
  [`& .${accordionSummaryClasses.content}`]: { marginLeft: 8 },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  [`& .${accordionDetailsClasses.root}`]: {},
}));

export default function Accordion({
  items,
  exclusive = false,
  defaultExpandedId,
}: Props) {
  const theme = useTheme();
  type ExpandedState = string | string[] | false;

  const initialExpanded: ExpandedState = React.useMemo(() => {
    if (defaultExpandedId !== undefined) {
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
    return exclusive ? false : [];
  }, [exclusive, defaultExpandedId]);

  const [expanded, setExpanded] = React.useState<ExpandedState>(initialExpanded);

  const handleChange = (panelId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    if (exclusive) {
      setExpanded(isExpanded ? panelId : false);
    } else {
      setExpanded((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return isExpanded ? [...list, panelId] : list.filter((id) => id !== panelId);
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
            ? theme.palette.background.default
            : theme.palette.background.paper;

        return (
          <StyledAccordion
            key={panelId}
            expanded={isOpen}
            onChange={handleChange(panelId)}
          >
            <AccordionSummary sx={{ backgroundColor: bg }}>
              {item.header}
            </AccordionSummary>
            <AccordionDetails>
              {item.body}
            </AccordionDetails>
          </StyledAccordion>
        );
      })}
    </div>
  );
}
