import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  InfoOutlined as InfoIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getLossReductionData, getLossReductionAggregate } from '../services/analyticsService';

// ── Human-readable labels for flag type keys ──────────────────────────────────
const FLAG_LABELS = {
  overhead_and_profit:                                   'Overhead & Profit',
  check_recoverable_depreciation:                        'Recoverable Depreciation',
  check_less_depreciation_recoverable_rcbap:             'RCBAP — Non-Recoverable Depreciation',
  check_non_recoverable_items:                           'Non-Recoverable Items',
  check_recoverable_depreciation_from_personal_property: 'Personal Property Depreciation',
  advance_payment:                                       'Advance Payment',
  check_proper_deductibles_present:                      'Deductible',
  check_sales_tax:                                       'Sales Tax',
  square_footage:                                        'Square Footage',
  waterline_electrical:                                  'Waterline / Electrical Outlets',
  waterline_door:                                        'Waterline / Door & Electronics',
  check_electrical_outlet_replacement_bathroom:          'Bathroom Electrical Outlets',
  check_upper_cabinet_replacement:                       'Upper Cabinets',
  check_appliance_replacement_kitchen_laundry_6:         'Appliances — Low Water (≤ 6")',
  check_appliance_replacement_kitchen_laundry_7:         'Appliances — Higher Water (≥ 7")',
  appliance_price_validation:                            'Appliance Pricing',
  ac_tonnage:                                            'AC Tonnage',
  validate_door_replacements_per_section:                'Door Count',
  validate_window_replacements_per_section:              'Window Count',
  check_special_limits_exceed:                           'Special Limits',
  price_list:                                            'Price List Date',
  check_window_replacement:                              'Window Replacement Justification',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(val) {
  if (val == null || isNaN(val)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatMonthLabel(ym) {
  // ym = 'YYYY-MM'
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long',
  });
}

// ── Source pill chips used inside the info modal ──────────────────────────────
function SrcPill({ type }) {
  const theme = useTheme();
  const configs = {
    both: { label: 'XML + PDF', bg: theme.palette.success.light, color: theme.palette.success.dark },
    xml:  { label: 'XML only', bg: theme.palette.primary.light, color: theme.palette.primary.dark },
    pdf:  { label: 'PDF partial', bg: theme.palette.warning.light, color: theme.palette.warning.dark },
  };
  const cfg = configs[type] || configs.both;
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: '10px',
        height: 20,
        borderRadius: '4px',
      }}
    />
  );
}

