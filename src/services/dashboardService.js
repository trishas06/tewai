import axiosInstance from '../utils/axiosInstance';

export const dashboardService = {
  getClaimsData: async (page, rowsPerPage, filters = {}, searchTerm = '') => {
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
            item.claimNo.toLowerCase().includes(term) ||
            item.carrier.toLowerCase().includes(term) ||
            item.policyForm.toLowerCase().includes(term) ||
            item.adjusterName.toLowerCase().includes(term)
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
        data = data.filter(
          (item) => new Date(item.createdOn) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        data = data.filter(
          (item) => new Date(item.createdOn) <= new Date(filters.endDate)
        );
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
      const carriers = [...new Set(data.map((item) => item.carrier))].filter(
        Boolean
      );
      const policyForms = [
        ...new Set(data.map((item) => item.policyForm)),
      ].filter(Boolean);
      const adjusters = [
        ...new Set(data.map((item) => item.adjusterName)),
      ].filter(Boolean);
      const statuses = [...new Set(data.map((item) => item.status))].filter(
        Boolean
      );

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
