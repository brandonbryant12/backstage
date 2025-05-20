import * as React from 'react';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps as MuiAccordionComponentProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
  AccordionSummaryProps as MuiAccordionSummaryComponentProps,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

// --- API Interfaces ---
export interface AccordionItem {
  id: string | number;
  header: string;
  body: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  /**
    * If true, only one panel may stay open at a time.
    * Note: With the current simplified state management, the accordion will always behave exclusively.
    * This prop is kept for API consistency but does not alter the single-expansion behavior.
    */
  exclusive?: boolean; // Kept for API consistency, but behavior is always exclusive
  /** Specify the default expanded panel by id. */
  defaultExpandedId?: string | number | (string | number)[]; // Can still set initial panel
}

// --- Styled Components (from your provided code, renamed for clarity) ---
const StyledAppAccordion = styled((props: MuiAccordionComponentProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&::before': {
    display: 'none',
  },
}));

const StyledAppAccordionSummary = styled((props: MuiAccordionSummaryComponentProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, .05)'
      : 'rgba(0, 0, 0, .03)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)', // Make sure this overrides MUI default (may need !important if issues persist)
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const StyledAppAccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));


// --- Main Accordion Component implementing the API with simplified state ---
const Accordion: React.FC<AccordionProps> = ({ items, exclusive = false, defaultExpandedId }) => {
  // Simplified state: stores the ID of the currently expanded panel, or false if none.
  const [expandedPanelId, setExpandedPanelId] = React.useState<string | number | false>(() => {
    if (Array.isArray(defaultExpandedId) && defaultExpandedId.length > 0) {
      return defaultExpandedId[0]; // Take the first ID if an array is provided
    }
    if (!Array.isArray(defaultExpandedId) && defaultExpandedId !== undefined) {
      return defaultExpandedId; // Use the ID if it's a single value
    }
    return false; // No panel expanded by default
  });

  // Simplified handleChange for exclusive behavior
  const handleChange =
    (panelId: string | number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanelId(isExpanded ? panelId : false);
    };

  return (
    <div>
      {items.map(({ id, header, body }) => (
        <StyledAppAccordion
          key={id}
          expanded={expandedPanelId === id} // Check if this panel is the one stored in state
          onChange={handleChange(id)}       // Use the simplified handler
        >
          <StyledAppAccordionSummary
            aria-controls={`${id}-content`}
            id={`${id}-header`}
          >
            <Typography>{header}</Typography>
          </StyledAppAccordionSummary>
          <StyledAppAccordionDetails>
            <Typography>
              {body}
            </Typography>
          </StyledAppAccordionDetails>
        </StyledAppAccordion>
      ))}
    </div>
  );
};

export default Accordion;