// ── Info Modal ────────────────────────────────────────────────────────────────
function LossReductionInfoModal({ open, onClose }) {
  const theme = useTheme();
  const catRowSx = {
    bgcolor: theme.palette.primary.light,
    '& td': {
      color: theme.palette.primary.dark,
      fontWeight: 700,
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      py: 0.75,
    },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Loss Reduction — Calculation Logic
          </Typography>
          <Typography variant="body2" color="text.secondary">
            How this number is computed and what it covers
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
        {/* Section 1 — How It Is Calculated */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          How It Is Calculated
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          For each processed claim, the AI model produces a <strong>guidance report</strong> stored
          in S3 and indexed in MongoDB. Each guidance report contains a list of validation checks —
          each flagged as <em>Match</em>, <em>No Match</em>, or <em>Raise</em>.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Loss reduction is computed from the <strong>No Match</strong> flags only. For each No
          Match flag, the system locates the corresponding dollar amount in the claim's estimate data
          (XML or PDF). The sum of those amounts is the loss reduction for that claim.
        </Typography>
        <Box
          sx={{
            bgcolor: theme.palette.primary.light,
            borderRadius: 1,
            px: 1.5,
            py: 1,
            mb: 2,
          }}
        >
          <Typography variant="caption" color="primary.dark">
            <strong>Formula:</strong> Σ (dollar amount per No Match flag) across all financially
            quantifiable flags in the claim
          </Typography>
        </Box>

        {/* Section 2 — Data Sources */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Data Sources
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <SrcPill type="both" />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              <strong>Generic Rough Draft XML</strong> — pulled from S3 bucket (~2 hrs after
              upload). Provides full line-item detail: individual cost amounts per room/section,
              overhead &amp; profit breakdown, depreciation schedules, and estimate totals. Enables
              item-level checks.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <SrcPill type="pdf" />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              <strong>Final Report PDF</strong> — used when XML is not yet available. Financial
              summary figures are extracted (total depreciation, O&amp;P, advance payments,
              deductible, sales tax). Item-level checks (waterline, door/window counts, etc.) return
              $0 under this path.
            </Typography>
          </Box>
        </Box>

        {/* Section 3 — Checks Table */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Checks Performed &amp; Dollar Mapping
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 600, width: '28%' }}>Check</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '44%' }}>What Is Verified</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '16%' }}>Amount Source</TableCell>
                <TableCell sx={{ fontWeight: 600, width: '12%' }}>Data Path</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Category 1 */}
              <TableRow sx={catRowSx}>
                <TableCell colSpan={4}>Category 1 — Depreciation</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Recoverable Depreciation</strong></TableCell>
                <TableCell>Does the policy qualify for RCV payout? If not, withheld depreciation represents an overpayment that should be excluded.</TableCell>
                <TableCell>Recoverable depreciation held amount from estimate totals</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>RCBAP — Non-Recoverable Depreciation</strong></TableCell>
                <TableCell>For RCBAP claims: verifies "less depreciation (non-recoverable)" is selected in the estimate. If missing, the recoverable depreciation amount was improperly applied.</TableCell>
                <TableCell>Recoverable depreciation held amount from estimate totals</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Non-Recoverable Items</strong></TableCell>
                <TableCell>Items such as carpet and certain appliances must be paid at ACV only, not RCV. If applied at RCV, non-recoverable depreciation is missing from the estimate.</TableCell>
                <TableCell>Non-recoverable depreciation amount from estimate totals</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Personal Property Depreciation</strong></TableCell>
                <TableCell>Personal property line items marked "recoverable" when they should be non-recoverable. Sum of depreciation on those items.</TableCell>
                <TableCell>Depreciation total on personal property line items marked as recoverable</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>

              {/* Category 2 */}
              <TableRow sx={catRowSx}>
                <TableCell colSpan={4}>Category 2 — Overhead &amp; Profit</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Overhead &amp; Profit</strong></TableCell>
                <TableCell>Does the policy type qualify for O&amp;P? Also checks whether Profit was applied before Tax — if the Profit step was skipped, the net claim is understated.</TableCell>
                <TableCell>Overhead amount plus Profit amount from estimate totals</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>

              {/* Category 3 */}
              <TableRow sx={catRowSx}>
                <TableCell colSpan={4}>Category 3 — Estimate Parameters: Water Line &amp; Line-Item Thresholds</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Waterline / Door &amp; Electronics</strong></TableCell>
                <TableCell>Water line under 38": door locks, TVs, and computers in the estimate are not justified at that flood level.</TableCell>
                <TableCell>Sum of door lock, TV, computer line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Waterline / Electrical Outlets</strong></TableCell>
                <TableCell>Water line under 16": electrical outlet replacement is not justified at that flood level.</TableCell>
                <TableCell>Sum of electrical outlet / receptacle line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Bathroom Electrical Outlets</strong></TableCell>
                <TableCell>Water line under 32": bathroom electrical outlet replacement is not justified at that flood level.</TableCell>
                <TableCell>Sum of bathroom outlet line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Upper Cabinets</strong></TableCell>
                <TableCell>Water line under 48": upper or wall cabinet replacement is not justified at that flood level.</TableCell>
                <TableCell>Sum of upper / wall cabinet line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Appliances — Low Water (≤ 6")</strong></TableCell>
                <TableCell>Water at or under 6": kitchen and laundry appliance replacement is not justified at that flood level.</TableCell>
                <TableCell>Sum of appliance line items (refrigerator, dishwasher, stove, washer, dryer, etc.)</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Appliances — Higher Water (≥ 7")</strong></TableCell>
                <TableCell>At 7"+ water level: validates whether the specific appliance types in the estimate are justified given the flood depth.</TableCell>
                <TableCell>Sum of appliance line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Appliance Pricing</strong></TableCell>
                <TableCell>Appliance price in the estimate exceeds market price by more than 15% — excess over the market price threshold is flagged.</TableCell>
                <TableCell>Sum of over-priced appliance line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>AC Tonnage</strong></TableCell>
                <TableCell>AC tonnage in the estimate description does not match the unit model number — flags potential incorrect unit size and pricing.</TableCell>
                <TableCell>Sum of flagged HVAC / AC unit line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Door Count</strong></TableCell>
                <TableCell>Door replacements per section exceed the number of door openings documented in the inspection report.</TableCell>
                <TableCell>Sum of over-counted door line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Window Count</strong></TableCell>
                <TableCell>Window replacements per section exceed the number of window openings documented in the inspection report.</TableCell>
                <TableCell>Sum of over-counted window line items</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Square Footage</strong></TableCell>
                <TableCell>Square footage in the estimate compared against the Valuation Report. If the estimate overstates the area, all line-item costs are proportionally inflated.</TableCell>
                <TableCell>(Estimate sqft − Valuation sqft) ÷ Estimate sqft × RCV total</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>

              {/* Category 4 */}
              <TableRow sx={catRowSx}>
                <TableCell colSpan={4}>Category 4 — Policy &amp; Proof of Loss Financials</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Special Limits</strong></TableCell>
                <TableCell>Special limits section (Contents / Personal Property) exceeds the $2,500 RCV policy cap. Aggregate amount above the cap is flagged.</TableCell>
                <TableCell>Aggregate special limits amount from estimate</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Advance Payment</strong></TableCell>
                <TableCell>Estimate total may exceed advances already paid for Coverage A or B — flags potential double-payment exposure.</TableCell>
                <TableCell>Net claim total from estimate summary</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Deductible</strong></TableCell>
                <TableCell>Correct flood deductible applied in the Proof of Loss? Missing or incorrect deductible means the claim was overpaid by that amount.</TableCell>
                <TableCell>Deductible amount from Proof of Loss / estimate</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Price List Date</strong></TableCell>
                <TableCell>Price list date in the estimate does not match the date of loss. Wrong price list means the entire estimate may be mispriced — full RCV is flagged as the upper-bound exposure.</TableCell>
                <TableCell>Full replacement cost value (RCV) from estimate totals</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Window Replacement Justification</strong></TableCell>
                <TableCell>Window replacement in the estimate requires supporting justification from adjuster notes, or is flagged for over-counting against documented openings.</TableCell>
                <TableCell>Sum of window line items flagged</TableCell>
                <TableCell><SrcPill type="xml" /></TableCell>
              </TableRow>

              {/* Category 5 */}
              <TableRow sx={catRowSx}>
                <TableCell colSpan={4}>Category 5 — Sales Tax</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Sales Tax</strong></TableCell>
                <TableCell>Sales tax applied in the estimate for a potentially tax-exempt property — full sales tax amount may be recoverable.</TableCell>
                <TableCell>Total sales tax amount from estimate</TableCell>
                <TableCell><SrcPill type="both" /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Section 4 — What Is Not Included */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          What Is Not Included
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Non-financial No Match flags — such as narrative date mismatches, carrier name
          inconsistencies, missing documents, or incorrect policy coverage fields — contribute to
          the <em>No Match flag count</em> but carry <strong>no dollar amount</strong> and are
          excluded from the loss reduction total.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Item-level checks (waterline thresholds, door/window counts, appliances, upper cabinets,
          square footage) return <strong>$0</strong> when the claim is on the PDF fallback path —
          line-item cost data is only available from the Generic Rough Draft XML.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>6 additional checks</strong> are live in the model and counted in No Match totals
          but currently return <strong>$0</strong> in the loss reduction figure, pending data
          alignment: window replacement justification (note-field cross-reference), skirting in
          mobile homes (zone lookup), dumpster charge without EDN number, Method 1 drying unit
          price (FEMA rate table), serial number extraction, and sales tax exemption status
          (per-jurisdiction lookup).
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, valueColor, action }) {
  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{ p: 2.5, flex: 1, minWidth: 0, borderRadius: 2 }}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="h5" fontWeight={600} color={valueColor || 'text.primary'}>
          {value}
        </Typography>
        {action}
      </Box>
    </Paper>
  );
}

