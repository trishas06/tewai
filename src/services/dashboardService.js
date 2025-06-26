import axiosInstance from '../utils/axiosInstance';
import { ALLOWED_STATUSES } from '../utils/allowedStatuses';

export const dashboardService = {
  getClaimsData: async (
    page,
    rowsPerPage,
    filters = {},
    searchTerm = '',
    filterAllowedStatuses = true
  ) => {
    try {
      const response = await axiosInstance.get('/get_lossreport_data');

      // Transform the API response to match our table structure
      let data = response.data.message.map((item) => ({
        id: item._id || Math.random().toString(36).substring(2, 11),
        claimNo: item.claim_number || '',
        carrier: item.carrier || '',
        policyNo: item.policy_number || '',
        policyForm: item.policy_form || '',
        adjusterName: item.adjuster_name || '',
        createdOn: new Date(item.created_at).toLocaleString(),
        status: item.status || 'Pending',
        originalData: {
          adjuster_name: item.adjuster_name || '',
          carrier: item.carrier || '',
          claim_number: item.claim_number || '',
          created_at: item.created_at || '',
          json_output_s3_path: item.json_output_s3_path || '',
          loss_report_local_folder_path:
            item.loss_report_local_folder_path || '',
          loss_report_name: item.loss_report_name || '',
          loss_report_s3_path: item.loss_report_s3_path || '',
          policy_form: item.policy_form || '',
          policy_number: item.policy_number || '',
          report_id: item.report_id || '',
          status: item.status || '',
        },
      }));

      // Apply search term filtering
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        data = data.filter(
          (item) =>
            (item.claimNo && item.claimNo.toLowerCase().includes(term)) ||
            (item.carrier && item.carrier.toLowerCase().includes(term)) ||
            (item.policyNo && item.policyNo.toLowerCase().includes(term)) ||
            (item.policyForm && item.policyForm.toLowerCase().includes(term)) ||
            (item.adjusterName && item.adjusterName.toLowerCase().includes(term)) ||
            (item.originalData.loss_report_name && item.originalData.loss_report_name.toLowerCase().includes(term))
        );
      }

      // Apply advanced filters
      if (filters.carriers && filters.carriers.length > 0) {
        data = data.filter((item) => filters.carriers.includes(item.carrier));
      }

      if (filters.policyForms && filters.policyForms.length > 0) {
        data = data.filter((item) =>
          filters.policyForms.includes(item.policyForm)
        );
      }

      if (filters.adjusters && filters.adjusters.length > 0) {
        data = data.filter((item) =>
          filters.adjusters.includes(item.adjusterName)
        );
      }

      if (filters.statuses && filters.statuses.length > 0) {
        data = data.filter((item) => filters.statuses.includes(item.status));
      }

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        data = data.filter(
          (item) => new Date(item.createdOn) >= start
        );
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        data = data.filter(
          (item) => new Date(item.createdOn) <= end
        );
      }

      if (filterAllowedStatuses) {
        data = data.filter((item) => ALLOWED_STATUSES.includes(item.status));
      }

      // Calculate pagination values
      const totalCount = data.length;
      const paginatedData = data.slice(
        page * rowsPerPage,
        (page + 1) * rowsPerPage
      );

      return {
        data: paginatedData,
        totalCount,
      };
    } catch (error) {
      console.error('Error fetching claims data:', error);
      throw error;
    }
  },

  getFilterOptions: async () => {
    try {
      const response = await axiosInstance.get('/get_lossreport_data');

      // Transform the data
      const data = response.data.message.map((item) => ({
        claimNo: item.claim_number || '',
        carrier: item.carrier || '',
        policyNo: item.policy_number || '',
        policyForm: item.policy_form || '',
        adjusterName: item.adjuster_name || '',
        status: item.status || 'Pending',
      }));

      // Extract unique values for filters
      let carriers = [...new Set(data.map((item) => item.carrier))].filter(Boolean);
      let policyForms = [...new Set(data.map((item) => item.policyForm))].filter(Boolean);
      let adjusters = [...new Set(data.map((item) => item.adjusterName))].filter(Boolean);
      let statuses = [...new Set(data.map((item) => item.status))].filter(Boolean);

      // Only include statuses that are in ALLOWED_STATUSES
      statuses = statuses.filter((status) => ALLOWED_STATUSES.includes(status));

      // Helper to bring 'NA' to the top if present
      const bringNAToTop = (arr) => {
        const idx = arr.findIndex((v) => v === 'NA');
        if (idx > -1) {
          arr.splice(idx, 1);
          arr.unshift('NA');
        }
        return arr;
      };

      carriers = bringNAToTop(carriers);
      policyForms = bringNAToTop(policyForms);
      adjusters = bringNAToTop(adjusters);
      statuses = bringNAToTop(statuses);

      return {
        carriers,
        policyForms,
        adjusters,
        statuses,
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  },

  getNotifications: async () => {
    try {
      const response = await axiosInstance.get('/get_notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
};

export default dashboardService;
