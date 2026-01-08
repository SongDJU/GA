'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, PieChartIcon } from 'lucide-react';

interface VoucherStats {
  totalVouchers: number;
  completedVouchers: number;
  pendingVouchers: number;
}

interface ContractStats {
  totalContracts: number;
  expiredContracts: number;
  expiringSoon: number;
  activeContracts: number;
}

interface DashboardChartsProps {
  voucherStats: VoucherStats;
  contractStats: ContractStats;
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

export function DashboardCharts({ voucherStats, contractStats }: DashboardChartsProps) {
  // 전표 처리율 데이터
  const voucherData = [
    { name: '처리완료', value: voucherStats.completedVouchers, color: '#22c55e' },
    { name: '미처리', value: voucherStats.pendingVouchers, color: '#f59e0b' },
  ];

  // 계약 만료 현황 데이터
  const contractData = [
    { name: '만료됨', value: contractStats.expiredContracts, color: '#ef4444' },
    { name: '만료임박\n(45일이내)', value: contractStats.expiringSoon, color: '#f59e0b' },
    { name: '정상', value: contractStats.activeContracts, color: '#22c55e' },
  ];

  // 처리율 계산
  const processingRate = voucherStats.totalVouchers > 0 
    ? Math.round((voucherStats.completedVouchers / voucherStats.totalVouchers) * 100) 
    : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 전표 처리율 차트 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-slate-50/50 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-blue-600" />
            이번 달 전표 처리율
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={voucherData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {voucherData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}건`, '']}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 ml-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">처리율</p>
                <p className="text-4xl font-bold text-blue-600">{processingRate}%</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>처리완료</span>
                  </div>
                  <span className="font-medium">{voucherStats.completedVouchers}건</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>미처리</span>
                  </div>
                  <span className="font-medium">{voucherStats.pendingVouchers}건</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-2 mt-2">
                  <span className="text-gray-500">전체</span>
                  <span className="font-medium">{voucherStats.totalVouchers}건</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 계약 만료 현황 차트 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-slate-50/50 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            계약 만료 현황
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={contractData} 
                layout="vertical"
                margin={{ left: 10, right: 30 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={80}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value) => [`${value}건`, '']}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)' 
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                >
                  {contractData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-sm border-t pt-3 mt-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-gray-500">만료</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-gray-500">임박</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500">정상</span>
              </div>
            </div>
            <span className="text-gray-500">총 {contractStats.totalContracts}건</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