// ── Main Analytics Page ───────────────────────────────────────────────────────
export default function Analytics() {
  const theme = useTheme();

  const [activeTab, setActiveTab]       = useState(0);
  const [view, setView]                 = useState('executive');
  const [claims, setClaims]             = useState([]);
  const [aggregate, setAggregate]       = useState({});
  const [filterMonth, setFilterMonth]   = useState('all');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [infoOpen, setInfoOpen]         = useState(false);

  useEffect(() => {
    Promise.all([getLossReductionData(), getLossReductionAggregate()])
      .then(([data, agg]) => {
        setClaims(
          data.map(r => ({
            report_id:     r.report_id    ?? '',
            claim_number:  r.claim_number ?? '',
            carrier:       r.carrier      ?? '',
            no_match:      r.no_match_count      ?? 0,
            match:         r.match_count         ?? 0,
            raise_:        r.raise_count         ?? 0,
            total_estimate: r.total_estimate_value ?? 0,
            loss_reduction: r.loss_reduction_value ?? 0,
            data_source:   r.data_source  ?? 'none',
            processed_at:  r.computed_at  ?? null,
            flagged_items: r.flagged_items ?? [],
          }))
        );
        setAggregate(agg);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load analytics data');
        setLoading(false);
      });
  }, []);

  // ── Computed values ──────────────────────────────────────────────────────────
  const availableMonths = useMemo(() => {
    const months = [...new Set(claims.map(c => c.processed_at?.slice(0, 7)).filter(Boolean))];
    return months.sort().reverse();
  }, [claims]);

  const filteredClaims = useMemo(() => {
    if (filterMonth === 'all') return claims;
    return claims.filter(c => c.processed_at?.startsWith(filterMonth));
  }, [claims, filterMonth]);

  const displayAggregate = useMemo(() => {
    if (filterMonth === 'all') return aggregate;
    return {
      total_claims_processed:     filteredClaims.length,
      total_estimate_value:       filteredClaims.reduce((s, c) => s + c.total_estimate, 0),
      total_loss_reduction_value: filteredClaims.reduce((s, c) => s + c.loss_reduction, 0),
      total_no_match_flags:       filteredClaims.reduce((s, c) => s + c.no_match, 0),
      total_match_flags:          filteredClaims.reduce((s, c) => s + c.match, 0),
    };
  }, [filterMonth, filteredClaims, aggregate]);

  // ── Loading / error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ── Views ────────────────────────────────────────────────────────────────────
  const renderExecutiveView = () => (
    <Box>
      {/* Page header + month filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>Loss Reduction</Typography>
          <Typography variant="body2" color="text.secondary">
            Financial exposure identified across processed claims
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={filterMonth}
            label="Period"
            onChange={e => setFilterMonth(e.target.value)}
          >
            <MenuItem value="all">All Time</MenuItem>
            {availableMonths.map(m => (
              <MenuItem key={m} value={m}>{formatMonthLabel(m)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* KPI cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <KpiCard
          label="Total Claims Processed"
          value={displayAggregate.total_claims_processed ?? 0}
        />
        <KpiCard
          label="Total Estimate Value"
          value={formatCurrency(displayAggregate.total_estimate_value)}
        />
        <KpiCard
          label="Total Loss Reduction"
          value={formatCurrency(displayAggregate.total_loss_reduction_value)}
          valueColor={theme.palette.success.main}
          action={
            <Tooltip title="How this is calculated">
              <IconButton
                size="small"
                onClick={() => setInfoOpen(true)}
                sx={{ color: 'text.secondary', ml: 0.5 }}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        />
      </Box>

      {/* Drill-down button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={() => setView('drill')}>
          View All Processed Reports
        </Button>
      </Box>
    </Box>
  );

  const renderDrillView = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setView('executive')}
          size="small"
        >
          Back
        </Button>
        <Typography variant="body2" color="text.secondary">
          {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
          Total loss reduction: <strong>{formatCurrency(displayAggregate.total_loss_reduction_value)}</strong>
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Carrier</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Claim #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Report ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">No Match</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Match</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Total Estimate</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Loss Reduction</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Processed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No claims found for this period
                </TableCell>
              </TableRow>
            ) : (
              filteredClaims.map(claim => (
                <TableRow
                  key={claim.report_id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedClaim(claim); setView('flagDrill'); }}
                >
                  <TableCell>{claim.carrier || '—'}</TableCell>
                  <TableCell>{claim.claim_number || '—'}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ color: 'primary.main', fontFamily: 'monospace', fontSize: '12px' }}
                    >
                      {claim.report_id}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="error.main" fontWeight={600}>
                      {claim.no_match}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{claim.match}</TableCell>
                  <TableCell align="right">{formatCurrency(claim.total_estimate)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      {formatCurrency(claim.loss_reduction)}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(claim.processed_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderFlagDrillView = () => {
    const c = selectedClaim;
    const items = c?.flagged_items ?? [];
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setView('drill')}
            size="small"
          >
            Back
          </Button>
        </Box>

        {/* Claim header */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Claim Number</Typography>
              <Typography variant="body1" fontWeight={600}>{c.claim_number || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Carrier</Typography>
              <Typography variant="body1" fontWeight={600}>{c.carrier || '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Processed</Typography>
              <Typography variant="body1" fontWeight={600}>{formatDate(c.processed_at)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Loss Reduction</Typography>
              <Typography variant="body1" fontWeight={600} color="success.main">
                {formatCurrency(c.loss_reduction)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {items.length === 0 ? (
          <Alert severity="info">
            No financial flag detail available for this claim. The claim may have been processed
            before detailed flagged items were captured, or all No Match flags are non-financial.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600, width: '28%' }}>Flag Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '16%' }} align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {FLAG_LABELS[item.type] || item.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {item.amount > 0 ? (
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          {formatCurrency(item.amount)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">
                          $0 <em style={{ fontSize: '11px' }}>(item-level — XML only)</em>
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  const renderOperationalTab = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        gap: 1.5,
        color: 'text.secondary',
      }}
    >
      <Typography variant="h6" color="text.secondary">Operational Metrics</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={420}>
        Claims Validated, Quality Score, Adjuster performance table, and charts will appear here
        once the supporting backend endpoints are ready.
      </Typography>
    </Box>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={600} mb={0.5}>Analytics</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Loss reduction metrics and operational performance
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Loss Reduction" />
        <Tab label="Operational" />
      </Tabs>

      {activeTab === 0 && (
        <>
          {view === 'executive'  && renderExecutiveView()}
          {view === 'drill'      && renderDrillView()}
          {view === 'flagDrill'  && renderFlagDrillView()}
        </>
      )}
      {activeTab === 1 && renderOperationalTab()}

      <LossReductionInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </Box>
  );
}
