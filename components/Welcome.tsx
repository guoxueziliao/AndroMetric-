import React from 'react';
import { ShieldCheck, BarChart3, BrainCircuit, Flame } from 'lucide-react';

interface WelcomeProps {
    onGetStarted: () => void;
}

const FeatureCard: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 bg-blue-100 text-brand-accent p-3 rounded-full">
            <Icon size={24} />
        </div>
        <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-brand-muted">{description}</p>
        </div>
    </div>
);

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-brand-primary text-brand-text flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <main className="max-w-md w-full">
                <Flame size={64} className="mx-auto text-brand-accent mb-4" />
                <h1 className="text-4xl font-bold text-brand-accent mb-2">Welcome to AndroMetric</h1>
                <p className="text-brand-muted mb-8">专为您打造的、科学的男性健康指标追踪工具。</p>

                <div className="space-y-6 text-left mb-10">
                    <FeatureCard
                        icon={BarChart3}
                        title="记录与追踪"
                        description="通过直观的图标，轻松记录每日晨间状态与生活习惯。"
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        title="绝对隐私"
                        description="您的所有数据都安全地存储在您自己的设备上，绝不上传。"
                    />
                    <FeatureCard
                        icon={BrainCircuit}
                        title="发现洞察"
                        description="利用统计图表与因子分析，揭示身体活力背后的深层联系。"
                    />
                </div>
                
                <button
                    onClick={onGetStarted}
                    className="w-full px-6 py-4 text-lg font-semibold text-white bg-brand-accent rounded-lg shadow-md hover:bg-brand-accent-hover transition-all transform hover:scale-105"
                >
                    开始使用
                </button>
            </main>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Welcome;