import * as React from 'react';
import MuiAccordion, { AccordionProps as MuiAccordionPropsM } from '@mui/material/Accordion'; // Aliased to avoid conflict
import MuiAccordionSummary, { AccordionSummaryProps as MuiAccordionSummaryPropsM } from '@mui/material/AccordionSummary'; // Aliased
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp'; // Changed Icon

export interface AccordionItem {
  id: string | number;
  header: string;
  body: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** If true → only one panel may stay open at a time. Defaults to false if not provided. */
  exclusive?: boolean;
  /** Specify default expanded panel(s) by id. */
  defaultExpandedId?: string | number | (string | number)[];
}

/**
 * Theme-aware accordion list with left-hand chevron ▸ / ▾ and striped rows.
 */
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
        const newExpandedSet = new Set(currentExpanded as Set<string | number>); // Type assertion
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
            square // Added for consistency with the styled example's appearance
            expanded={isCurrentlyExpanded}
            onChange={handleChange(id)} // Works for both exclusive and non-exclusive due to handler logic
            sx={(theme) => ({
              border: `1px solid ${theme.palette.divider}`, // From styled Accordion
              '&:not(:last-child)': { // From styled Accordion
                borderBottom: 0,
              },
              '&:before': { display: 'none' }, // remove default Mui divider line
              backgroundColor: // Striping logic
                index % 2
                  ? theme.palette.action.hover // Odd rows
                  : theme.palette.background.paper, // Even rows
            })}
          >
            <MuiAccordionSummary
              expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} data-testid={`chevron-${id}`} />}
              aria-controls={`${id}-content`}
              id={`${id}-header`}
              sx={(theme) => ({ // Combined styles from both examples
                flexDirection: 'row-reverse', // Icon on the left
                '& .MuiAccordionSummary-expandIconWrapper': {
                  transition: theme.transitions.create('transform', { // Smoother transition
                    duration: theme.transitions.duration.shortest,
                  }),
                  // No specific color for icon wrapper needed, inherits
                },
                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                  transform: 'rotate(90deg)', // ▸ → ▾
                },
                '& .MuiAccordionSummary-content': { // Spacing from styled AccordionSummary
                  marginLeft: theme.spacing(1),
                },
                // The Accordion's sx handles the summary background via striping.
                // If you wanted the summary to have its own distinct background from the accordion item itself,
                // you would set it here, but it would override the striping on MuiAccordion.
              })}
            >
              <Typography fontWeight={600}>{header}</Typography>
            </MuiAccordionSummary>

            <MuiAccordionDetails
              sx={(theme) => ({
                padding: theme.spacing(2), // From styled AccordionDetails
                borderTop: `1px solid ${theme.palette.divider}`, // From styled AccordionDetails, using theme.palette.divider
                // To ensure detail's background matches the even row color if desired, or a neutral paper
                backgroundColor: theme.palette.background.paper, // Explicitly set for consistency
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