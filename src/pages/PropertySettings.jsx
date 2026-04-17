import { useState } from "react";
import { Box, Paper, Typography, Tabs, Tab } from "@mui/material";
import ReportAnalysisPrompts from "./ReportAnalysisPrompts";
import ChatbotPredefinedQuestions from "./ChatbotPredefinedQuestions";
import PrelimReportAnalysisPrompts from "./PrelimReportAnalysisPrompts";

function PropertySettings() {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Admin Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage configurations
        </Typography>

        <ReportAnalysisPrompts source="property"/>

        {/* <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Final Report Analysis Prompts" />
          <Tab label="Prelim Report Analysis Prompts" />
          <Tab label="Chatbot Predefined Questions" />
        </Tabs> */}

        {/* {selectedTab === 0 && <ReportAnalysisPrompts />} */}
        {/* {selectedTab === 1 && <PrelimReportAnalysisPrompts />}
        {selectedTab === 2 && <ChatbotPredefinedQuestions />} */}
      </Paper>
    </Box>
  );
}

export default PropertySettings;
