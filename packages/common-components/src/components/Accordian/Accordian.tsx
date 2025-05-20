import * as React from 'react';
import MuiAccordion, { AccordionProps as MuiAccordionPropsM } from '@mui/material/Accordion';
import MuiAccordionSummary, { AccordionSummaryProps as MuiAccordionSummaryPropsM } from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';

export interface AccordionItem {
  id: string | number;
  header: string;
  body: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  exclusive?: boolean;
  defaultExpandedId?: string | number | (string | number)[];
}

const Accordion: React.FC<AccordionProps> = ({ items, exclusive = false, defaultExpandedId }) => {
  const [expanded, setExpanded] = React.useState<Set<string | number> | string | number | false>(() => {
    if (exclusive) {
      return Array.isArray(defaultExpandedId) && defaultExpandedId.length > 0
        ? defaultExpandedId[0]
        : (!Array.isArray(defaultExpandedId) && defaultExpandedId !== undefined ? defaultExpandedId : false);
    }
    let idsToExpand: (string | number)[] = [];
    if (Array.isArray(defaultExpandedId)) {
      idsToExpand = defaultExpandedId;
    } else if (defaultExpandedId !== undefined) {
      idsToExpand = [defaultExpandedId];
    }
    return new Set<string | number>(idsToExpand);
  });

  const handleChange = (panelId: string | number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    if (exclusive) {
      setExpanded(isExpanded ? panelId : false);
    } else {
      setExpanded(currentExpanded => {
        const newExpandedSet = new Set(currentExpanded as Set<string | number>);
        if (isExpanded) {
          newExpandedSet.add(panelId);
        } else {
          newExpandedSet.delete(panelId);
        }
        return newExpandedSet;
      });
    }
  };

  return (
    <>
      {items.map(({ id, header, body }, index) => {
        const isCurrentlyExpanded = exclusive
          ? expanded === id
          : (expanded instanceof Set && expanded.has(id));

        return (
          <MuiAccordion
            key={id}
            disableGutters
            elevation={0}
            square
            expanded={isCurrentlyExpanded}
            onChange={handleChange(id)}
            sx={(theme) => ({
              border: `1px solid ${theme.palette.divider}`,
              '&:not(:last-child)': {
                borderBottom: 0,
              },
              '&:before': { display: 'none' },
              backgroundColor:
                index % 2
                  ? theme.palette.action.hover
                  : theme.palette.background.paper,
            })}
          >
            <MuiAccordionSummary
              expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} data-testid={`chevron-${id}`} />}
              aria-controls={`${id}-content`}
              id={`${id}-header`}
              sx={(theme) => ({
                flexDirection: 'row-reverse',
                '& .MuiAccordionSummary-expandIconWrapper': {
                  transform: 'rotate(0deg)', // Explicitly set initial rotation
                  transition: theme.transitions.create('transform', {
                    duration: theme.transitions.duration.shortest,
                  }),
                },
                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                  transform: 'rotate(90deg) !important', // Ensure this overrides MUI's default 180deg rotation
                },
                '& .MuiAccordionSummary-content': {
                  marginLeft: theme.spacing(1),
                },
              })}
            >
              <Typography fontWeight={600}>{header}</Typography>
            </MuiAccordionSummary>

            <MuiAccordionDetails
              sx={(theme) => ({
                padding: theme.spacing(2),
                borderTop: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
              })}
            >
              <Typography variant="body2" color="text.secondary">
                {body}
              </Typography>
            </MuiAccordionDetails>
          </MuiAccordion>
        );
      })}
    </>
  );
};

export default Accordion;