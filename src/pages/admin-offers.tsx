import AdminLayout from '../components/AdminLayout';
import api from '../lib/api';
import { OfferManagementView } from '../components/OfferManagementView';

const AdminOffers: React.FC = () => (
  <OfferManagementView
    LayoutComponent={AdminLayout}
    apiClient={api}
    apiPrefix="/admin"
    title="Offer Management"
    subtitle="Create and manage discount coupons for your fleet"
    role="ADMIN"
  />
);

export default AdminOffers;
