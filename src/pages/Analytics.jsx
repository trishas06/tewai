import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, IconButton,
  CircularProgress, Alert, Tabs, Tab, Chip, Tooltip, Divider,
} from '@mui/material';
import {
  InfoOutlined as InfoIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getLossReductionData,
  getLossReductionAggregate,
  getOperationalStats,
} from '../services/analyticsService';

// ── Constants ─────────────────────────────────────────────────────────────────
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

const STATUS_COLORS = {
  Generated:                        '#5B9B98',
  validated:                        '#5B9B98',
  'Request for Additional Payment': '#f59e0b',
  'Unsearchable PDF':               '#ef5350',
  'Missing Preliminary Document':   '#ef5350',
  'Missing Loss Notice Document':   '#e53935',
  'Missing Narrative Document':     '#c62828',
  'Narrative Version Incorrect':    '#ff5722',
  'Processing Failed':              '#9e9e9e',
};
const STATUS_COLOR_DEFAULT = '#bdbdbd';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt$(val) {
  if (val == null || isNaN(val)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(val);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMonth(ym) {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function fmtTime(secs) {
  if (secs == null) return '—';
  const m = Math.floor(secs / 60), s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// trend: { good: bool, label: string } | null
function pctTrend(cur, prev, higherIsBad) {
  if (prev == null || prev === 0) return null;
  const pct = Math.round((cur - prev) / prev * 100);
  const good = higherIsBad ? pct < 0 : pct > 0;
  const sign = pct > 0 ? '↑' : '↓';
  return { good, label: `${sign} ${Math.abs(pct)}% vs prev month` };
}
function ppTrend(cur, prev, higherIsBad) {
  if (prev == null) return null;
  const diff = +(cur - prev).toFixed(1);
  const good = higherIsBad ? diff < 0 : diff > 0;
  return { good, label: `${diff > 0 ? '+' : ''}${diff}pp vs prev month` };
}

// ── SrcPill ───────────────────────────────────────────────────────────────────
// Colors match mockup exactly: both=blue, xml=green, pdf=orange
function SrcPill({ type }) {
  const configs = {
    both: { label: 'XML + PDF',   bg: '#e3f2fd', color: '#1565c0' },
    xml:  { label: 'XML only',    bg: '#e8f5e9', color: '#2e7d32' },
    pdf:  { label: 'PDF partial', bg: '#fff3e0', color: '#e65100' },
  };
  const cfg = configs[type] || configs.both;
  return (
    <Chip label={cfg.label} size="small"
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: '10px', height: 20, borderRadius: '4px' }} />
  );
}

// ── OpKpiCard — operational KPI card with trend ───────────────────────────────
function OpKpiCard({ label, value, sub, note, trend, info }) {
  return (
    <Paper elevation={1} sx={{ p: 2.5, borderRadius: 1, position: 'relative', minHeight: 118, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {label}
        </Typography>
        {info && (
          <Tooltip title={info} arrow>
            <Box component="span" sx={{
              width: 18, height: 18, borderRadius: '50%', bgcolor: 'action.hover',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'default', fontSize: 11, fontWeight: 700, color: 'text.secondary', flexShrink: 0,
              '&:hover': { bgcolor: 'primary.main', color: '#fff' },
            }}>i</Box>
          </Tooltip>
        )}
      </Box>
      <Typography sx={{ fontSize: 28, fontWeight: 700, color: 'text.primary', lineHeight: 1.1, mb: 0.5 }}>
        {value ?? '—'}
      </Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }}>{sub}</Typography>
      {note && <Typography sx={{ fontSize: 10, color: 'warning.main', fontStyle: 'italic', mt: 0.5 }}>{note}</Typography>}
      {trend && (
        <Typography sx={{ fontSize: 12, fontWeight: 600, mt: 'auto', pt: 1, color: trend.good ? 'success.main' : 'error.main' }}>
          {trend.label}
        </Typography>
      )}
    </Paper>
  );
}

// ── ExecKpi — large centered value card ──────────────────────────────────────
function ExecKpi({ label, value, sub, info }) {
  return (
    <Paper elevation={1} sx={{ p: 2.5, textAlign: 'center', position: 'relative', borderRadius: 1, flex: 1 }}>
      {info && (
        <Tooltip title={info} arrow>
          <Box component="span" sx={{
            position: 'absolute', top: 10, right: 10,
            width: 18, height: 18, borderRadius: '50%', bgcolor: 'action.hover',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'default', fontSize: 11, fontWeight: 700, color: 'text.secondary',
            '&:hover': { bgcolor: 'primary.main', color: '#fff' },
          }}>i</Box>
        </Tooltip>
      )}
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.75 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 36, fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
        {value ?? '—'}
      </Typography>
      {sub && <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{sub}</Typography>}
    </Paper>
  );
}

// ── Panel with coloured header ────────────────────────────────────────────────
function HeaderPanel({ headerBg, title, note, children }) {
  return (
    <Paper elevation={1} sx={{ mb: 1.5, overflow: 'hidden', borderRadius: 1 }}>
      <Box sx={{ bgcolor: headerBg, color: '#fff', px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
        {note && <Typography sx={{ fontSize: 12, opacity: 0.85 }}>{note}</Typography>}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

// ── Metric inside a panel ─────────────────────────────────────────────────────
function PanelMetric({ label, value, valueColor, sub, action, clickable, onClick }) {
  return (
    <Box sx={{ px: 2, py: 1, flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.75 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography sx={{
          fontSize: 28, fontWeight: 700, lineHeight: 1,
          color: valueColor || 'text.primary',
          cursor: clickable ? 'pointer' : 'default',
          textDecoration: clickable ? 'underline dotted' : 'none',
          '&:hover': clickable ? { opacity: 0.8 } : {},
        }} onClick={clickable ? onClick : undefined}>
          {value ?? '—'}
        </Typography>
        {action}
      </Box>
      {sub && <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5, lineHeight: 1.45 }}>{sub}</Typography>}
    </Box>
  );
}

// ── Loss Reduction Info Modal ─────────────────────────────────────────────────
function LossReductionInfoModal({ open, onClose }) {
  const theme = useTheme();
  // Category header rows: teal background, teal text, uppercase — matches .lr-cat-row in mockup
  const catRowSx = {
    '& td': {
      bgcolor: 'rgba(91,155,152,0.10)',
      color: 'rgb(70,135,132)',
      fontWeight: 700, fontSize: '10px', textTransform: 'uppercase',
      letterSpacing: '0.6px', py: 0.75, px: 1,
    },
  };
  // Section header — matches .lr-info-section h3 in mockup
  const SectionHead = ({ children }) => (
    <Typography sx={{
      fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
      color: 'primary.main', mb: 1.25, pb: 0.625,
      borderBottom: 1, borderColor: 'rgba(91,155,152,0.15)',
    }}>{children}</Typography>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1.75, borderBottom: 1, borderColor: 'divider' }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Loss Reduction — Calculation Logic</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>How this number is computed and what it covers</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 2.5 }}>

        {/* ── How It Is Calculated ── */}
        <Box sx={{ mb: 2.75 }}>
          <SectionHead>How It Is Calculated</SectionHead>
          <Typography sx={{ fontSize: 13, color: 'text.primary', mb: 1, lineHeight: 1.6 }}>
            For each processed claim, the AI model produces a <strong>guidance report</strong> stored in S3 and indexed in MongoDB. Each guidance report contains a list of validation checks — each flagged as <em>Match</em>, <em>No Match</em>, or <em>Raise</em>.
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.primary', mb: 1, lineHeight: 1.6 }}>
            Loss reduction is computed from the <strong>No Match</strong> flags only. For each No Match flag, the system locates the corresponding dollar amount in the claim's estimate data (XML or PDF). The sum of those amounts is the loss reduction for that claim.
          </Typography>
          <Box sx={{ bgcolor: 'rgba(91,155,152,0.08)', borderRadius: 1, px: 1.5, py: 1.25 }}>
            <Typography sx={{ fontSize: 12, color: 'rgb(70,135,132)' }}>
              <strong>Formula:</strong> Σ (dollar amount per No Match flag) across all financially quantifiable flags in the claim
            </Typography>
          </Box>
        </Box>

        {/* ── Data Sources ── */}
        <Box sx={{ mb: 2.75 }}>
          <SectionHead>Data Sources</SectionHead>
          <Typography sx={{ fontSize: 13, color: 'text.primary', mb: 1, lineHeight: 1.6 }}>
            <SrcPill type="xml" />&nbsp;&nbsp;<strong>Generic Rough Draft XML</strong> — pulled from S3 bucket (~2 hrs after upload). Provides full line-item detail: individual cost amounts per room/section, overhead &amp; profit breakdown, depreciation schedules, and estimate totals. Enables item-level checks.
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.primary', lineHeight: 1.6 }}>
            <SrcPill type="pdf" />&nbsp;&nbsp;<strong>Final Report PDF</strong> — used when XML is not yet available. Financial summary figures are extracted (total depreciation, O&amp;P, advance payments, deductible, sales tax). Item-level checks (waterline, door/window counts, etc.) return $0 under this path.
          </Typography>
        </Box>

        {/* ── Checks Performed ── */}
        <Box sx={{ mb: 2.75 }}>
          <SectionHead>Checks Performed &amp; Dollar Mapping</SectionHead>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', width: '28%' }}>Check</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', width: '44%' }}>What Is Verified</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', width: '16%' }}>Amount Source</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'text.secondary', width: '12%' }}>Data Path</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Category 1 */}
                <TableRow sx={catRowSx}><TableCell colSpan={4}>Category 1 — Depreciation</TableCell></TableRow>
                <TableRow><TableCell><strong>Recoverable Depreciation</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Does the policy qualify for RCV payout? If not, withheld depreciation represents an overpayment that should be excluded.</TableCell><TableCell sx={{ fontSize: 12 }}>Recoverable depreciation held amount from estimate totals</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>
                <TableRow><TableCell><strong>RCBAP — Non-Recoverable Depreciation</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>For RCBAP claims: verifies "less depreciation (non-recoverable)" is selected in the estimate. If missing, the recoverable depreciation amount was improperly applied.</TableCell><TableCell sx={{ fontSize: 12 }}>Recoverable depreciation held amount from estimate totals</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Non-Recoverable Items</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Items such as carpet and certain appliances must be paid at ACV only, not RCV. If applied at RCV, non-recoverable depreciation is missing from the estimate.</TableCell><TableCell sx={{ fontSize: 12 }}>Non-recoverable depreciation amount from estimate totals</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Personal Property Depreciation</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Personal property line items marked "recoverable" when they should be non-recoverable. Sum of depreciation on those items.</TableCell><TableCell sx={{ fontSize: 12 }}>Depreciation total on personal property line items marked as recoverable</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>

                {/* Category 2 */}
                <TableRow sx={catRowSx}><TableCell colSpan={4}>Category 2 — Overhead &amp; Profit</TableCell></TableRow>
                <TableRow><TableCell><strong>Overhead &amp; Profit</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Does the policy type qualify for O&amp;P? Also checks whether Profit was applied before Tax — if the Profit step was skipped, the net claim is understated.</TableCell><TableCell sx={{ fontSize: 12 }}>Overhead amount plus Profit amount from estimate totals</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>

                {/* Category 3 */}
                <TableRow sx={catRowSx}><TableCell colSpan={4}>Category 3 — Estimate Parameters: Water Line &amp; Line-Item Thresholds</TableCell></TableRow>
                <TableRow><TableCell><strong>Waterline / Door &amp; Electronics</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Water line under 38": door locks, TVs, and computers in the estimate are not justified at that flood level.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of door lock, TV, computer line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Waterline / Electrical Outlets</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Water line under 16": electrical outlet replacement is not justified at that flood level.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of electrical outlet / receptacle line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Bathroom Electrical Outlets</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Water line under 32": bathroom electrical outlet replacement is not justified at that flood level.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of bathroom outlet line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Upper Cabinets</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Water line under 48": upper or wall cabinet replacement is not justified at that flood level.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of upper / wall cabinet line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Appliances — Low Water (≤ 6")</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Water at or under 6": kitchen and laundry appliance replacement is not justified at that flood level.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of appliance line items (refrigerator, dishwasher, stove, washer, dryer, etc.)</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Appliances — Higher Water (≥ 7")</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>At 7"+ water level: validates whether the specific appliance types in the estimate are justified given the flood depth.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of appliance line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Appliance Pricing</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Appliance price in the estimate exceeds market price by more than 15% — excess over the market price threshold is flagged.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of over-priced appliance line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>AC Tonnage</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>AC tonnage in the estimate description does not match the unit model number — flags potential incorrect unit size and pricing.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of flagged HVAC / AC unit line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Door Count</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Door replacements per section exceed the number of door openings documented in the inspection report.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of over-counted door line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Window Count</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Window replacements per section exceed the number of window openings documented in the inspection report.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of over-counted window line items</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Square Footage</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Square footage in the estimate compared against the Valuation Report. If the estimate overstates the area, all line-item costs are proportionally inflated.</TableCell><TableCell sx={{ fontSize: 12 }}>(Estimate sqft − Valuation sqft) ÷ Estimate sqft × RCV total</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>

                {/* Category 4 */}
                <TableRow sx={catRowSx}><TableCell colSpan={4}>Category 4 — Policy &amp; Proof of Loss Financials</TableCell></TableRow>
                <TableRow><TableCell><strong>Special Limits</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Special limits section (Contents / Personal Property) exceeds the $2,500 RCV policy cap. Aggregate amount above the cap is flagged.</TableCell><TableCell sx={{ fontSize: 12 }}>Aggregate special limits amount from estimate</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Advance Payment</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Estimate total may exceed advances already paid for Coverage A or B — flags potential double-payment exposure.</TableCell><TableCell sx={{ fontSize: 12 }}>Net claim total from estimate summary</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Deductible</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Correct flood deductible applied in the Proof of Loss? Missing or incorrect deductible means the claim was overpaid by that amount.</TableCell><TableCell sx={{ fontSize: 12 }}>Deductible amount from Proof of Loss / estimate</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Price List Date</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Price list date in the estimate does not match the date of loss. Wrong price list means the entire estimate may be mispriced — full RCV is flagged as the upper-bound exposure.</TableCell><TableCell sx={{ fontSize: 12 }}>Full replacement cost value (RCV) from estimate totals</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>
                <TableRow><TableCell><strong>Window Replacement Justification</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Window replacement in the estimate requires supporting justification from adjuster notes, or is flagged for over-counting against documented openings.</TableCell><TableCell sx={{ fontSize: 12 }}>Sum of window line items flagged</TableCell><TableCell><SrcPill type="xml" /></TableCell></TableRow>

                {/* Category 5 */}
                <TableRow sx={catRowSx}><TableCell colSpan={4}>Category 5 — Sales Tax</TableCell></TableRow>
                <TableRow><TableCell><strong>Sales Tax</strong></TableCell><TableCell sx={{ fontSize: 12, lineHeight: 1.45 }}>Sales tax applied in the estimate for a potentially tax-exempt property — full sales tax amount may be recoverable.</TableCell><TableCell sx={{ fontSize: 12 }}>Total sales tax amount from estimate</TableCell><TableCell><SrcPill type="both" /></TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ── What Is Not Included ── */}
        <Box>
          <SectionHead>What Is Not Included</SectionHead>
          <Typography sx={{ fontSize: 13, color: 'text.primary', mb: 1, lineHeight: 1.6 }}>
            Non-financial No Match flags — such as narrative date mismatches, carrier name inconsistencies, missing documents, or incorrect policy coverage fields — contribute to the <em>No Match flag count</em> but carry <strong>no dollar amount</strong> and are excluded from the loss reduction total.
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.primary', mb: 1, lineHeight: 1.6 }}>
            Item-level checks (waterline thresholds, door/window counts, appliances, upper cabinets, square footage) return <strong>$0</strong> when the claim is on the PDF fallback path — line-item cost data is only available from the Generic Rough Draft XML.
          </Typography>
          <Typography sx={{ fontSize: 13, color: 'text.primary', lineHeight: 1.6 }}>
            <strong>6 additional checks</strong> are live in the model and counted in No Match totals but currently return <strong>$0</strong> in the loss reduction figure, pending data alignment: window replacement justification (note-field cross-reference), skirting in mobile homes (zone lookup), dumpster charge without EDN number, Method 1 drying unit price (FEMA rate table), serial number extraction, and sales tax exemption status (per-jurisdiction lookup).
          </Typography>
        </Box>

      </DialogContent>
    </Dialog>
  );
}

// ── Main Analytics page ───────────────────────────────────────────────────────
export default function Analytics() {
  const theme = useTheme();
  const teal  = 'rgb(91,155,152)';
  const green = '#2e7d32';

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState(0);   // 0=Operational, 1=Executive
  const [view,          setView]          = useState('executive');
  const [filterMonth,   setFilterMonth]   = useState('all');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [infoOpen,      setInfoOpen]      = useState(false);
  const [catDrill,      setCatDrill]      = useState(null); // null | { category, sub_prompts }

  // Loss Reduction data
  const [claims,    setClaims]    = useState([]);
  const [aggregate, setAggregate] = useState({});
  const [lrLoading, setLrLoading] = useState(true);
  const [lrError,   setLrError]   = useState(null);

  // Operational data
  const [opStats,       setOpStats]       = useState(null);
  const [opLoading,     setOpLoading]     = useState(true);
  const [opError,       setOpError]       = useState(null);
  // Global (all-time) processing time — used by efficiency journey regardless of selected month
  const [globalProcSecs, setGlobalProcSecs] = useState(null);

  // ── Load Loss Reduction data once on mount ─────────────────────────────────
  useEffect(() => {
    Promise.all([getLossReductionData(), getLossReductionAggregate()])
      .then(([data, agg]) => {
        setClaims(data.map(r => ({
          report_id:      r.report_id       ?? '',
          claim_number:   r.claim_number    ?? '',
          carrier:        r.carrier         ?? '',
          no_match:       r.no_match_count  ?? 0,
          match:          r.match_count     ?? 0,
          raise_:         r.raise_count     ?? 0,
          total_estimate: r.total_estimate_value ?? 0,
          loss_reduction: r.loss_reduction_value ?? 0,
          data_source:    r.data_source     ?? 'none',
          processed_at:   r.computed_at     ?? null,
          flagged_items:  r.flagged_items   ?? [],
        })));
        setAggregate(agg);
        setLrLoading(false);
      })
      .catch(err => { setLrError(err.message || 'Failed to load analytics data'); setLrLoading(false); });
  }, []);

  // ── Load global (all-time) processing time once on mount for efficiency journey ──
  useEffect(() => {
    getOperationalStats(null)
      .then(d => { if (d?.avg_processing_time_seconds != null) setGlobalProcSecs(d.avg_processing_time_seconds); })
      .catch(() => {});
  }, []);

  // ── Load Operational data on mount + when month changes ───────────────────
  useEffect(() => {
    setOpLoading(true);
    setOpError(null);
    const m = filterMonth === 'all' ? null : filterMonth;
    getOperationalStats(m)
      .then(d => { setOpStats(d); setOpLoading(false); })
      .catch(err => { setOpError(err.message || 'Failed to load operational data'); setOpLoading(false); });
  }, [filterMonth]);

  // ── Derived LR values ──────────────────────────────────────────────────────
  const availableMonths = useMemo(() => {
    const months = [...new Set(claims.map(c => c.processed_at?.slice(0, 7)).filter(Boolean))];
    return months.sort().reverse();
  }, [claims]);

  const filteredClaims = useMemo(() => {
    if (filterMonth === 'all') return claims;
    return claims.filter(c => c.processed_at?.startsWith(filterMonth));
  }, [claims, filterMonth]);

  const displayAgg = useMemo(() => {
    if (filterMonth === 'all') return aggregate;
    return {
      total_claims_processed:     filteredClaims.length,
      total_estimate_value:       filteredClaims.reduce((s, c) => s + c.total_estimate, 0),
      total_loss_reduction_value: filteredClaims.reduce((s, c) => s + c.loss_reduction, 0),
      total_no_match_flags:       filteredClaims.reduce((s, c) => s + c.no_match, 0),
      total_match_flags:          filteredClaims.reduce((s, c) => s + c.match, 0),
    };
  }, [filterMonth, filteredClaims, aggregate]);

  // ── Business Impact ────────────────────────────────────────────────────────
  const bizImpact = useMemo(() => {
    const n = displayAgg.total_claims_processed ?? 0;
    // Use actual processing time if available, else default to 4 min (240 sec)
    const procSecs   = opStats?.avg_processing_time_seconds ?? 240;
    const saveMin    = 240 - procSecs / 60;          // manual 4hr = 240 min baseline
    const hoursSaved = Math.round(n * saveMin / 60);
    const fteMonths  = (hoursSaved / 160).toFixed(1);
    const costSaved  = hoursSaved * 35;
    const annualProj = filterMonth === 'all' ? costSaved : costSaved * 12;
    return { hoursSaved, fteMonths, costSaved, annualProj, saveMin: saveMin.toFixed(1), procSecs };
  }, [displayAgg, filterMonth, opStats]);

  // ── Period selector ────────────────────────────────────────────────────────
  const periodSelector = (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel>Period</InputLabel>
      <Select value={filterMonth} label="Period"
        onChange={e => { setFilterMonth(e.target.value); setView('executive'); setCatDrill(null); }}>
        <MenuItem value="all">All Time</MenuItem>
        {availableMonths.map(m => <MenuItem key={m} value={m}>{fmtMonth(m)}</MenuItem>)}
      </Select>
    </FormControl>
  );

  // ── OPERATIONAL TAB ────────────────────────────────────────────────────────
  const renderOperational = () => {
    if (opLoading) return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
    );

    // Render full layout with safe defaults even when endpoint not yet deployed
    const {
      claims_submitted = 0, claims_validated = 0, unprocessed_count = 0,
      unprocessable_rate = 0, avg_warnings = 0, quality_score = 0,
      active_adjusters = 0, carrier_coverage = 0,
      avg_processing_time_seconds = null, processing_n = 0,
      adjuster_performance = [], status_breakdown = [],
      weekly_volume = [], top_failed_categories = [],
      prev_month: prev = null,
    } = opStats || {};

    const periodLabel = filterMonth === 'all' ? 'all time' : fmtMonth(filterMonth);
    const hasData = !!opStats;

    // KPI row 1
    const kpiRow1 = [
      {
        label: 'Claims Submitted',
        value: hasData ? claims_submitted.toLocaleString() : '—',
        sub: hasData ? `Total files uploaded to system · ${periodLabel}` : 'Pending backend deployment',
        trend: prev ? pctTrend(claims_submitted, prev.claims_submitted, false) : null,
        info: 'Total number of claim files submitted to the system in the selected month, regardless of processing outcome.',
      },
      {
        label: 'Claims Validated',
        value: hasData ? claims_validated.toLocaleString() : '—',
        sub: hasData
          ? (claims_submitted > 0 ? `${Math.round(claims_validated / claims_submitted * 100)}% of intake successfully processed` : 'Reports with completed AI validation')
          : 'Pending backend deployment',
        trend: prev ? pctTrend(claims_validated, prev.claims_validated, false) : null,
        info: 'Number of claim reports where the AI model completed all validation checks and produced a guidance report. Excludes files with missing documents or RAP status.',
      },
      {
        label: 'Unprocessable Rate',
        value: hasData ? `${unprocessable_rate}%` : '—',
        sub: hasData ? `${unprocessed_count} of ${claims_submitted} files — missing docs or RAP status` : 'Pending backend deployment',
        trend: prev ? ppTrend(unprocessable_rate, prev.unprocessable_rate, true) : null,
        info: 'Percentage of submitted files that could not be processed — due to missing documents or "Request for Additional Payment" (RAP) status. Lower is better.',
      },
      {
        label: 'Avg Warnings / Report',
        value: hasData ? avg_warnings.toFixed(1) : '—',
        sub: hasData ? '"No match" + "Raise" flags per generated report' : 'Pending backend deployment',
        trend: prev ? pctTrend(avg_warnings, prev.avg_warnings, true) : null,
        info: 'Average number of validation warnings per generated report. Lower means cleaner adjuster submissions. Computed from real Q&A flag data.',
      },
    ];

    // KPI row 2
    const kpiRow2 = [
      {
        label: 'Active Adjusters',
        value: hasData ? active_adjusters.toString() : '—',
        sub: hasData ? 'Unique named adjusters with processed submissions' : 'Pending backend deployment',
        trend: prev ? pctTrend(active_adjusters, prev.active_adjusters, false) : null,
        info: 'Number of distinct named adjusters with at least one successfully validated claim in the selected month. Reflects active field workforce utilization.',
      },
      {
        label: 'Claim Quality Score',
        value: hasData ? `${quality_score}%` : '—',
        sub: hasData ? `Avg match% across ${claims_validated} reports (per-report equal weight)` : 'Pending backend deployment',
        trend: prev ? ppTrend(quality_score, prev.quality_score, false) : null,
        info: 'Average "Match" percentage per individual report. Each report is weighted equally regardless of the number of questions. Higher = better adjuster submission quality.',
      },
      {
        label: 'Carrier Coverage',
        value: hasData ? carrier_coverage.toString() : '—',
        sub: hasData ? 'Distinct insurance carriers in portfolio' : 'Pending backend deployment',
        trend: prev ? pctTrend(carrier_coverage, prev.carrier_coverage, false) : null,
        info: 'Number of distinct insurance carriers (normalized) with claims in the selected period. Reflects business breadth and portfolio diversity.',
      },
      {
        label: 'Avg AI Processing Time',
        value: hasData ? fmtTime(avg_processing_time_seconds) : '—',
        sub: hasData
          ? (avg_processing_time_seconds != null
              ? `${processing_n} of ${claims_validated} reports instrumented · model runtime only`
              : 'Timestamps added Apr 8 — not backfilled for this month')
          : 'Pending backend deployment',
        trend: null,
        note: hasData && avg_processing_time_seconds == null ? 'Backfill pending' : null,
        info: 'Average time from model processing start to guidance report completion, computed from processing_started_at and processing_completed_at timestamps. Does not include upload or S3 transfer time.',
      },
    ];

    // Donut data
    const pieData = status_breakdown.map(s => ({
      name: s.status, value: s.count,
      fill: STATUS_COLORS[s.status] || STATUS_COLOR_DEFAULT,
    }));

    // Stacked bar data (gen + unprocessed per week)
    const barData = weekly_volume.map(w => ({
      name: w.label,
      gen:         w.gen   ?? 0,
      unprocessed: (w.total ?? w.count ?? 0) - (w.gen ?? 0),
    }));

    // Category chart: sort ascending (largest at top after recharts renders)
    const catData = [...top_failed_categories].reverse();

    // Category drill-down view
    if (catDrill) {
      const totalCat = catDrill.sub_prompts.reduce((s, p) => s + p.no_match_count, 0) || catDrill.no_match_count;
      const drillData = [...catDrill.sub_prompts].sort((a, b) => a.no_match_count - b.no_match_count);
      const drillDataDesc = [...catDrill.sub_prompts].sort((a, b) => b.no_match_count - a.no_match_count);
      return (
        <Box>
          <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Button startIcon={<ArrowBackIcon />} onClick={() => setCatDrill(null)} size="small" variant="outlined">
                Back to Categories
              </Button>
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{catDrill.category}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {totalCat.toLocaleString()} "No match" flags across {catDrill.sub_prompts.length} validation checks
                  {filterMonth !== 'all' ? ` · ${fmtMonth(filterMonth)}` : ''}
                </Typography>
              </Box>
            </Box>
            {drillData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(160, drillData.length * 44)}>
                <BarChart data={drillData} layout="vertical" margin={{ top: 0, right: 24, left: 260, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="question" tick={{ fontSize: 11 }} width={255}
                    tickFormatter={v => v?.length > 48 ? v.slice(0, 48) + '…' : v} />
                  <ReTooltip formatter={(v, n, p) => [v, p.payload.question]} />
                  <Bar dataKey="no_match_count" fill={teal} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">No sub-prompt breakdown available.</Typography>
            )}
            <Divider sx={{ my: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600, width: 36 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Prompt / Validation Check</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">No Match Flags</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">% of Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drillDataDesc.map((p, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500, fontSize: 13 }}>{p.question || '—'}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main" fontWeight={600}>{p.no_match_count.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>
                        {totalCat > 0 ? `${(p.no_match_count / totalCat * 100).toFixed(1)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      );
    }

    return (
      <Box>
        {opError && (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            Operational stats endpoint not yet deployed to this server — metrics will populate once the backend is updated.
          </Alert>
        )}

        {/* KPI Row 1 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 1.5 }}>
          {kpiRow1.map((k, i) => <OpKpiCard key={i} {...k} />)}
        </Box>

        {/* KPI Row 2 */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 1.5 }}>
          {kpiRow2.map((k, i) => <OpKpiCard key={i} {...k} />)}
        </Box>

        {/* Charts row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 1.5, mb: 1.5 }}>
          {/* Status donut */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
              File Status Breakdown
              <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400, ml: 1 }}>
                {claims_submitted > 0 ? `all ${claims_submitted} files` : ''}
              </Typography>
            </Typography>
            {pieData.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No data</Typography>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                      dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <ReTooltip formatter={(v, n) => [`${v} (${(v / claims_submitted * 100).toFixed(1)}%)`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 1 }}>
                  {pieData.map((s, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: s.fill, flexShrink: 0 }} />
                      <Typography sx={{ flex: 1, fontSize: 12, color: 'text.secondary' }}>{s.name}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{s.value}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', ml: 0.5 }}>
                        {claims_submitted > 0 ? `${(s.value / claims_submitted * 100).toFixed(1)}%` : ''}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Paper>

          {/* Weekly volume — stacked */}
          <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
              Claims Volume — Weekly
              <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400, ml: 1 }}>
                {periodLabel}
              </Typography>
            </Typography>
            {barData.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No data</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ReTooltip mode="index" />
                  <Legend iconType="square" iconSize={10}
                    formatter={v => <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>{v}</span>} />
                  <Bar dataKey="gen" name="Generated" stackId="a" fill="rgba(91,155,152,0.85)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="unprocessed" name="Unprocessed" stackId="a" fill="rgba(245,158,11,0.55)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Box>

        {/* Top Failed Categories */}
        <Paper elevation={1} sx={{ p: 2, mb: 1.5, borderRadius: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
            Top 10 Failed Validation Categories
            <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400, ml: 1 }}>
              by "No match" count{filterMonth !== 'all' ? ` · ${fmtMonth(filterMonth)} · ${claims_validated} generated reports` : ''}
            </Typography>
          </Typography>
          {catData.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No data</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={catData.length * 32 + 20}>
              <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 24, left: 180, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={175} />
                <ReTooltip formatter={(v) => [`${v} "No match" flags — click to drill down`]} />
                <Bar dataKey="no_match_count" cursor="pointer"
                  onClick={(data) => setCatDrill(data)}
                  radius={[0, 3, 3, 0]}>
                  {catData.map((entry, i) => (
                    <Cell key={i}
                      fill={i >= catData.length - 2 ? theme.palette.error.main : teal}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1, fontStyle: 'italic' }}>
            Click any bar to see the prompt-level flag breakdown for that category.
          </Typography>
        </Paper>

        {/* Adjuster Performance */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
            Adjuster Performance
            {filterMonth !== 'all' && (
              <Typography component="span" sx={{ fontSize: 13, color: 'primary.main', fontWeight: 500, ml: 1 }}>
                — {fmtMonth(filterMonth)}
              </Typography>
            )}
          </Typography>
          {adjuster_performance.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No adjuster data available. This requires adjuster names to be extracted from the loss reports.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Adjuster Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Claims Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Warnings</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Trend vs Last Month</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adjuster_performance.map((a, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{a.adjuster_name}</TableCell>
                      <TableCell align="right">{a.claims_count}</TableCell>
                      <TableCell align="right">
                        <Chip label={a.warnings_count} size="small"
                          sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 600, fontSize: 12, height: 22, cursor: 'default' }} />
                      </TableCell>
                      <TableCell align="right">
                        {a.trend === null || a.trend === undefined
                          ? <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: 10, bgcolor: 'action.hover', fontSize: 11, color: 'text.secondary' }}>N/A</Box>
                          : a.trend > 0
                            ? <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, color: 'error.main' }}>↑ {a.trend}%</Typography>
                            : a.trend < 0
                              ? <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, color: 'success.main' }}>↓ {Math.abs(a.trend)}%</Typography>
                              : <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>→ 0%</Typography>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1, fontStyle: 'italic' }}>
            Warnings = reports with ≥1 "No match" or "Raise" flag · Trend = % change in warnings vs previous month · N/A = first month in system for this adjuster
          </Typography>
        </Paper>
      </Box>
    );
  };

  // ── EXECUTIVE TAB ──────────────────────────────────────────────────────────
  const renderExecutive = () => {
    const prev = opStats?.prev_month ?? null;
    // Efficiency journey always uses the global all-time processing time (same regardless of month filter)
    const journeyProcSecs = globalProcSecs ?? opStats?.avg_processing_time_seconds ?? null;
    const reductionPct = journeyProcSecs != null
      ? ((240 * 60 - journeyProcSecs) / (240 * 60) * 100).toFixed(1)
      : '98.3';
    const currentTime = journeyProcSecs != null ? fmtTime(journeyProcSecs) : '~4 min';
    // Monthly processing time (for business impact formula note)
    const procSecs = opStats?.avg_processing_time_seconds ?? journeyProcSecs;

    return (
      <Box>
        {/* Journey */}
        <Paper elevation={1} sx={{ p: 2, mb: 1.5, borderRadius: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>
            The Efficiency Journey — Claims Processing Time per Claim
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', px: 2 }}>
            <Box sx={{ position: 'absolute', top: 28, left: 60, right: 60, height: 2, bgcolor: 'divider' }} />
            <Box sx={{ position: 'absolute', top: 28, left: 60, width: '66%', height: 2, bgcolor: 'primary.main' }} />
            {[
              { n: '1', time: '4 hrs',  label: 'Before tool\nManual QA — baseline',  badge: 'Baseline',           badgeSx: { bgcolor: 'action.hover', color: 'text.secondary' }, dotSx: { bgcolor: 'action.hover', border: '2px solid', borderColor: 'divider', color: 'text.secondary' } },
              { n: '2', time: '40 min', label: 'Early adoption\nPhase 1 deployment', badge: '−83% from baseline', badgeSx: { bgcolor: 'success.light', color: 'success.dark' },   dotSx: { bgcolor: 'action.hover', border: '2px solid', borderColor: 'divider', color: 'text.secondary' } },
              { n: '3', time: currentTime, label: 'Today\nCurrent production',       badge: `−${reductionPct}% from baseline`, badgeSx: { bgcolor: 'success.light', color: 'success.dark' }, dotSx: { bgcolor: 'primary.main', color: '#fff', boxShadow: `0 0 0 4px ${theme.palette.primary.light}` } },
            ].map((s, i) => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, zIndex: 1, flex: 1 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, ...s.dotSx }}>
                  {s.n}
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: i === 2 ? 'primary.main' : 'text.secondary' }}>
                  {s.time}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'center', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {s.label}
                </Typography>
                <Box sx={{ px: 1.25, py: 0.25, borderRadius: '10px', fontSize: 11, fontWeight: 600, ...s.badgeSx }}>
                  {s.badge}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Loss Reduction Panel */}
        <HeaderPanel headerBg={green} title="Loss Reduction Identified"
          note={filterMonth === 'all' ? 'All time' : fmtMonth(filterMonth)}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 1 }}>
            Executive Summary — all processed reports
          </Typography>
          <Box sx={{ display: 'flex', borderTop: 1, borderColor: 'divider', pt: 1 }}>
            {[
              {
                label: 'Total Estimate Value Reviewed',
                value: fmt$(displayAgg.total_estimate_value),
                sub: 'Total repair and replacement cost value across all claims reviewed',
              },
              {
                label: 'Total Loss Reduction',
                value: fmt$(displayAgg.total_loss_reduction_value),
                sub: 'Sum of dollar savings identified by the AI · click to drill down',
                valueColor: green,
                clickable: true,
                onClick: () => setView('drill'),
                action: (
                  <Tooltip title="How this is calculated">
                    <IconButton size="small" onClick={e => { e.stopPropagation(); setInfoOpen(true); }} sx={{ color: 'text.secondary', ml: 0.5 }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              },
              {
                label: 'Total "No Match" Flags',
                value: (displayAgg.total_no_match_flags ?? 0).toLocaleString(),
                sub: 'Validation checks where the AI identified a discrepancy',
              },
              {
                label: 'Claims Validated',
                value: displayAgg.total_claims_processed ?? 0,
                sub: 'Reports where the AI completed all validation checks',
              },
            ].map((m, i, arr) => (
              <Box key={i} sx={{ flex: 1, borderRight: i < arr.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                <PanelMetric {...m} />
              </Box>
            ))}
          </Box>
        </HeaderPanel>

        {/* Business Impact Panel */}
        <HeaderPanel headerBg={teal}
          title={`Business Impact${filterMonth !== 'all' ? ` — ${fmtMonth(filterMonth)}` : ''}`}
          note={`Based on ${displayAgg.total_claims_processed ?? 0} claims processed · at $35/hr`}>
          <Box sx={{ display: 'flex' }}>
            {[
              {
                label: filterMonth === 'all' ? 'Hours Saved (All Time)' : 'Hours Saved This Month',
                value: bizImpact.hoursSaved.toLocaleString(),
                sub: `${displayAgg.total_claims_processed ?? 0} claims × ${bizImpact.saveMin} min saved per claim`,
              },
              {
                label: 'FTE Months Equivalent',
                value: bizImpact.fteMonths,
                sub: `${bizImpact.hoursSaved.toLocaleString()} hrs ÷ 160 hrs/FTE`,
              },
              {
                label: filterMonth === 'all' ? 'Total Cost Saved' : 'Cost Saved This Month',
                value: fmt$(bizImpact.costSaved),
                sub: 'At $35/hr (Admin configurable)',
              },
              {
                label: filterMonth === 'all' ? 'Total Savings (All Time)' : 'Projected Annual Savings',
                value: fmt$(bizImpact.annualProj),
                sub: filterMonth === 'all' ? 'Cumulative since deployment' : 'Based on current month run rate × 12',
              },
            ].map((m, i, arr) => (
              <Box key={i} sx={{ flex: 1, borderRight: i < arr.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                <PanelMetric {...m} />
              </Box>
            ))}
          </Box>
          <Divider sx={{ mt: 1.5 }} />
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1, fontStyle: 'italic' }}>
            Formula: (Manual baseline 4 hrs − Current {currentTime}) × Claims processed × $35/hr
          </Typography>
        </HeaderPanel>

        {/* Exec KPI cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
          <ExecKpi label="Claims Validated"
            value={opStats?.claims_validated ?? displayAgg.total_claims_processed ?? '—'}
            sub={(() => {
              if (!opStats) return undefined;
              if (prev && prev.claims_validated > 0) {
                const c = Math.round((opStats.claims_validated - prev.claims_validated) / prev.claims_validated * 100);
                return `${c > 0 ? '+' : ''}${c}% vs prev month`;
              }
              return opStats.claims_submitted > 0
                ? `${Math.round(opStats.claims_validated / opStats.claims_submitted * 100)}% of ${opStats.claims_submitted.toLocaleString()} submissions`
                : undefined;
            })()}
            info="Number of claim reports where the AI model completed all validation checks and produced a guidance report. Excludes files with missing documents or RAP status." />
          <ExecKpi label="Claim Quality Score"
            value={opStats?.quality_score != null ? `${opStats.quality_score}%` : '—'}
            sub={(() => {
              if (!opStats || !prev) return `Avg of ${opStats?.claims_validated ?? '—'} reports`;
              const c = +(opStats.quality_score - prev.quality_score).toFixed(1);
              return `${c > 0 ? '+' : ''}${c}pp vs prev month`;
            })()}
            info="Average 'Match' percentage per individual report. Each report weighted equally regardless of number of questions. Higher = better adjuster submission quality." />
          <ExecKpi label="Unprocessable Rate"
            value={opStats?.unprocessable_rate != null ? `${opStats.unprocessable_rate}%` : '—'}
            sub={(() => {
              if (!opStats || !prev) return `${opStats?.unprocessed_count ?? '—'} of ${opStats?.claims_submitted ?? '—'} files`;
              const c = +(opStats.unprocessable_rate - prev.unprocessable_rate).toFixed(1);
              return `${c > 0 ? '+' : ''}${c}pp vs prev month`;
            })()}
            info="Percentage of submitted files that could not be processed — due to missing documents or 'Request for Additional Payment' (RAP) status. Lower is better." />
          <ExecKpi label="Active Adjusters"
            value={opStats?.active_adjusters ?? '—'}
            sub={`Unique named adjusters${filterMonth !== 'all' ? ` · ${fmtMonth(filterMonth)}` : ''}`}
            info="Number of distinct named adjusters with at least one successfully processed claim in the selected month. Reflects active field workforce utilization." />
        </Box>
      </Box>
    );
  };

  const renderDrill = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => setView('executive')} size="small" variant="outlined">
          Back to Executive View
        </Button>
        <Box>
          <Typography variant="h6" fontWeight={600}>All Processed Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} · Total loss reduction: <strong>{fmt$(displayAgg.total_loss_reduction_value)}</strong>
          </Typography>
        </Box>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Carrier</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Report ID · Claim #</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">No Match</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Match</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Total Estimate Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Loss Reduction</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Processed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No claims found for this period
                </TableCell>
              </TableRow>
            ) : (
              filteredClaims.map(c => (
                <TableRow key={c.report_id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedClaim(c); setView('flagDrill'); }}>
                  <TableCell>{c.carrier || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontFamily: 'monospace', fontSize: 12 }}>
                      {c.report_id}
                    </Typography>
                    {c.claim_number && (
                      <Typography variant="caption" color="text.secondary">{c.claim_number}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error.main" fontWeight={600}>{c.no_match}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>{c.match}</TableCell>
                  <TableCell align="right">
                    {c.total_estimate > 0
                      ? <>{fmt$(c.total_estimate)}{c.data_source === 'pdf_estimate' && <sup style={{ color: '#e65100', fontSize: 9, marginLeft: 2 }}>PDF</sup>}</>
                      : <Typography variant="body2" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell align="right">
                    {c.loss_reduction > 0
                      ? <Typography variant="body2" color="success.main" fontWeight={600}>{fmt$(c.loss_reduction)}</Typography>
                      : <Typography variant="body2" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    <Box>{fmtDate(c.processed_at)}</Box>
                    {c.processed_at && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.processed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Box sx={{ px: 1.5, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', fontStyle: 'italic' }}>
            Click a row to view flag detail. Dollar amounts from S3 Generic Rough Draft XML — rows showing — have no XML uploaded yet.
          </Typography>
        </Box>
      </TableContainer>
    </Box>
  );

  const renderFlagDrill = () => {
    const c = selectedClaim;
    const items = c?.flagged_items ?? [];
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => setView('drill')} size="small" variant="outlined">
            Back to All Reports
          </Button>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Flag Detail — {c?.claim_number || c?.report_id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {c?.carrier} · Report {c?.report_id} · {c?.no_match} No Match flags · Source: {c?.data_source === 'xml' ? 'XML' : c?.data_source === 'pdf_estimate' ? 'PDF (partial)' : 'pending'}
            </Typography>
          </Box>
        </Box>

        {(c?.data_source === 'pdf_estimate' || c?.data_source === 'pdf') && (
          <Alert severity="warning" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: 12 } }}>
            <strong>Partial estimate data — Generic Rough Draft XML not yet available.</strong> Summary-level financial flags (depreciation, O&amp;P, deductible, net claim, sales tax) have been extracted from the Final Report PDF. Item-level checks (waterline thresholds, door/window counts, appliances, AC tonnage) are shown as $0.
          </Alert>
        )}

        {items.length === 0 ? (
          <Alert severity="info">
            No financial flag detail available. The claim may have been processed before detailed flagged items were captured, or all No Match flags are non-financial.
          </Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Flagged Item (from guidance report)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Amount (from estimate)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Flag Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{FLAG_LABELS[item.type] || item.type}</Typography>
                      {item.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {item.amount > 0 ? (
                        <Typography variant="body2" color="success.main" fontWeight={600}>{fmt$(item.amount)}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">$0 <em style={{ fontSize: 11 }}>(item-level — XML only)</em></Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 10 }}>
                        {item.type}
                      </Typography>
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

  // ── Loading / error (Loss Reduction) ──────────────────────────────────────
  if (lrLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress />
    </Box>
  );
  if (lrError) return <Box sx={{ p: 3 }}><Alert severity="error">{lrError}</Alert></Box>;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Analytics &amp; Operations</Typography>
          <Typography variant="body2" color="text.secondary">Loss reduction metrics and operational performance</Typography>
        </Box>
        {periodSelector}
      </Box>

      {/* Tabs — Operational first, Executive second (matches mockup) */}
      <Tabs value={activeTab}
        onChange={(_, v) => { setActiveTab(v); setView('executive'); setCatDrill(null); }}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Operational" />
        <Tab label="Executive" />
      </Tabs>

      {/* Tab content */}
      {activeTab === 0 && renderOperational()}
      {activeTab === 1 && (
        <>
          {view === 'executive' && renderExecutive()}
          {view === 'drill'     && renderDrill()}
          {view === 'flagDrill' && renderFlagDrill()}
        </>
      )}

      <LossReductionInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </Box>
  );
}
