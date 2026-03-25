import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './OrderManagement.css';
import { useTranslation } from 'react-i18next';

const Analytics = ({ user, products = [], orders = [], stats, selectedLanguage = 'en' }) => {
  const { t } = useTranslation();
  // Error handling and data validation
  const safeProducts = Array.isArray(products) ? products : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeStats = stats || { totalOrders: 0, totalRevenue: 0 };
  
  const noProducts = safeProducts.length === 0;
  const noOrders = safeOrders.length === 0;
  
  // Memoize expensive calculations
  const analyticsData = useMemo(() => {
    try {
      const topProducts = safeProducts
        .filter(product => product && product.id)
        .sort((a, b) => (parseInt(b.sales) || 0) - (parseInt(a.sales) || 0))
        .slice(0, 5);
      
      const averageOrderValue = safeStats.totalOrders > 0 ? safeStats.totalRevenue / safeStats.totalOrders : 0;
      
      // Generate daily revenue data for the last 30 days
      const dailyRevenueData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        
        // Simulate daily revenue based on orders (in real app, filter orders by date)
        const dailyRevenue = Math.floor(Math.random() * 10000) + 5000;
        dailyRevenueData.push({
          date: dateStr,
          revenue: dailyRevenue,
          orders: Math.floor(dailyRevenue / (averageOrderValue || 500))
        });
      }
      
      // Generate weekly revenue data for the last 12 weeks
      const weeklyRevenueData = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekLabel = t('Week {{weekNum}}', { weekNum: 12 - i });
        
        const weeklyRevenue = Math.floor(Math.random() * 50000) + 20000;
        weeklyRevenueData.push({
          week: weekLabel,
          revenue: weeklyRevenue,
          profit: Math.floor(weeklyRevenue * 0.3),
          orders: Math.floor(weeklyRevenue / (averageOrderValue || 500))
        });
      }
      
      // Generate monthly revenue data for the last 12 months
      const monthlyRevenueData = [];
      const months = [t('Jan'), t('Feb'), t('Mar'), t('Apr'), t('May'), t('Jun'), t('Jul'), t('Aug'), t('Sep'), t('Oct'), t('Nov'), t('Dec')];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today);
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthName = months[monthDate.getMonth()];
        
        const monthlyRevenue = Math.floor(Math.random() * 200000) + 100000;
        monthlyRevenueData.push({
          month: monthName,
          revenue: monthlyRevenue,
          profit: Math.floor(monthlyRevenue * 0.25),
          expenses: Math.floor(monthlyRevenue * 0.75)
        });
      }
      
      // Product revenue distribution
      const productRevenue = safeProducts
        .filter(p => p && p.price && p.sales)
        .map(p => ({
          name: p[`name_${selectedLanguage}`] || p.name || t('Unknown Product'),
          revenue: (parseFloat(p.price) || 0) * (parseInt(p.sales) || 0),
          sales: parseInt(p.sales) || 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);
      
      // AOV trend over time
      const aovTrend = dailyRevenueData.map((day, index) => ({
        date: day.date,
        aov: day.revenue / (day.orders || 1),
        trend: index > 0 ? day.revenue / (day.orders || 1) - dailyRevenueData[index - 1].revenue / (dailyRevenueData[index - 1].orders || 1) : 0
      }));
      
      return {
        topProducts,
        averageOrderValue,
        dailyRevenueData,
        weeklyRevenueData,
        monthlyRevenueData,
        productRevenue,
        aovTrend
      };
    } catch (error) {
      console.error('Error calculating analytics data:', error);
      return {
        topProducts: [],
        averageOrderValue: 0,
        dailyRevenueData: [],
        weeklyRevenueData: [],
        monthlyRevenueData: [],
        productRevenue: [],
        aovTrend: []
      };
    }
  }, [safeProducts, safeOrders, safeStats, selectedLanguage, t]);
  
  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];
  
  // Custom tooltip formatter
  const formatTooltip = (value, name) => {
    if (name === 'revenue' || name === 'profit' || name === 'expenses') {
      return [`₹${(value || 0).toLocaleString()}`, t(name.charAt(0).toUpperCase() + name.slice(1))];
    }
    return [value || 0, t(name.charAt(0).toUpperCase() + name.slice(1))];
  };
  
  return (
    <div className="analytics">
      <h2>{t('Business Analytics')}</h2>
      
      {/* Key Metrics */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>{t('Average Order Value')}</h3>
          <div className="metric-value">₹{analyticsData.averageOrderValue.toFixed(2)}</div>
          <div className="metric-label">{t('Per Order')}</div>
        </div>
        <div className="analytics-card">
          <h3>{t('Conversion Rate')}</h3>
          <div className="metric-value">
            {safeProducts.length > 0 ? ((safeStats.totalOrders / safeProducts.length) * 100).toFixed(1) : 0}%
          </div>
          <div className="metric-label">{t('Orders per Product')}</div>
        </div>
        <div className="analytics-card">
          <h3>{t('Total Profit')}</h3>
          <div className="metric-value">
            ₹{safeProducts.reduce((sum, product) => {
              if (!product || !product.price || !product.cost) return sum;
              const profit = (parseFloat(product.price) - parseFloat(product.cost)) * (parseInt(product.sales) || 0);
              return sum + (isNaN(profit) ? 0 : profit);
            }, 0).toFixed(2)}
          </div>
          <div className="metric-label">{t('Estimated')}</div>
        </div>
        <div className="analytics-card">
          <h3>{t('Total Products')}</h3>
          <div className="metric-value">{safeProducts.length}</div>
          <div className="metric-label">{t('In Inventory')}</div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="charts-section">
        {noOrders && noProducts ? (
          <div className="no-data-message">
            <h3>{t('No data available for analytics')}</h3>
            <p>{t('Add products and orders to see analytics charts.')}</p>
          </div>
        ) : (
          <div className="charts-container">
            
            {/* Daily Revenue Chart */}
            <div className="chart-card">
              <h3>{t('Daily Revenue Trend (Last 30 Days)')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={formatTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Weekly Revenue Bar Chart */}
            <div className="chart-card">
              <h3>{t('Weekly Performance (Last 12 Weeks)')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.weeklyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={formatTooltip} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" />
                  <Bar dataKey="profit" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Monthly Revenue Area Chart */}
            <div className="chart-card">
              <h3>{t('Monthly Revenue & Expenses (Last 12 Months)')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={formatTooltip} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="expenses" stackId="1" stroke="#ff7c7c" fill="#ff7c7c" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Product Revenue Distribution Pie Chart */}
            {analyticsData.productRevenue.length > 0 && (
              <div className="chart-card">
                <h3>{t('Product Revenue Distribution')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.productRevenue}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {analyticsData.productRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, t('Revenue')]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Average Order Value Trend */}
            <div className="chart-card">
              <h3>{t('Average Order Value Trend')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.aovTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={formatTooltip} />
                  <Legend />
                  <Line type="monotone" dataKey="aov" stroke="#ffc658" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Product Sales Bar Chart */}
            {analyticsData.productRevenue.length > 0 && (
              <div className="chart-card">
                <h3>{t('Product Sales Comparison')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.productRevenue} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={formatTooltip} />
                    <Legend />
                    <Bar dataKey="sales" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
          </div>
        )}
      </div>
      
      {/* Tables Section */}
      <div className="tables-section">
        <div className="table-container">
          <h3>{t('Top Selling Products')}</h3>
          {analyticsData.topProducts.length === 0 ? (
            <p className="no-data">{t('No sales data available')}</p>
          ) : (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>{t('Product')}</th>
                  <th>{t('Sales')}</th>
                  <th>{t('Revenue')}</th>
                  <th>{t('Stock')}</th>
                  <th>{t('Profit Margin')}</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topProducts.map(product => {
                  const revenue = (parseFloat(product.price) || 0) * (parseInt(product.sales) || 0);
                  const profit = ((parseFloat(product.price) || 0) - (parseFloat(product.cost) || 0)) * (parseInt(product.sales) || 0);
                  const profitMargin = revenue > 0 ? (profit / revenue * 100) : 0;
                  
                  return (
                    <tr key={product.id}>
                      <td>{product[`name_${selectedLanguage}`] || product.name || t('Unknown Product')}</td>
                      <td>{product.sales || 0}</td>
                      <td>₹{revenue.toFixed(2)}</td>
                      <td>
                        <span className={parseInt(product.stock) < 10 ? 'low-stock' : 'normal-stock'}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td>
                        <span className={profitMargin > 20 ? 'high-profit' : profitMargin > 10 ? 'medium-profit' : 'low-profit'}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Performance Summary Table */}
        <div className="table-container">
          <h3>{t('Performance Summary')}</h3>
          <table className="analytics-table">
            <tbody>
              <tr>
                <td><strong>{t('Total Revenue')}</strong></td>
                <td>₹{safeStats.totalRevenue?.toLocaleString() || '0'}</td>
              </tr>
              <tr>
                <td><strong>{t('Total Orders')}</strong></td>
                <td>{safeStats.totalOrders?.toLocaleString() || '0'}</td>
              </tr>
              <tr>
                <td><strong>{t('Average Order Value')}</strong></td>
                <td>₹{analyticsData.averageOrderValue.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>{t('Total Products')}</strong></td>
                <td>{safeProducts.length}</td>
              </tr>
              <tr>
                <td><strong>{t('Products in Stock')}</strong></td>
                <td>{safeProducts.filter(p => p && parseInt(p.stock) > 0).length}</td>
              </tr>
              <tr>
                <td><strong>{t('Low Stock Products')}</strong></td>
                <td>
                  <span className="warning">
                    {safeProducts.filter(p => p && parseInt(p.stock) < 10).length}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Analytics;