import '../../styles/css/admin.css';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatCard } from '../../components/admin/StatCard';

export const Dashboard = () => {
  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Selamat datang di admin portal CTRLBuild"
      />
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '1.5rem' 
      }}>
        <StatCard 
          label="Total Portfolios" 
          value="0"
        />
      </div>
    </div>
  );
};
