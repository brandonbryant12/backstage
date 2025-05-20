import * as React from "react";
import { styled } from "@mui/material/styles";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";

/**
 * AccordionItem – describes a single accordion section.
 * Both `header` and `body` are plain strings for consistency with design tokens.
 */
export interface AccordionItem {
  header: string;
  body: string;
  /** Optional unique id; falls back to array index */
  id?: string;
}

export interface CustomAccordionListProps {
  /** Items to display */
  items: AccordionItem[];
  /** Panel that starts expanded (id or index) */
  defaultExpanded?: string | number;
  /**
   * When `exclusive` is true (default) only one panel can be open; when false, multiple may stay expanded.
   */
  exclusive?: boolean;
}

// --------------------- Styled MUI primitives --------------------- //
const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  // Fixed background – no dark‑mode branching (project uses custom themes)
  backgroundColor: "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));
// ---------------------------------------------------------------- //

/**
 * CustomAccordionList – Accordion list accepting string headers/bodies and an `exclusive` toggle.
 */
export default function CustomAccordionList({
  items,
  defaultExpanded,
  exclusive = true,
}: CustomAccordionListProps) {
  // single vs. multi‑expand state shape
  const [expanded, setExpanded] = React.useState<
    string | number | false | Set<string | number>
  >(() => {
    if (exclusive) return defaultExpanded ?? false;
    return defaultExpanded !== undefined ? new Set([defaultExpanded]) : new Set();
  });

  const handleChange =
    (panel: string | number) => (_e: React.SyntheticEvent, newExpanded: boolean) => {
      if (exclusive) {
        setExpanded(newExpanded ? panel : false);
      } else {
        setExpanded((prev) => {
          const set = new Set(prev as Set<string | number>);
          newExpanded ? set.add(panel) : set.delete(panel);
          return set;
        });
      }
    };

  if (!items?.length) return null;

  return (
    <div>
      {items.map(({ header, body, id }, idx) => {
        const panelId = id ?? idx;
        const isExpanded = exclusive
          ? expanded === panelId
          : (expanded as Set<string | number>).has(panelId);

        return (
          <Accordion
            key={panelId}
            expanded={isExpanded}
            onChange={handleChange(panelId)}
            data-testid={`accordion-${panelId}`}
          >
            <AccordionSummary
              aria-controls={`panel-${panelId}-content`}
              id={`panel-${panelId}-header`}
            >
              <Typography>{header}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{body}</Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}
