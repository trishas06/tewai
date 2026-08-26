import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  MenuBook as MenuBookIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ruleBookService from "../services/ruleBookService";

const MODEL_LABELS = {
  flood: "Flood",
  prelim: "Prelim",
  property: "Property",
};

function RuleEntry({ entry, defaultExpanded }) {
  const ref = useRef(null);

  useEffect(() => {
    if (defaultExpanded && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Only scroll on first mount for the deep-linked entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Accordion ref={ref} defaultExpanded={defaultExpanded} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ fontWeight: 500 }}>{entry.question || entry.type}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ "& p": { mt: 0 } }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
        </Box>
        {entry.source && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Source: {entry.source}
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

function RuleBook() {
  const [rulebook, setRulebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("flood");
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const deepLinkType = searchParams.get("type");
  const deepLinkModel = searchParams.get("model");

  const loadRulebook = (forceRefresh = false) => {
    (forceRefresh ? setRefreshing : setLoading)(true);
    ruleBookService
      .getRulebook({ forceRefresh })
      .then((data) => {
        setRulebook(data);
        setError(null);
        // Jump to the deep-linked rule's model tab. `type` is reused across
        // models (e.g. "address" exists in both flood and prelim), so a
        // `model` param — set whenever the link came from a specific claim's
        // Report Analysis screen — takes priority; only fall back to
        // searching every tab for a matching type when it's absent (e.g. a
        // link shared without model context).
        if (deepLinkModel && data[deepLinkModel]) {
          setTab(deepLinkModel);
        } else if (deepLinkType) {
          const model = Object.keys(data).find((m) =>
            Object.values(data[m]).some((entries) =>
              entries.some((e) => e.type === deepLinkType),
            ),
          );
          if (model) setTab(model);
        }
      })
      .catch((err) => {
        console.error("Error fetching rule book:", err);
        setError("Could not load the rule book. Please try again later.");
      })
      .finally(() => (forceRefresh ? setRefreshing : setLoading)(false));
  };

  useEffect(() => {
    loadRulebook();
    // Only re-run if the deep-linked type/model changes; loadRulebook is stable enough for this effect's purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkType, deepLinkModel]);

  const filteredCategories = useMemo(() => {
    const categoriesForTab = rulebook?.[tab] || {};
    if (!search.trim()) return categoriesForTab;
    const term = search.trim().toLowerCase();
    const result = {};
    Object.entries(categoriesForTab).forEach(([category, entries]) => {
      const matches = entries.filter(
        (e) =>
          e.question?.toLowerCase().includes(term) ||
          e.type?.toLowerCase().includes(term) ||
          category.toLowerCase().includes(term) ||
          e.body?.toLowerCase().includes(term),
      );
      if (matches.length) result[category] = matches;
    });
    return result;
  }, [rulebook, tab, search]);

  const availableModels = rulebook ? Object.keys(MODEL_LABELS).filter((m) => rulebook[m]) : [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <MenuBookIcon color="primary" />
        <Typography variant="h5">Rule Book</Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton
              size="small"
              onClick={() => loadRulebook(true)}
              disabled={loading || refreshing}
              aria-label="Refresh rule book"
            >
              {refreshing ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <>
          {rulebook && Object.keys(rulebook).length === 0 && (
            <Alert severity="info">
              No rule book entries are published yet. Entries appear here once a category has
              been reviewed and approved.
            </Alert>
          )}

          {availableModels.length > 0 && (
            <Paper sx={{ mb: 2 }}>
              <Tabs
                value={availableModels.includes(tab) ? tab : availableModels[0]}
                onChange={(_, value) => setTab(value)}
              >
                {availableModels.map((model) => (
                  <Tab key={model} value={model} label={MODEL_LABELS[model] || model} />
                ))}
              </Tabs>
            </Paper>
          )}

          {availableModels.length > 0 && (
            <TextField
              fullWidth
              size="small"
              placeholder="Search rules by name, category, or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {Object.entries(filteredCategories).map(([category, entries]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {category}
              </Typography>
              {entries.map((entry) => (
                <RuleEntry
                  key={entry.type}
                  entry={entry}
                  defaultExpanded={entry.type === deepLinkType}
                />
              ))}
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

export default RuleBook;
